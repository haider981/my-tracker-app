// const prisma = require("../config/prisma");

// const ALLOWED_TARGET_STATUSES = Object.freeze([
//   "Approved",
//   "Rejected",
//   "Re-Approved",
//   "Re-Rejected",
// ]);

// /** Known statuses for validation/summaries. */
// const KNOWN_STATUSES = Object.freeze([
//   "Pending",
//   "Approved",
//   "Rejected",
//   "Re-Pending",
//   "Re-Approved",
//   "Re-Rejected",
// ]);

// /** Make sure we always end with an array. */
// function asArray(value) {
//   if (Array.isArray(value)) return value;
//   if (value == null) return [];
//   return [value];
// }

// /** Best-effort integer coercion. */
// function toInt(value) {
//   const n = Number(value);
//   return Number.isFinite(n) ? Math.trunc(n) : NaN;
// }

// /** Uniform JSON error response. */
// function sendJsonError(res, status, message, extra = {}) {
//   return res.status(status).json({
//     success: false,
//     error: httpStatusLabel(status),
//     message,
//     ...extra,
//   });
// }

// /** Label codes for logs/responses. */
// function httpStatusLabel(code) {
//   switch (code) {
//     case 400:
//       return "Bad Request";
//     case 401:
//       return "Unauthorized";
//     case 403:
//       return "Forbidden";
//     case 404:
//       return "Not Found";
//     case 409:
//       return "Conflict";
//     default:
//       return "Internal server error";
//   }
// }

// /* ============================================================================
//  * Controller
//  * ========================================================================== */

// class SpocController {
//   /**
//    * POST /api/spoc/worklogs
//    * Fetch worklogs for a SPOC between inclusive date range.
//    * Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", employees?: string[] }
//    */
//   static async getWorklogs(req, res) {
//     const t0 = Date.now();
//     try {
//       const spocEmail = req.user?.email || null;
//       if (!spocEmail) {
//         return sendJsonError(res, 401, "Missing user email in token.");
//       }

//       const { startDate, endDate, employees: filterEmployees } = req.body || {};
//       if (!startDate || !endDate) {
//         return sendJsonError(res, 400, "startDate and endDate (YYYY-MM-DD) are required.");
//       }

//       const start = parseISOStart(startDate);
//       const end = parseISOEnd(endDate);
//       if (!start || !end) {
//         return sendJsonError(res, 400, "Invalid date format. Use YYYY-MM-DD.");
//       }

//       // Employees mapped to SPOC
//       const employeesUnderSpoc = await findEmployeesBySpoc(spocEmail);
//       const safeEmployees = asArray(employeesUnderSpoc);
//       if (safeEmployees.length === 0) {
//         return res.json({
//           success: true,
//           worklogsByDate: {},
//           totalCount: 0,
//           employeeCount: 0,
//           message: "No employees found under this SPOC.",
//         });
//       }

//       const allNames = safeEmployees.map((e) => e.name).filter(Boolean);
//       const namesToUse =
//         Array.isArray(filterEmployees) && filterEmployees.length > 0
//           ? filterEmployees
//           : allNames;

//       // Fetch rows
//       let worklogs = [];
//       try {
//         worklogs = await prisma.masterDatabase.findMany({
//           where: {
//             name: { in: namesToUse },
//             date: { gte: start, lte: end },
//           },
//           orderBy: [{ date: "desc" }, { name: "asc" }, { id: "asc" }],
//         });
//       } catch (err) {
//         console.error("[getWorklogs] Prisma findMany error:", err);
//         return sendJsonError(res, 500, "Database error while fetching worklogs.", {
//           details: err?.message || String(err),
//         });
//       }

//       // Group by date for UI
//       const byDate = Object.create(null);
//       for (const log of worklogs) {
//         const dateKey = toISODateKey(log.date);
//         if (!byDate[dateKey]) byDate[dateKey] = [];

//         const u = safeEmployees.find((e) => e.name === log.name);

//         byDate[dateKey].push({
//           _id: log.id,
//           employeeName: log.name,
//           employeeEmail: u?.email || "",
//           workMode: log.work_mode,
//           projectName: log.project_name,
//           task: log.task_name,
//           bookElement: log.book_element,
//           chapterNo: log.chapter_number,
//           hoursSpent: log.hours_spent,
//           noOfUnits: log.number_of_units,
//           unitType: log.unit_type,
//           status: log.status,
//           dueOn: log.due_on,
//           details: log.details || "",
//           auditStatus: log.audit_status,
//           team: log.team,
//           date: log.date,
//         });
//       }

//       // Sort date keys desc
//       const worklogsByDate = {};
//       Object.keys(byDate)
//         .sort((a, b) => new Date(b) - new Date(a))
//         .forEach((k) => (worklogsByDate[k] = byDate[k]));

//       const t1 = Date.now();
//       console.log(
//         `[getWorklogs] SPOC=${spocEmail} items=${worklogs.length} in ${t1 - t0}ms`
//       );

//       return res.json({
//         success: true,
//         worklogsByDate,
//         totalCount: worklogs.length,
//         employeeCount: safeEmployees.length,
//       });
//     } catch (error) {
//       console.error("[getWorklogs] Error:", error);
//       return sendJsonError(res, 500, "Internal server error", {
//         message: error?.message || String(error),
//       });
//     }
//   }

