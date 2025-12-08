const prisma = require("../config/prisma");
const { queueNotification } = require("../utils/queueNotification");

const ALLOWED_TARGET_STATUSES = Object.freeze([
  "Approved",
  "Rejected", 
  "Re-Approved",
  "Re-Rejected",
]);

const KNOWN_STATUSES = Object.freeze([
  "Pending",
  "Approved",
  "Rejected",
  "Re-Pending",
  "Re-Approved",
  "Re-Rejected",
]);

/** Make sure we always end with an array. */
function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

/** Best-effort integer coercion. */
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/** Uniform JSON error response. */
function sendJsonError(res, status, message, extra = {}) {
  return res.status(status).json({
    success: false,
    error: httpStatusLabel(status),
    message,
    ...extra,
  });
}

/** Label codes for logs/responses. */
function httpStatusLabel(code) {
  switch (code) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    default:
      return "Internal Server Error";
  }
}

/* ============================================================================
 * Admin Controller
 * ========================================================================== */

class AdminController {
  /**
   * POST /api/admin/worklogs
   * Fetch ALL worklogs (employees + SPOCs) for admin between inclusive date range.
   * Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", employees?: string[], auditStatus?: string[] }
   */
  static async getWorklogs(req, res) {
    const t0 = Date.now();
    try {
      const adminEmail = req.user?.email || null;
      if (!adminEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      const { 
        startDate, 
        endDate, 
        employees: filterEmployees,
        auditStatus: filterAuditStatus 
      } = req.body || {};

      if (!startDate || !endDate) {
        return sendJsonError(res, 400, "startDate and endDate (YYYY-MM-DD) are required.");
      }

      const start = parseISOStart(startDate);
      const end = parseISOEnd(endDate);
      if (!start || !end) {
        return sendJsonError(res, 400, "Invalid date format. Use YYYY-MM-DD.");
      }

      // Get all employees and SPOCs for admin view
      const allUsers = await getAllUsersForAdmin();
      const safeUsers = asArray(allUsers);
      
      if (safeUsers.length === 0) {
        return res.json({
          success: true,
          worklogsByDate: {},
          totalCount: 0,
          userCount: 0,
          message: "No users found in the system.",
        });
      }

      // Determine which users to filter by
      const allNames = safeUsers.map((u) => u.name).filter(Boolean);
      const namesToUse = Array.isArray(filterEmployees) && filterEmployees.length > 0
        ? filterEmployees
        : allNames;

      // Build where clause for worklogs
      let whereClause = {
        name: { in: namesToUse },
        date: { gte: start, lte: end },
      };

      // Add audit status filter if provided
      if (Array.isArray(filterAuditStatus) && filterAuditStatus.length > 0 && !filterAuditStatus.includes('all')) {
        whereClause.audit_status = { in: filterAuditStatus };
      }

      // Fetch worklogs
      let worklogs = [];
      try {
        worklogs = await prisma.masterDatabase.findMany({
          where: whereClause,
          orderBy: [{ date: "desc" }, { name: "asc" }, { id: "asc" }],
        });
      } catch (err) {
        console.error("[admin getWorklogs] Prisma findMany error:", err);
        return sendJsonError(res, 500, "Database error while fetching worklogs.", {
          details: err?.message || String(err),
        });
      }

      // Group by date for UI
      const byDate = Object.create(null);
      for (const log of worklogs) {
        const dateKey = toISODateKey(log.date);
        if (!byDate[dateKey]) byDate[dateKey] = [];

        const user = safeUsers.find((u) => u.name === log.name);
        
        byDate[dateKey].push({
          _id: log.id,
          employeeName: log.name,
          employeeEmail: user?.email || "",
          userRole: user?.role || "Unknown",
          userInitials: getUserInitials(log.name),
          workMode: log.work_mode,
          projectName: log.project_name,
          task: log.task_name,
          bookElement: log.book_element,
          chapterNo: log.chapter_number,
          hoursSpent: log.hours_spent,
          noOfUnits: log.number_of_units,
          unitType: log.unit_type,
          status: log.status,
          dueOn: log.due_on,
          details: log.details || "",
          auditStatus: log.audit_status,
          team: log.team,
          date: log.date,
        });
      }

      // Sort date keys desc
      const worklogsByDate = {};
      Object.keys(byDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach((k) => (worklogsByDate[k] = byDate[k]));

      const t1 = Date.now();
      console.log(
        `[admin getWorklogs] Admin=${adminEmail} items=${worklogs.length} in ${t1 - t0}ms`
      );

      return res.json({
        success: true,
        worklogsByDate,
        totalCount: worklogs.length,
        userCount: safeUsers.length,
      });

    } catch (error) {
      console.error("[admin getWorklogs] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * PUT /api/admin/worklogs/update-status
   * Update a single worklog's audit status (admin has override powers).
   * Body: { worklogId: number|string, auditStatus: "Approved"|"Rejected"|"Re-Approved"|"Re-Rejected", adminComments?: string }
   */
  static async updateWorklogStatus(req, res) {
    const t0 = Date.now();
    try {
      const { worklogId, auditStatus } = req.body || {};
      const adminEmail = req.user?.email || null;
      const adminName = req.user?.name || null;

      if (!worklogId || !auditStatus) {
        return sendJsonError(res, 400, "worklogId and auditStatus are required.");
      }

      if (!ALLOWED_TARGET_STATUSES.includes(auditStatus)) {
        return sendJsonError(
          res,
          400,
          `auditStatus must be one of: ${ALLOWED_TARGET_STATUSES.join(", ")}`
        );
      }

      const idInt = toInt(worklogId);
      if (!Number.isFinite(idInt) || Number.isNaN(idInt)) {
        return sendJsonError(res, 400, "worklogId must be an integer.");
      }

      // Load worklog
      let worklog = null;
      try {
        worklog = await prisma.masterDatabase.findUnique({ where: { id: idInt } });
      } catch (err) {
        console.error("[admin updateWorklogStatus] Prisma findUnique error:", err);
        return sendJsonError(res, 500, "Database error while retrieving worklog.", {
          details: err?.message || String(err),
        });
      }

      if (!worklog) {
        return sendJsonError(res, 404, "Worklog not found.");
      }

      const current = (worklog.audit_status || "Pending").trim();

      // Update worklog
      const updateData = {
        audit_status: auditStatus,
      };

      let updated = null;
      try {
        updated = await prisma.masterDatabase.update({
          where: { id: idInt },
          data: updateData,
        });
      } catch (err) {
        console.error("[admin updateWorklogStatus] Prisma update error:", err);
        return sendJsonError(res, 500, "Database error while updating worklog.", {
          details: err?.message || String(err),
        });
      }

      // ✅ QUEUE NOTIFICATION FOR EMPLOYEE/SPOC - FIXED
      try {
        const user = await prisma.users.findFirst({
          where: { name: worklog.name },
          select: { id: true, email: true, name: true, role: true }
        });

        if (user) {
          console.log(`📋 Found user ${user.name} (ID: ${user.id}) for notification`);
          
          // Check if user is SPOC or Employee
          const isSpoc = user.role?.toLowerCase() === 'spoc';

          let notificationType;
          if (auditStatus === "Approved" || auditStatus === "Re-Approved") {
            notificationType = isSpoc ? "SPOC_ENTRY_APPROVED_BY_ADMIN" : "ENTRY_APPROVED_BY_ADMIN";
          } else if (auditStatus === "Rejected" || auditStatus === "Re-Rejected") {
            notificationType = isSpoc ? "SPOC_ENTRY_REJECTED_BY_ADMIN" : "ENTRY_REJECTED_BY_ADMIN";
          }

          if (notificationType) {
            const notificationData = isSpoc ? {
              spocId: user.id,
              adminName: adminName || adminEmail,
              entryDate: worklog.date,
              entryId: worklog.id,
              reason: auditStatus.includes("Rejected") ? "Entry rejected by Admin" : undefined,
            } : {
              employeeId: user.id,
              adminName: adminName || adminEmail,
              entryDate: worklog.date,
              entryId: worklog.id,
              reason: auditStatus.includes("Rejected") ? "Entry rejected by Admin" : undefined,
            };

            await queueNotification({
              userId: user.id,
              type: notificationType,
              data: notificationData
            });
            
            console.log(`📮 Queued notification ${notificationType} for user ${user.name} (ID: ${user.id})`);
          }
        } else {
          console.log(`⚠️ No user found with name: ${worklog.name}`);
        }
      } catch (notifError) {
        console.error("[admin updateWorklogStatus] Notification queue error:", notifError);
        // Don't fail the request if notification fails
      }

      const t1 = Date.now();
      console.log(
        `[admin updateWorklogStatus] id=${idInt} ${current} -> ${auditStatus} OK in ${t1 - t0}ms`
      );

      return res.json({
        success: true,
        message: `Worklog updated to "${auditStatus}" successfully`,
        worklog: {
          id: updated.id,
          employeeName: updated.name,
          projectName: updated.project_name,
          auditStatus: updated.audit_status,
        },
      });

    } catch (error) {
      console.error("[admin updateWorklogStatus] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * PUT /api/admin/worklogs/bulk-update-status
   * Bulk update multiple worklogs (admin override - no restrictions).
   */
  static async bulkUpdateWorklogStatus(req, res) {
    const t0 = Date.now();
    try {
      const { worklogIds, auditStatus } = req.body || {};
      const adminEmail = req.user?.email || null;
      const adminName = req.user?.name || null;

      if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
        return sendJsonError(res, 400, "worklogIds (array) is required.");
      }

      if (!ALLOWED_TARGET_STATUSES.includes(auditStatus)) {
        return sendJsonError(
          res,
          400,
          `auditStatus must be one of: ${ALLOWED_TARGET_STATUSES.join(", ")}`
        );
      }

      const ids = worklogIds
        .map((x) => toInt(x))
        .filter((n) => Number.isFinite(n) && !Number.isNaN(n));

      if (ids.length === 0) {
        return sendJsonError(res, 400, "No valid integer IDs provided.");
      }

      // Load worklogs to get employee names for notifications
      let worklogsToUpdate = [];
      try {
        worklogsToUpdate = await prisma.masterDatabase.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, date: true, audit_status: true }
        });
      } catch (err) {
        console.error("[admin bulkUpdateWorklogStatus] Prisma findMany error:", err);
        return sendJsonError(res, 500, "Database error while loading worklogs.", {
          details: err?.message || String(err),
        });
      }

      if (worklogsToUpdate.length !== ids.length) {
        return sendJsonError(res, 404, "Some worklogs were not found.");
      }

      const updateData = {
        audit_status: auditStatus,
      };

      // Bulk update
      let result = null;
      try {
        result = await prisma.masterDatabase.updateMany({
          where: { id: { in: ids } },
          data: updateData,
        });
      } catch (err) {
        console.error("[admin bulkUpdateWorklogStatus] Prisma updateMany error:", err);
        return sendJsonError(res, 500, "Database error while bulk-updating worklogs.", {
          details: err?.message || String(err),
        });
      }

      // ✅ QUEUE NOTIFICATIONS FOR ALL AFFECTED USERS - FIXED
      try {
        const uniqueUserNames = [...new Set(worklogsToUpdate.map(w => w.name))];

        for (const userName of uniqueUserNames) {
          const user = await prisma.users.findFirst({
            where: { name: userName },
            select: { id: true, email: true, name: true, role: true }
          });

          if (user) {
            console.log(`📋 Found user ${user.name} (ID: ${user.id}) for bulk notification`);
            
            const isSpoc = user.role?.toLowerCase() === 'spoc';
            const userEntries = worklogsToUpdate.filter(w => w.name === userName);

            let notificationType;
            if (auditStatus === "Approved" || auditStatus === "Re-Approved") {
              notificationType = isSpoc ? "SPOC_ENTRY_APPROVED_BY_ADMIN" : "ENTRY_APPROVED_BY_ADMIN";
            } else if (auditStatus === "Rejected" || auditStatus === "Re-Rejected") {
              notificationType = isSpoc ? "SPOC_ENTRY_REJECTED_BY_ADMIN" : "ENTRY_REJECTED_BY_ADMIN";
            }

            if (notificationType) {
              // For bulk updates, send one notification per user mentioning multiple entries
              const notificationData = isSpoc ? {
                spocId: user.id,
                adminName: adminName || adminEmail,
                entryDate: userEntries[0].date,
                entryId: userEntries[0].id,
                bulkCount: userEntries.length,
                reason: auditStatus.includes("Rejected") ? `${userEntries.length} entries rejected by Admin` : undefined,
              } : {
                employeeId: user.id,
                adminName: adminName || adminEmail,
                entryDate: userEntries[0].date,
                entryId: userEntries[0].id,
                bulkCount: userEntries.length,
                reason: auditStatus.includes("Rejected") ? `${userEntries.length} entries rejected by Admin` : undefined,
              };

              await queueNotification({
                userId: user.id,
                type: notificationType,
                data: notificationData
              });
              
              console.log(`📮 Queued bulk notification ${notificationType} for user ${user.name} (${userEntries.length} entries)`);
            }
          } else {
            console.log(`⚠️ No user found with name: ${userName}`);
          }
        }
      } catch (notifError) {
        console.error("[admin bulkUpdateWorklogStatus] Notification queue error:", notifError);
        // Don't fail the request if notification fails
      }

      const t1 = Date.now();
      console.log(
        `[admin bulkUpdateWorklogStatus] count=${ids.length} -> ${auditStatus} in ${t1 - t0}ms`
      );

      return res.json({
        success: true,
        count: result?.count ?? 0,
        message: `Updated ${result?.count ?? 0} worklog(s) to ${auditStatus}.`,
        auditStatus,
      });

    } catch (error) {
      console.error("[admin bulkUpdateWorklogStatus] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * GET /api/admin/worklogs/summary
   * Summary counters for admin dashboard.
   */
  static async getWorklogSummary(req, res) {
    try {
      const adminEmail = req.user?.email || null;
      if (!adminEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      // Get date range filter if provided
      let dateFilter = {};
      const { dateRange } = req.query;
      if (dateRange) {
        try {
          const { startDate, endDate } = JSON.parse(dateRange);
          if (startDate && endDate) {
            const start = parseISOStart(startDate);
            const end = parseISOEnd(endDate);
            if (start && end) {
              dateFilter.date = { gte: start, lte: end };
            }
          }
        } catch (e) {
          console.error("Error parsing dateRange:", e);
        }
      }

      // Get summary counts
      const [
        totalCount,
        pendingCount, 
        approvedCount, 
        rejectedCount, 
        rependingCount,
        reapprovedCount,
        rerejectedCount
      ] = await Promise.all([
        prisma.masterDatabase.count({ where: dateFilter }).catch(() => 0),
        prisma.masterDatabase.count({ where: { ...dateFilter, audit_status: "Pending" } }).catch(() => 0),
        prisma.masterDatabase.count({ where: { ...dateFilter, audit_status: "Approved" } }).catch(() => 0),
        prisma.masterDatabase.count({ where: { ...dateFilter, audit_status: "Rejected" } }).catch(() => 0),
        prisma.masterDatabase.count({ where: { ...dateFilter, audit_status: "Re-Pending" } }).catch(() => 0),
        prisma.masterDatabase.count({ where: { ...dateFilter, audit_status: "Re-Approved" } }).catch(() => 0),
        prisma.masterDatabase.count({ where: { ...dateFilter, audit_status: "Re-Rejected" } }).catch(() => 0),
      ]);

      // Get user-wise summary
      let userSummary = [];
      try {
        const users = await getAllUsersForAdmin();
        const userNames = users.map(u => u.name).filter(Boolean);

        if (userNames.length > 0) {
          const userStats = await prisma.masterDatabase.groupBy({
            by: ['name'],
            where: {
              ...dateFilter,
              name: { in: userNames }
            },
            _count: {
              id: true
            }
          });

          userSummary = userStats.map(stat => {
            const user = users.find(u => u.name === stat.name);
            return {
              _id: user?.id || stat.name,
              userName: stat.name,
              userRole: user?.role || 'Unknown',
              totalWorklogs: stat._count.id
            };
          }).sort((a, b) => b.totalWorklogs - a.totalWorklogs);
        }
      } catch (err) {
        console.error("[admin getWorklogSummary] userSummary error:", err);
      }

      return res.json({
        success: true,
        summary: {
          totalWorklogs: totalCount,
          pendingWorklogs: pendingCount,
          approvedWorklogs: approvedCount,
          rejectedWorklogs: rejectedCount,
          rePendingWorklogs: rependingCount,
          reApprovedWorklogs: reapprovedCount,
          reRejectedWorklogs: rerejectedCount,
          pendingApprovals: pendingCount + rependingCount,
          breakdown: {
            pending: pendingCount,
            rePending: rependingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            reApproved: reapprovedCount,
            reRejected: rerejectedCount,
          }
        },
        userSummary
      });

    } catch (error) {
      console.error("[admin getWorklogSummary] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * GET /api/admin/users
   * Get all users (employees and SPOCs) for admin dashboard filters.
   */
  static async getAllUsers(req, res) {
    try {
      const adminEmail = req.user?.email || null;
      if (!adminEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      const users = await getAllUsersForAdmin();
      const formattedUsers = users.map(user => ({
        _id: user.id,
        name: user.name,
        email: user.email,
        spoc_name: user.spoc_name,
        spoc_email: user.spoc_email,
        role: user.role,
        team: user.team,
        initials: getUserInitials(user.name)
      }));

      return res.json({
        success: true,
        users: formattedUsers,
        count: formattedUsers.length,
      });

    } catch (error) {
      console.error("[admin getAllUsers] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * GET /api/admin/users/by-role
   * Get users separated by role (employees and SPOCs).
   */
  static async getUsersByRole(req, res) {
    try {
      const adminEmail = req.user?.email || null;
      if (!adminEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      const allUsers = await getAllUsersForAdmin();
      
      const employees = allUsers
        .filter(u => isEmployeeRole(u.role))
        .map(user => ({
          _id: user.id,
          name: user.name,
          email: user.email,
          team: user.team,
          initials: getUserInitials(user.name)
        }));

      const spocs = allUsers
        .filter(u => isSpocRole(u.role))
        .map(user => ({
          _id: user.id,
          name: user.name,
          email: user.email,
          team: user.team,
          initials: getUserInitials(user.name)
        }));

      return res.json({
        success: true,
        employees,
        spocs,
        counts: {
          employees: employees.length,
          spocs: spocs.length,
          total: employees.length + spocs.length
        }
      });

    } catch (error) {
      console.error("[admin getUsersByRole] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }
}

module.exports = AdminController;

/* ============================================================================
 * Helpers (dates, user lookup, utilities)
 * ========================================================================== */

/** parseISOStart("YYYY-MM-DD") -> Date UTC 00:00:00.000 (null if invalid) */
function parseISOStart(s) {
  try {
    const d = new Date(`${s}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/** parseISOEnd("YYYY-MM-DD") -> Date UTC 23:59:59.999 (null if invalid) */
function parseISOEnd(s) {
  try {
    const d = new Date(`${s}T23:59:59.999Z`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/** toISODateKey(Date) -> "YYYY-MM-DD" (UTC) */
function toISODateKey(d) {
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get user initials from name */
function getUserInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Check if role is employee */
function isEmployeeRole(role) {
  if (!role) return false;
  const r = role.toString().toLowerCase();
  return r === 'employee' || r === 'emp';
}

/** Check if role is SPOC */
function isSpocRole(role) {
  if (!role) return false;
  const r = role.toString().toLowerCase();
  return r === 'spoc' || r === 'poc';
}


async function getAllUsersForAdmin() {
  // Uppercase (enum style)
  try {
    const res = await prisma.users.findMany({
      where: { role: { in: ["EMPLOYEE", "SPOC"] } },
      select: { id: true, name: true, email: true, team: true, spoc_name: true, role: true },
      orderBy: { name: "asc" },
    });
    if (res.length) return res;
  } catch {}

  // lowercase
  try {
    const res = await prisma.users.findMany({
      where: { role: { in: ["employee", "spoc"] } },
      select: { id: true, name: true, email: true, team: true, spoc_name: true, role: true },
      orderBy: { name: "asc" },
    });
    if (res.length) return res;
  } catch {}

  // Capitalized
  try {
    const res = await prisma.users.findMany({
      where: { role: { in: ["Employee", "Spoc"] } },
      select: { id: true, name: true, email: true, team: true, spoc_name: true, role: true },
      orderBy: { name: "asc" },
    });
    if (res.length) return res;
  } catch {}

  // Raw SQL fallback
  try {
    const res = await prisma.$queryRaw`
      SELECT id, name, email, team, spoc_name, role
      FROM "Users"
      WHERE role::text IN ('EMPLOYEE','Employee','employee','SPOC','Spoc','spoc')
      ORDER BY name ASC
    `;
    return res || [];
  } catch {
    return [];
  }
}