//   /**
//    * PUT /api/spoc/worklogs/update-status
//    * Update a single worklog's audit status with window + transition checks.
//    *
//    * Body: { worklogId: number|string, auditStatus: "Approved"|"Rejected"|"Re-Approved"|"Re-Rejected" }
//    *
//    * Allowed:
//    *   Pending     -> Approved / Rejected              (phase === "D+0..3")
//    *   Re-Pending  -> Re-Approved / Re-Rejected        (phase ∈ ["D+0..3","D+4","D+5"])
//    *   Re-Approved -> Re-Rejected                      (phase ∈ ["D+0..3","D+4","D+5"])
//    *   Re-Rejected -> Re-Approved                      (phase ∈ ["D+0..3","D+4","D+5"])
//    *   Otherwise, or past "FROZEN", reject with 409.
//    */
//   static async updateWorklogStatus(req, res) {
//     const t0 = Date.now();
//     try {
//       const { worklogId, auditStatus } = req.body || {};
//       const spocEmail = req.user?.email || null;

//       if (!worklogId || !auditStatus) {
//         return sendJsonError(res, 400, "worklogId and auditStatus are required.");
//       }

//       if (!ALLOWED_TARGET_STATUSES.includes(auditStatus)) {
//         return sendJsonError(
//           res,
//           400,
//           `auditStatus must be one of: ${ALLOWED_TARGET_STATUSES.join(", ")}`
//         );
//       }

//       const idInt = toInt(worklogId);
//       if (!Number.isFinite(idInt) || Number.isNaN(idInt)) {
//         return sendJsonError(res, 400, "worklogId must be an integer.");
//       }

//       // Load row
//       let worklog = null;
//       try {
//         worklog = await prisma.masterDatabase.findUnique({ where: { id: idInt } });
//       } catch (err) {
//         console.error("[updateWorklogStatus] Prisma findUnique error:", err);
//         return sendJsonError(res, 500, "Database error while retrieving worklog.", {
//           details: err?.message || String(err),
//         });
//       }
//       if (!worklog) {
//         return sendJsonError(res, 404, "Worklog not found.");
//       }

//       // Ownership
//       const authorized = await verifySpocOwnsEmployee(spocEmail, worklog.name);
//       if (!authorized) {
//         return sendJsonError(res, 403, "You are not authorized to approve/reject this worklog.");
//       }

//       // Phase
//       const now = new Date();
//       const D = toUTCDateOnly(worklog.date);
//       const phase = getPhase(now, D); // 'D+0..3' | 'D+4' | 'D+5' | 'FROZEN'
//       const current = (worklog.audit_status || "Pending").trim();

//       // Transitions:

//       // Initial decision (Pending) allowed only D..D+3
//       const canInitialDecision =
//         phase === "D+0..3" &&
//         current === "Pending" &&
//         (auditStatus === "Approved" || auditStatus === "Rejected");

//       // Re-decision on Re-Pending allowed D..D+5
//       const canReDecision =
//         (phase === "D+0..3" || phase === "D+4" || phase === "D+5") &&
//         current === "Re-Pending" &&
//         (auditStatus === "Re-Approved" || auditStatus === "Re-Rejected");

//       // Flip between Re-Approved <-> Re-Rejected allowed D..D+5
//       const canFlipReDecision =
//         (phase === "D+0..3" || phase === "D+4" || phase === "D+5") &&
//         (current === "Re-Approved" || current === "Re-Rejected") &&
//         (auditStatus === "Re-Approved" || auditStatus === "Re-Rejected") &&
//         auditStatus !== current;

//         const canFlipDecision =
//         phase === "D+0..3" &&
//         (current === "Approved" || current === "Rejected") &&
//         (auditStatus === "Approved" || auditStatus === "Rejected") &&
//         auditStatus !== current;

//       if (!(canInitialDecision || canReDecision || canFlipReDecision || canFlipDecision)) {
//         // Build detailed reason (helps frontend debug)
//         let reason = `Action not permitted. Current="${current}" -> Target="${auditStatus}" in phase=${phase}.`;
//         if (phase === "FROZEN") {
//           reason = "Action not permitted. Entry is frozen (past D+5 EOD).";
//         } else if (current === "Pending" && auditStatus.startsWith("Re-")) {
//           reason = 'Use "Approve/Reject" on Pending entries; Re-* applies to Re-Pending only.';
//         } else if (current === "Re-Pending" && !auditStatus.startsWith("Re-")) {
//           reason = 'Use "Re-Approve/Re-Reject" for Re-Pending entries (Approve/Reject window passed).';
//         } else if (!["Pending", "Re-Pending", "Re-Approved", "Re-Rejected"].includes(current)) {
//           reason = `Entries in "${current}" are not actionable.`;
//         }
//         return sendJsonError(res, 409, reason, {
//           meta: { phase, current, target: auditStatus, worklogId: idInt },
//         });
//       }

//       // Persist
//       let updated = null;
//       try {
//         updated = await prisma.masterDatabase.update({
//           where: { id: idInt },
//           data: { audit_status: auditStatus },
//         });
//       } catch (err) {
//         console.error("[updateWorklogStatus] Prisma update error:", err);
//         return sendJsonError(res, 500, "Database error while updating worklog.", {
//           details: err?.message || String(err),
//         });
//       }

//       const t1 = Date.now();
//       console.log(
//         `[updateWorklogStatus] id=${idInt} ${current} -> ${auditStatus} OK (phase=${phase}) in ${t1 - t0}ms`
//       );

//       return res.json({
//         success: true,
//         message: `Worklog updated to "${auditStatus}" successfully`,
//         worklog: {
//           id: updated.id,
//           employeeName: updated.name,
//           projectName: updated.project_name,
//           auditStatus: updated.audit_status,
//           updatedAt: new Date(),
//         },
//       });
//     } catch (error) {
//       console.error("[updateWorklogStatus] Error:", error);
//       return sendJsonError(res, 500, "Internal server error", {
//         message: error?.message || String(error),
//       });
//     }
//   }

//   /**
//    * PUT /api/spoc/worklogs/bulk-update-status
//    * Bulk approve "Pending" entries within initial window only (conservative).
//    *
//    * Body: { worklogIds: number[], auditStatus: "Approved" }
//    */
//   static async bulkUpdateWorklogStatus(req, res) {
//     const t0 = Date.now();
//     try {
//       const { worklogIds, auditStatus } = req.body || {};
//       const spocEmail = req.user?.email || null;

//       if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
//         return sendJsonError(res, 400, "worklogIds (array) is required.");
//       }

//       if (auditStatus !== "Approved") {
//         return sendJsonError(
//           res,
//           400,
//           'Bulk update supports only "Approved" to avoid unintended transitions.'
//         );
//       }

//       const ids = worklogIds
//         .map((x) => toInt(x))
//         .filter((n) => Number.isFinite(n) && !Number.isNaN(n));
//       if (ids.length === 0) {
//         return sendJsonError(res, 400, "No valid integer IDs provided.");
//       }

//       // Load rows for validation
//       let rows = [];
//       try {
//         rows = await prisma.masterDatabase.findMany({
//           where: { id: { in: ids } },
//           select: { id: true, name: true, date: true, audit_status: true },
//         });
//       } catch (err) {
//         console.error("[bulkUpdateWorklogStatus] Prisma findMany error:", err);
//         return sendJsonError(res, 500, "Database error while loading worklogs.", {
//           details: err?.message || String(err),
//         });
//       }

//       const now = new Date();
//       for (const row of rows) {
//         const ok = await verifySpocOwnsEmployee(spocEmail, row.name);
//         if (!ok) {
//           return sendJsonError(
//             res,
//             403,
//             `You are not authorized to update records for employee "${row.name}".`
//           );
//         }
//         const D = toUTCDateOnly(row.date);
//         const phase = getPhase(now, D);
//         if (phase !== "D+0..3") {
//           return sendJsonError(
//             res,
//             409,
//             "Bulk approval allowed only during initial review window (until D+3 EOD)."
//           );
//         }
//         if ((row.audit_status || "Pending") !== "Pending") {
//           return sendJsonError(
//             res,
//             409,
//             "Bulk approve is only applicable to entries currently in 'Pending' status."
//           );
//         }
//       }

//       // Update
//       let r = null;
//       try {
//         r = await prisma.masterDatabase.updateMany({
//           where: { id: { in: ids } },
//           data: { audit_status: "Approved" },
//         });
//       } catch (err) {
//         console.error("[bulkUpdateWorklogStatus] Prisma updateMany error:", err);
//         return sendJsonError(res, 500, "Database error while bulk-updating worklogs.", {
//           details: err?.message || String(err),
//         });
//       }

//       const t1 = Date.now();
//       console.log(
//         `[bulkUpdateWorklogStatus] count=${ids.length} -> Approved in ${t1 - t0}ms`
//       );

//       return res.json({
//         success: true,
//         count: r?.count ?? 0,
//         message: `Updated ${r?.count ?? 0} worklog(s) to Approved.`,
//       });
//     } catch (error) {
//       console.error("[bulkUpdateWorklogStatus] Error:", error);
//       return sendJsonError(res, 500, "Internal server error", {
//         message: error?.message || String(error),
//       });
//     }
//   }

//   /**
//    * GET /api/spoc/worklogs/summary
//    * Summary counters for dashboard.
//    */
//   static async getWorklogSummary(req, res) {
//     try {
//       const spocEmail = req.user?.email || null;
//       if (!spocEmail) {
//         return sendJsonError(res, 401, "Missing user email in token.");
//       }

//       const employees = await findEmployeesBySpoc(spocEmail);
//       const safeEmployees = asArray(employees);

//       if (safeEmployees.length === 0) {
//         return res.json({
//           success: true,
//           summary: {
//             totalEmployees: 0,
//             pendingApprovals: 0,
//             approvedWorklogs: 0,
//             rejectedWorklogs: 0,
//             totalWorklogs: 0,
//             breakdown: { pending: 0, rePending: 0 },
//           },
//         });
//       }

//       const names = safeEmployees.map((e) => e.name).filter(Boolean);

//       const [pendingCount, approvedCount, rejectedCount, rependingCount] = await Promise.all([
//         prisma.masterDatabase
//           .count({ where: { name: { in: names }, audit_status: "Pending" } })
//           .catch((e) => {
//             console.error("[getWorklogSummary] count Pending error:", e);
//             return 0;
//           }),
//         prisma.masterDatabase
//           .count({ where: { name: { in: names }, audit_status: "Approved" } })
//           .catch((e) => {
//             console.error("[getWorklogSummary] count Approved error:", e);
//             return 0;
//           }),
//         prisma.masterDatabase
//           .count({ where: { name: { in: names }, audit_status: "Rejected" } })
//           .catch((e) => {
//             console.error("[getWorklogSummary] count Rejected error:", e);
//             return 0;
//           }),
//         prisma.masterDatabase
//           .count({ where: { name: { in: names }, audit_status: "Re-Pending" } })
//           .catch((e) => {
//             console.error("[getWorklogSummary] count Re-Pending error:", e);
//             return 0;
//           }),
//       ]);

//       return res.json({
//         success: true,
//         summary: {
//           totalEmployees: safeEmployees.length,
//           pendingApprovals: pendingCount + rependingCount, // actionable items
//           approvedWorklogs: approvedCount,
//           rejectedWorklogs: rejectedCount,
//           totalWorklogs: pendingCount + approvedCount + rejectedCount + rependingCount,
//           breakdown: {
//             pending: pendingCount,
//             rePending: rependingCount,
//           },
//         },
//       });
//     } catch (error) {
//       console.error("[getWorklogSummary] Error:", error);
//       return sendJsonError(res, 500, "Internal server error", {
//         message: error?.message || String(error),
//       });
//     }
//   }

//   /**
//    * GET /api/spoc/employees
//    * Simple mapping SPOC -> employees.
//    */
//   static async getUnitTypeForCombination(req, res) {
//     try {
//       const { task, bookElement } = req.query;

//       if (!task || !bookElement) {
//         return res.status(400).json({
//           success: false,
//           message: "Both task and bookElement are required",
//         });
//       }

//       const unitTypeRecord = await prisma.unitType.findFirst({
//         where: {
//           task_name: { equals: task, mode: "insensitive" },
//           book_element: { equals: bookElement, mode: "insensitive" },
//         },
//         select: { unit_type: true },
//       });

//       if (!unitTypeRecord) {
//         return res.json({
//           success: true,
//           found: false,
//           unitType: null,
//           isNA: false,
//           message: "No unit type defined for this combination",
//         });
//       }

//       const isNA =
//         unitTypeRecord.unit_type?.toLowerCase() === "n/a" ||
//         unitTypeRecord.unit_type?.toLowerCase() === "na";

//       return res.json({
//         success: true,
//         found: true,
//         unitType: unitTypeRecord.unit_type,
//         isNA,
//       });
//     } catch (err) {
//       console.error("[getUnitTypeForCombination] error:", err);
//       return res.status(500).json({
//         success: false,
//         message: "Server error",
//         error: err.message,
//       });
//     }
//   }
    
//   static async getEmployeesUnderSpoc(req, res) {
//     try {
//       const spocEmail = req.user?.email || null;
//       if (!spocEmail) {
//         return sendJsonError(res, 401, "Missing user email in token.");
//       }

//       const employees = await findEmployeesBySpoc(spocEmail);
//       const list = asArray(employees);

//       return res.json({
//         success: true,
//         employees: list,
//         count: list.length,
//       });
//     } catch (error) {
//       console.error("[getEmployeesUnderSpoc] Error:", error);
//       return sendJsonError(res, 500, "Internal server error", {
//         message: error?.message || String(error),
//       });
//     }
//   }
// }

// module.exports = SpocController;

// /* ============================================================================
//  * Helpers (dates, phases, employee lookup, ownership)
//  * ========================================================================== */

// /** parseISOStart("YYYY-MM-DD") -> Date UTC 00:00:00.000 (null if invalid) */
// function parseISOStart(s) {
//   try {
//     const d = new Date(`${s}T00:00:00.000Z`);
//     if (Number.isNaN(d.getTime())) return null;
//     return d;
//   } catch {
//     return null;
//   }
// }

// /** parseISOEnd("YYYY-MM-DD") -> Date UTC 23:59:59.999 (null if invalid) */
// function parseISOEnd(s) {
//   try {
//     const d = new Date(`${s}T23:59:59.999Z`);
//     if (Number.isNaN(d.getTime())) return null;
//     return d;
//   } catch {
//     return null;
//   }
// }

// /** toISODateKey(Date) -> "YYYY-MM-DD" (UTC) */
// function toISODateKey(d) {
//   const dt = new Date(d);
//   const y = dt.getUTCFullYear();
//   const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(dt.getUTCDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// }

// /** toUTCDateOnly(Date) -> Date at UTC midnight for that day */
// function toUTCDateOnly(d) {
//   const dt = new Date(d);
//   return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
// }

// /** addDaysEOD(utcDateOnly, days) -> Date at UTC 23:59:59.999 after N days */
// function addDaysEOD(dateOnly, days) {
//   const d = new Date(dateOnly);
//   d.setUTCDate(d.getUTCDate() + days);
//   d.setUTCHours(23, 59, 59, 999);
//   return d;
// }

// /**
//  * getPhase(now, DutcDateOnly):
//  *   - "D+0..3": now <= EOD(D+3)
//  *   - "D+4":    EOD(D+3) <  now <= EOD(D+4)
//  *   - "D+5":    EOD(D+4) <  now <= EOD(D+5)
//  *   - "FROZEN": now > EOD(D+5)
//  */
// function getPhase(now, DutcDateOnly) {
//   const Dp3 = addDaysEOD(DutcDateOnly, 3);
//   const Dp4 = addDaysEOD(DutcDateOnly, 4);
//   const Dp5 = addDaysEOD(DutcDateOnly, 5);

//   if (now <= Dp3) return "D+0..3";
//   if (now <= Dp4) return "D+4";
//   if (now <= Dp5) return "D+5";
//   return "FROZEN";
// }

// /**
//  * findEmployeesBySpoc(spocEmail) : Promise<Employee[]>
//  * Tries multiple role casings and a SQL fallback.
//  * Returns [] on failures.
//  * Result: { id, name, email, team, spoc_name }
//  */
// async function findEmployeesBySpoc(spocEmail) {
//   // Try enum/uppercase
//   try {
//     const res = await prisma.users.findMany({
//       where: { spoc_email: spocEmail, role: "EMPLOYEE" },
//       select: { id: true, name: true, email: true, team: true, spoc_name: true },
//       orderBy: { name: "asc" },
//     });
//     if (res.length) return res;
//   } catch {}

//   // lowercase
//   try {
//     const res = await prisma.users.findMany({
//       where: { spoc_email: spocEmail, role: "employee" },
//       select: { id: true, name: true, email: true, team: true, spoc_name: true },
//       orderBy: { name: "asc" },
//     });
//     if (res.length) return res;
//   } catch {}

//   // capitalized
//   try {
//     const res = await prisma.users.findMany({
//       where: { spoc_email: spocEmail, role: "Employee" },
//       select: { id: true, name: true, email: true, team: true, spoc_name: true },
//       orderBy: { name: "asc" },
//     });
//     if (res.length) return res;
//   } catch {}

//   // Raw SQL fallback
//   try {
//     const res = await prisma.$queryRaw`
//       SELECT id, name, email, team, spoc_name
//       FROM "Users"
//       WHERE spoc_email = ${spocEmail}
//         AND role::text IN ('EMPLOYEE','Employee','employee')
//       ORDER BY name ASC
//     `;
//     return res || [];
//   } catch {
//     return [];
//   }

// }

// /**
//  * verifySpocOwnsEmployee(spocEmail, employeeName) : Promise<boolean>
//  * True if the given employee belongs to the SPOC.
//  */
// async function verifySpocOwnsEmployee(spocEmail, employeeName) {
//   try {
//     const r1 = await prisma.users.findFirst({
//       where: { name: employeeName, spoc_email: spocEmail, role: "EMPLOYEE" },
//     });
//     if (r1) return true;
//   } catch {}

//   try {
//     const r2 = await prisma.users.findFirst({
//       where: { name: employeeName, spoc_email: spocEmail, role: "employee" },
//     });
//     if (r2) return true;
//   } catch {}

//   try {
//     const r3 = await prisma.users.findFirst({
//       where: { name: employeeName, spoc_email: spocEmail, role: "Employee" },
//     });
//     if (r3) return true;
//   } catch {}

//   try {
//     const raw = await prisma.$queryRaw`
//       SELECT id FROM "Users"
//       WHERE name = ${employeeName}
//         AND spoc_email = ${spocEmail}
//         AND role::text IN ('EMPLOYEE','Employee','employee')
//       LIMIT 1
//     `;
//     return raw && raw.length > 0;
//   } catch {
//     return false;
//   }
// }


const prisma = require("../config/prisma");
const { queueNotification } = require("../utils/queueNotification");

const ALLOWED_TARGET_STATUSES = Object.freeze([
  "Approved",
  "Rejected",
  "Re-Approved",
  "Re-Rejected",
]);

/** Known statuses for validation/summaries. */
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
      return "Internal server error";
  }
}

/* ============================================================================
 * Controller
 * ========================================================================== */

class SpocController {
  /**
   * POST /api/spoc/worklogs
   * Fetch worklogs for a SPOC between inclusive date range.
   * Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", employees?: string[] }
   */
  static async getWorklogs(req, res) {
    const t0 = Date.now();
    try {
      const spocEmail = req.user?.email || null;
      if (!spocEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      const { startDate, endDate, employees: filterEmployees } = req.body || {};
      if (!startDate || !endDate) {
        return sendJsonError(res, 400, "startDate and endDate (YYYY-MM-DD) are required.");
      }

      const start = parseISOStart(startDate);
      const end = parseISOEnd(endDate);
      if (!start || !end) {
        return sendJsonError(res, 400, "Invalid date format. Use YYYY-MM-DD.");
      }

      // Employees mapped to SPOC
      const employeesUnderSpoc = await findEmployeesBySpoc(spocEmail);
      const safeEmployees = asArray(employeesUnderSpoc);
      if (safeEmployees.length === 0) {
        return res.json({
          success: true,
          worklogsByDate: {},
          totalCount: 0,
          employeeCount: 0,
          message: "No employees found under this SPOC.",
        });
      }

      const allNames = safeEmployees.map((e) => e.name).filter(Boolean);
      const namesToUse =
        Array.isArray(filterEmployees) && filterEmployees.length > 0
          ? filterEmployees
          : allNames;

      // Fetch rows
      let worklogs = [];
      try {
        worklogs = await prisma.masterDatabase.findMany({
          where: {
            name: { in: namesToUse },
            date: { gte: start, lte: end },
          },
          orderBy: [{ date: "desc" }, { name: "asc" }, { id: "asc" }],
        });
      } catch (err) {
        console.error("[getWorklogs] Prisma findMany error:", err);
        return sendJsonError(res, 500, "Database error while fetching worklogs.", {
          details: err?.message || String(err),
        });
      }

      // Group by date for UI
      const byDate = Object.create(null);
      for (const log of worklogs) {
        const dateKey = toISODateKey(log.date);
        if (!byDate[dateKey]) byDate[dateKey] = [];

        const u = safeEmployees.find((e) => e.name === log.name);

        byDate[dateKey].push({
          _id: log.id,
          employeeName: log.name,
          employeeEmail: u?.email || "",
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
        `[getWorklogs] SPOC=${spocEmail} items=${worklogs.length} in ${t1 - t0}ms`
      );

      return res.json({
        success: true,
        worklogsByDate,
        totalCount: worklogs.length,
        employeeCount: safeEmployees.length,
      });
    } catch (error) {
      console.error("[getWorklogs] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * PUT /api/spoc/worklogs/update-status
   * Update a single worklog's audit status with window + transition checks.
   *
   * Body: { worklogId: number|string, auditStatus: "Approved"|"Rejected"|"Re-Approved"|"Re-Rejected" }
   *
   * Allowed:
   *   Pending     -> Approved / Rejected              (phase === "D+0..3")
   *   Re-Pending  -> Re-Approved / Re-Rejected        (phase ∈ ["D+0..3","D+4","D+5"])
   *   Re-Approved -> Re-Rejected                      (phase ∈ ["D+0..3","D+4","D+5"])
   *   Re-Rejected -> Re-Approved                      (phase ∈ ["D+0..3","D+4","D+5"])
   *   Otherwise, or past "FROZEN", reject with 409.
   */
  static async updateWorklogStatus(req, res) {
    const t0 = Date.now();
    try {
      const { worklogId, auditStatus } = req.body || {};
      const spocEmail = req.user?.email || null;
      const spocName = req.user?.name || null;

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

      // Load row
      let worklog = null;
      try {
        worklog = await prisma.masterDatabase.findUnique({ where: { id: idInt } });
      } catch (err) {
        console.error("[updateWorklogStatus] Prisma findUnique error:", err);
        return sendJsonError(res, 500, "Database error while retrieving worklog.", {
          details: err?.message || String(err),
        });
      }
      if (!worklog) {
        return sendJsonError(res, 404, "Worklog not found.");
      }

      // Ownership
      const authorized = await verifySpocOwnsEmployee(spocEmail, worklog.name);
      if (!authorized) {
        return sendJsonError(res, 403, "You are not authorized to approve/reject this worklog.");
      }

      // Phase
      const now = new Date();
      const D = toUTCDateOnly(worklog.date);
      const phase = getPhase(now, D);
      const current = (worklog.audit_status || "Pending").trim();

      // Transitions
      const canInitialDecision =
        phase === "D+0..3" &&
        current === "Pending" &&
        (auditStatus === "Approved" || auditStatus === "Rejected");

      const canReDecision =
        (phase === "D+0..3" || phase === "D+4" || phase === "D+5") &&
        current === "Re-Pending" &&
        (auditStatus === "Re-Approved" || auditStatus === "Re-Rejected");

      const canFlipReDecision =
        (phase === "D+0..3" || phase === "D+4" || phase === "D+5") &&
        (current === "Re-Approved" || current === "Re-Rejected") &&
        (auditStatus === "Re-Approved" || auditStatus === "Re-Rejected") &&
        auditStatus !== current;

      const canFlipDecision =
        phase === "D+0..3" &&
        (current === "Approved" || current === "Rejected") &&
        (auditStatus === "Approved" || auditStatus === "Rejected") &&
        auditStatus !== current;

      if (!(canInitialDecision || canReDecision || canFlipReDecision || canFlipDecision)) {
        let reason = `Action not permitted. Current="${current}" -> Target="${auditStatus}" in phase=${phase}.`;
        if (phase === "FROZEN") {
          reason = "Action not permitted. Entry is frozen (past D+5 EOD).";
        } else if (current === "Pending" && auditStatus.startsWith("Re-")) {
          reason = 'Use "Approve/Reject" on Pending entries; Re-* applies to Re-Pending only.';
        } else if (current === "Re-Pending" && !auditStatus.startsWith("Re-")) {
          reason = 'Use "Re-Approve/Re-Reject" for Re-Pending entries (Approve/Reject window passed).';
        } else if (!["Pending", "Re-Pending", "Re-Approved", "Re-Rejected"].includes(current)) {
          reason = `Entries in "${current}" are not actionable.`;
        }
        return sendJsonError(res, 409, reason, {
          meta: { phase, current, target: auditStatus, worklogId: idInt },
        });
      }

      // Persist
      let updated = null;
      try {
        updated = await prisma.masterDatabase.update({
          where: { id: idInt },
          data: { audit_status: auditStatus },
        });
      } catch (err) {
        console.error("[updateWorklogStatus] Prisma update error:", err);
        return sendJsonError(res, 500, "Database error while updating worklog.", {
          details: err?.message || String(err),
        });
      }

      // ✅ QUEUE NOTIFICATION FOR EMPLOYEE - FIXED
      try {
        // Get employee details
        const employee = await prisma.users.findFirst({
          where: { name: worklog.name },
          select: { id: true, email: true, name: true }
        });

        if (employee) {
          console.log(`📋 Found employee ${employee.name} (ID: ${employee.id}) for notification`);
          
          // Determine notification type based on status
          let notificationType;
          if (auditStatus === "Approved" || auditStatus === "Re-Approved") {
            notificationType = "ENTRY_APPROVED_BY_SPOC";
          } else if (auditStatus === "Rejected" || auditStatus === "Re-Rejected") {
            notificationType = "ENTRY_REJECTED_BY_SPOC";
          }

          if (notificationType) {
            await queueNotification({
              userId: employee.id,
              type: notificationType,
              data: {
                employeeId: employee.id,
                spocName: spocName || spocEmail,
                entryDate: worklog.date,
                entryId: worklog.id,
                reason: auditStatus.includes("Rejected") ? "Entry rejected by SPOC" : undefined,
              }
            });
            
            console.log(`📮 Queued notification ${notificationType} for ${employee.name}`);
          }
        } else {
          console.log(`⚠️ No employee found with name: ${worklog.name}`);
        }
      } catch (notifError) {
        console.error("[updateWorklogStatus] Notification queue error:", notifError);
        // Don't fail the request if notification fails
      }

      const t1 = Date.now();
      console.log(
        `[updateWorklogStatus] id=${idInt} ${current} -> ${auditStatus} OK (phase=${phase}) in ${t1 - t0}ms`
      );

      return res.json({
        success: true,
        message: `Worklog updated to "${auditStatus}" successfully`,
        worklog: {
          id: updated.id,
          employeeName: updated.name,
          projectName: updated.project_name,
          auditStatus: updated.audit_status,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("[updateWorklogStatus] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * PUT /api/spoc/worklogs/bulk-update-status
   * Bulk approve "Pending" entries within initial window only (conservative).
   *
   * Body: { worklogIds: number[], auditStatus: "Approved" }
   */
  static async bulkUpdateWorklogStatus(req, res) {
    const t0 = Date.now();
    try {
      const { worklogIds, auditStatus } = req.body || {};
      const spocEmail = req.user?.email || null;
      const spocName = req.user?.name || null;

      if (!Array.isArray(worklogIds) || worklogIds.length === 0) {
        return sendJsonError(res, 400, "worklogIds (array) is required.");
      }

      if (auditStatus !== "Approved") {
        return sendJsonError(
          res,
          400,
          'Bulk update supports only "Approved" to avoid unintended transitions.'
        );
      }

      const ids = worklogIds
        .map((x) => toInt(x))
        .filter((n) => Number.isFinite(n) && !Number.isNaN(n));
      if (ids.length === 0) {
        return sendJsonError(res, 400, "No valid integer IDs provided.");
      }

      // Load rows for validation
      let rows = [];
      try {
        rows = await prisma.masterDatabase.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, date: true, audit_status: true },
        });
      } catch (err) {
        console.error("[bulkUpdateWorklogStatus] Prisma findMany error:", err);
        return sendJsonError(res, 500, "Database error while loading worklogs.", {
          details: err?.message || String(err),
        });
      }

      const now = new Date();
      for (const row of rows) {
        const ok = await verifySpocOwnsEmployee(spocEmail, row.name);
        if (!ok) {
          return sendJsonError(
            res,
            403,
            `You are not authorized to update records for employee "${row.name}".`
          );
        }
        const D = toUTCDateOnly(row.date);
        const phase = getPhase(now, D);
        if (phase !== "D+0..3") {
          return sendJsonError(
            res,
            409,
            "Bulk approval allowed only during initial review window (until D+3 EOD)."
          );
        }
        if ((row.audit_status || "Pending") !== "Pending") {
          return sendJsonError(
            res,
            409,
            "Bulk approve is only applicable to entries currently in 'Pending' status."
          );
        }
      }

      // Update
      let r = null;
      try {
        r = await prisma.masterDatabase.updateMany({
          where: { id: { in: ids } },
          data: { audit_status: "Approved" },
        });
      } catch (err) {
        console.error("[bulkUpdateWorklogStatus] Prisma updateMany error:", err);
        return sendJsonError(res, 500, "Database error while bulk-updating worklogs.", {
          details: err?.message || String(err),
        });
      }

      // ✅ QUEUE NOTIFICATIONS FOR ALL AFFECTED EMPLOYEES - FIXED
      try {
        // Get unique employee names from the updated rows
        const employeeNames = [...new Set(rows.map(row => row.name))];
        
        for (const employeeName of employeeNames) {
          const employee = await prisma.users.findFirst({
            where: { name: employeeName },
            select: { id: true, email: true, name: true }
          });

          if (employee) {
            console.log(`📋 Found employee ${employee.name} (ID: ${employee.id}) for bulk notification`);
            
            // Get all approved entries for this employee from this batch
            const employeeEntries = rows.filter(row => row.name === employeeName);
            
            // Queue one notification per employee mentioning all their approved entries
            await queueNotification({
              userId: employee.id,
              type: "ENTRY_APPROVED_BY_SPOC",
              data: {
                employeeId: employee.id,
                spocName: spocName || spocEmail,
                entryDate: employeeEntries[0].date, // Use first entry date
                entryId: employeeEntries[0].id, // Use first entry ID
                bulkCount: employeeEntries.length,
              }
            });
            
            console.log(`📮 Queued bulk notification for ${employee.name} (${employeeEntries.length} entries)`);
          } else {
            console.log(`⚠️ No employee found with name: ${employeeName}`);
          }
        }
      } catch (notifError) {
        console.error("[bulkUpdateWorklogStatus] Notification queue error:", notifError);
        // Don't fail the request if notification fails
      }

      const t1 = Date.now();
      console.log(
        `[bulkUpdateWorklogStatus] count=${ids.length} -> Approved in ${t1 - t0}ms`
      );

      return res.json({
        success: true,
        count: r?.count ?? 0,
        message: `Updated ${r?.count ?? 0} worklog(s) to Approved.`,
      });
    } catch (error) {
      console.error("[bulkUpdateWorklogStatus] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * GET /api/spoc/worklogs/summary
   * Summary counters for dashboard.
   */
  static async getWorklogSummary(req, res) {
    try {
      const spocEmail = req.user?.email || null;
      if (!spocEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      const employees = await findEmployeesBySpoc(spocEmail);
      const safeEmployees = asArray(employees);

      if (safeEmployees.length === 0) {
        return res.json({
          success: true,
          summary: {
            totalEmployees: 0,
            pendingApprovals: 0,
            approvedWorklogs: 0,
            rejectedWorklogs: 0,
            totalWorklogs: 0,
            breakdown: { pending: 0, rePending: 0 },
          },
        });
      }

      const names = safeEmployees.map((e) => e.name).filter(Boolean);

      const [pendingCount, approvedCount, rejectedCount, rependingCount] = await Promise.all([
        prisma.masterDatabase
          .count({ where: { name: { in: names }, audit_status: "Pending" } })
          .catch((e) => {
            console.error("[getWorklogSummary] count Pending error:", e);
            return 0;
          }),
        prisma.masterDatabase
          .count({ where: { name: { in: names }, audit_status: "Approved" } })
          .catch((e) => {
            console.error("[getWorklogSummary] count Approved error:", e);
            return 0;
          }),
        prisma.masterDatabase
          .count({ where: { name: { in: names }, audit_status: "Rejected" } })
          .catch((e) => {
            console.error("[getWorklogSummary] count Rejected error:", e);
            return 0;
          }),
        prisma.masterDatabase
          .count({ where: { name: { in: names }, audit_status: "Re-Pending" } })
          .catch((e) => {
            console.error("[getWorklogSummary] count Re-Pending error:", e);
            return 0;
          }),
      ]);

      return res.json({
        success: true,
        summary: {
          totalEmployees: safeEmployees.length,
          pendingApprovals: pendingCount + rependingCount, // actionable items
          approvedWorklogs: approvedCount,
          rejectedWorklogs: rejectedCount,
          totalWorklogs: pendingCount + approvedCount + rejectedCount + rependingCount,
          breakdown: {
            pending: pendingCount,
            rePending: rependingCount,
          },
        },
      });
    } catch (error) {
      console.error("[getWorklogSummary] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }

  /**
   * GET /api/spoc/employees
   * Simple mapping SPOC -> employees.
   */
  static async getUnitTypeForCombination(req, res) {
    try {
      const { task, bookElement } = req.query;

      if (!task || !bookElement) {
        return res.status(400).json({
          success: false,
          message: "Both task and bookElement are required",
        });
      }

      const unitTypeRecord = await prisma.unitType.findFirst({
        where: {
          task_name: { equals: task, mode: "insensitive" },
          book_element: { equals: bookElement, mode: "insensitive" },
        },
        select: { unit_type: true },
      });

      if (!unitTypeRecord) {
        return res.json({
          success: true,
          found: false,
          unitType: null,
          isNA: false,
          message: "No unit type defined for this combination",
        });
      }

      const isNA =
        unitTypeRecord.unit_type?.toLowerCase() === "n/a" ||
        unitTypeRecord.unit_type?.toLowerCase() === "na";

      return res.json({
        success: true,
        found: true,
        unitType: unitTypeRecord.unit_type,
        isNA,
      });
    } catch (err) {
      console.error("[getUnitTypeForCombination] error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    }
  }
    
  static async getEmployeesUnderSpoc(req, res) {
    try {
      const spocEmail = req.user?.email || null;
      if (!spocEmail) {
        return sendJsonError(res, 401, "Missing user email in token.");
      }

      const employees = await findEmployeesBySpoc(spocEmail);
      const list = asArray(employees);

      return res.json({
        success: true,
        employees: list,
        count: list.length,
      });
    } catch (error) {
      console.error("[getEmployeesUnderSpoc] Error:", error);
      return sendJsonError(res, 500, "Internal server error", {
        message: error?.message || String(error),
      });
    }
  }
}

module.exports = SpocController;

/* ============================================================================
 * Helpers (dates, phases, employee lookup, ownership)
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

/** toUTCDateOnly(Date) -> Date at UTC midnight for that day */
function toUTCDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

/** addDaysEOD(utcDateOnly, days) -> Date at UTC 23:59:59.999 after N days */
function addDaysEOD(dateOnly, days) {
  const d = new Date(dateOnly);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * getPhase(now, DutcDateOnly):
 *   - "D+0..3": now <= EOD(D+3)
 *   - "D+4":    EOD(D+3) <  now <= EOD(D+4)
 *   - "D+5":    EOD(D+4) <  now <= EOD(D+5)
 *   - "FROZEN": now > EOD(D+5)
 */
function getPhase(now, DutcDateOnly) {
  const Dp3 = addDaysEOD(DutcDateOnly, 3);
  const Dp4 = addDaysEOD(DutcDateOnly, 4);
  const Dp5 = addDaysEOD(DutcDateOnly, 5);

  if (now <= Dp3) return "D+0..3";
  if (now <= Dp4) return "D+4";
  if (now <= Dp5) return "D+5";
  return "FROZEN";
}

/**
 * findEmployeesBySpoc(spocEmail) : Promise<Employee[]>
 * Tries multiple role casings and a SQL fallback.
 * Returns [] on failures.
 * Result: { id, name, email, team, spoc_name }
 */
async function findEmployeesBySpoc(spocEmail) {
  // Try enum/uppercase
  try {
    const res = await prisma.users.findMany({
      where: { spoc_email: spocEmail, role: "EMPLOYEE" },
      select: { id: true, name: true, email: true, team: true, spoc_name: true },
      orderBy: { name: "asc" },
    });
    if (res.length) return res;
  } catch {}

  // lowercase
  try {
    const res = await prisma.users.findMany({
      where: { spoc_email: spocEmail, role: "employee" },
      select: { id: true, name: true, email: true, team: true, spoc_name: true },
      orderBy: { name: "asc" },
    });
    if (res.length) return res;
  } catch {}

  // capitalized
  try {
    const res = await prisma.users.findMany({
      where: { spoc_email: spocEmail, role: "Employee" },
      select: { id: true, name: true, email: true, team: true, spoc_name: true },
      orderBy: { name: "asc" },
    });
    if (res.length) return res;
  } catch {}

  // Raw SQL fallback
  try {
    const res = await prisma.$queryRaw`
      SELECT id, name, email, team, spoc_name
      FROM "Users"
      WHERE spoc_email = ${spocEmail}
        AND role::text IN ('EMPLOYEE','Employee','employee')
      ORDER BY name ASC
    `;
    return res || [];
  } catch {
    return [];
  }

}

/**
 * verifySpocOwnsEmployee(spocEmail, employeeName) : Promise<boolean>
 * True if the given employee belongs to the SPOC.
 */
async function verifySpocOwnsEmployee(spocEmail, employeeName) {
  try {
    const r1 = await prisma.users.findFirst({
      where: { name: employeeName, spoc_email: spocEmail, role: "EMPLOYEE" },
    });
    if (r1) return true;
  } catch {}

  try {
    const r2 = await prisma.users.findFirst({
      where: { name: employeeName, spoc_email: spocEmail, role: "employee" },
    });
    if (r2) return true;
  } catch {}

  try {
    const r3 = await prisma.users.findFirst({
      where: { name: employeeName, spoc_email: spocEmail, role: "Employee" },
    });
    if (r3) return true;
  } catch {}

  try {
    const raw = await prisma.$queryRaw`
      SELECT id FROM "Users"
      WHERE name = ${employeeName}
        AND spoc_email = ${spocEmail}
        AND role::text IN ('EMPLOYEE','Employee','employee')
      LIMIT 1
    `;
    return raw && raw.length > 0;
  } catch {
    return false;
  }
}
