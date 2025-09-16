// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// /**
//  * POST /api/worklogs
//  * Body: { entries: [{ workMode, projectName, task, bookElement, chapterNo, hoursSpent, noOfUnits, unitsType, status, dueOn, remarks }] }
//  * Uses req.user.name and req.user.team from JWT
//  */
// exports.submitWorklogs = async (req, res) => {
//   try {
//     const { entries } = req.body || {};
    
//     // name & team come from the JWT created at login
//     const { name, team } = req.user || {};
//     if (!name) {
//       return res.status(401).json({ success: false, message: "Missing user in token" });
//     }

//     // date = today's date (no time portion); stored as DateTime
//     const now = new Date();
//     const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//     // Check if entries are provided, if not create default "Leave" entry
//     let finalEntries = entries;
//     if (!Array.isArray(entries) || entries.length === 0) {
//       // Create default "Leave" entry when no data is provided
//       finalEntries = [{
//         date: dateOnly,
//         workMode: "Leave",
//         projectId: "", // blank
//         task: "", // blank
//         bookElement: "", // blank
//         chapterNo: "", // blank
//         hoursSpent: 7.5, // blank/0
//         noOfUnits: 0, // blank/0
//         unitsType: "general", // default
//         status: "", // blank
//         dueOn: null, // blank
//         remarks: "", // blank
//       }];
//     }
//      else {
//       // If "Half Day" work mode exists, push an extra leave entry of 3.25 hrs
//       const hasHalfDay = finalEntries.some(e => e.workMode === "Half Day");
//       if (hasHalfDay) {
//         finalEntries.push({
//           date: dateOnly,
//           workMode: "Leave",
//           projectId: "", // blank
//           task: "", // blank
//           bookElement: "", // blank
//           chapterNo: "", // blank
//           hoursSpent: 3.75, // half day leave
//           noOfUnits: 0, // blank/0
//           unitsType: "general", // default
//           status: "", // blank
//           dueOn: null, // blank
//           remarks: "", // blank
//         });
//       }
//     }

//     const data = finalEntries.map((e) => ({
//       date: dateOnly,
//       work_mode: e.workMode,
//       project_name: e.projectId, // Use projectName if available, fallback to projectId
//       task_name: e.task,
//       book_element: e.bookElement,
//       chapter_number: e.chapterNo || "",
//       hours_spent: Number(e.hoursSpent) || 0,
//       number_of_units: Number(e.noOfUnits) || 0,
//       unit_type: e.unitsType,
//       status: e.status,
//       due_on: e.dueOn ? new Date(e.dueOn) : dateOnly, // Allow null for blank due date
//       details: e.remarks || "",
//       audit_status: "Pending",
//       name,
//       team: team || "",
//     }));

//     try {
//       // Option 1: Use createMany (faster, but doesn't return created records)
//       const result = await prisma.masterDatabase.createMany({
//         data: data,
//         skipDuplicates: true, // Optional: skip if duplicate entries exist
//       });

//       return res.json({ success: true, inserted: result.count });
//     } catch (createManyError) {
//       // Fallback to individual creates if createMany fails
//       console.log("createMany failed, falling back to individual creates:", createManyError.message);
      
//       const results = [];
//       for (const item of data) {
//         try {
//           const created = await prisma.masterDatabase.create({
//             data: item
//           });
//           results.push(created);
//         } catch (individualError) {
//           console.error("Individual create failed for item:", item, "Error:", individualError.message);
//           // Continue with other items, or throw if you want to stop on first error
//         }
//       }

//       return res.json({ success: true, inserted: results.length, data: results });
//     }
//   } catch (err) {
//     console.error("submitWorklogs error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// exports.getRecentWorklogs = async (req, res) => {
//   try {
//     const days = Math.max(1, parseInt(req.query.days || "7", 10));
//     const { name } = req.user || {};
//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

//     // Calculate date range - last N days including today
//     const now = new Date();
//     const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Tomorrow start
//     const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)); // N days ago

//     console.log(`Fetching worklogs for ${name} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

//     const rows = await prisma.masterDatabase.findMany({
//       where: {
//         date: { 
//           gte: startDate,
//           lt: endDate 
//         },
//         // case-insensitive name match
//         name: { equals: name, mode: 'insensitive' },
//       },
//       orderBy: [
//         { date: 'desc' },
//         { id: 'desc' }
//       ],
//       take: 500,
//     });

//     console.log(`Found ${rows.length} worklog entries for ${name}`);

//     return res.json({ success: true, rows, count: rows.length });
//   } catch (err) {
//     console.error("getRecentWorklogs error:", err);
//     return res.status(500).json({ success: false, message: err?.message || "Server error" });
//   }
// };

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getUTCDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Utility: given a date (worklog.date), return D+N end of day.
 */
function addDaysEOD(dateOnly, days) {
  const d = new Date(dateOnly);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * ---------------- Existing endpoints ----------------
 */

// Final submission to masterDatabase (existing function)
exports.submitWorklogs = async (req, res) => {
  try {
    const { entries } = req.body || {};
    const { name, team } = req.user || {};
    if (!name) {
      return res.status(401).json({ success: false, message: "Missing user in token" });
    }

    const dateOnly = getUTCDateOnly();

    let finalEntries = entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      finalEntries = [{
        date: dateOnly,
        workMode: "Leave",
        projectId: "",
        task: "",
        bookElement: "",
        chapterNo: "",
        hoursSpent: 7.5,
        noOfUnits: 0,
        unitsType: "general",
        status: "",
        dueOn: null,
        remarks: "",
      }];
    } else {
      const hasHalfDay = finalEntries.some(e => e.workMode === "Half Day");
      if (hasHalfDay) {
        finalEntries.push({
          date: dateOnly,
          workMode: "Leave",
          projectId: "",
          task: "",
          bookElement: "",
          chapterNo: "",
          hoursSpent: 3.75,
          noOfUnits: 0,
          unitsType: "general",
          status: "",
          dueOn: null,
          remarks: "",
        });
      }
    }

    const data = finalEntries.map((e) => ({
      date: dateOnly,
      work_mode: e.workMode,
      project_name: e.projectId,
      task_name: e.task,
      book_element: e.bookElement,
      chapter_number: e.chapterNo || "",
      hours_spent: Number(e.hoursSpent) || 0,
      number_of_units: Number(e.noOfUnits) || 0,
      unit_type: e.unitsType,
      status: e.status,
      due_on: e.dueOn ? new Date(e.dueOn) : dateOnly,
      details: e.remarks || "",
      audit_status: "Pending",
      name,
      team: team || "",
    }));

    try {
      const result = await prisma.masterDatabase.createMany({
        data,
        skipDuplicates: true,
      });

      await prisma.todaysWorklog.deleteMany({
        where: {
          name: { equals: name, mode: "insensitive" },
          date: dateOnly,
        }
      });

      return res.json({ success: true, inserted: result.count });
    } catch (createManyError) {
      console.log("createMany failed, falling back to individual creates:", createManyError.message);

      const results = [];
      for (const item of data) {
        try {
          const created = await prisma.masterDatabase.create({ data: item });
          results.push(created);
        } catch (individualError) {
          console.error("Individual create failed for item:", item, "Error:", individualError.message);
        }
      }

      if (results.length > 0) {
        await prisma.todaysWorklog.deleteMany({
          where: {
            name: { equals: name, mode: "insensitive" },
            date: dateOnly,
          }
        });
      }

      return res.json({ success: true, inserted: results.length, data: results });
    }
  } catch (err) {
    console.error("submitWorklogs error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get recent worklogs from masterDatabase (existing function)
exports.getRecentWorklogs = async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || "7", 10));
    const { name } = req.user || {};
    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

    const now = new Date();
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));

    const rows = await prisma.masterDatabase.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        name: { equals: name, mode: "insensitive" },
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: 500,
    });

    return res.json({ success: true, rows, count: rows.length });
  } catch (err) {
    console.error("getRecentWorklogs error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

// Save individual entries to TodaysWorklog (existing)
exports.saveTodaysWorklog = async (req, res) => {
  try {
    const { entry } = req.body || {};
    const { name, team } = req.user || {};
    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
    if (!entry) return res.status(400).json({ success: false, message: "Entry data is required" });

    const dateOnly = getUTCDateOnly();

    const data = {
      date: dateOnly,
      work_mode: entry.workMode,
      project_name: entry.projectId || entry.projectName,
      task_name: entry.task,
      book_element: entry.bookElement,
      chapter_number: entry.chapterNo || "",
      hours_spent: Number(entry.hoursSpent) || 0,
      number_of_units: Number(entry.noOfUnits) || 0,
      unit_type: entry.unitsType,
      status: entry.status,
      due_on: entry.dueOn ? new Date(entry.dueOn) : null,
      details: entry.remarks || "",
      name,
      team: team || "",
    };

    const result = await prisma.todaysWorklog.create({ data });
    return res.json({ success: true, entry: result });
  } catch (err) {
    console.error("saveTodaysWorklog error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update entry in TodaysWorklog (existing)
exports.updateTodaysWorklog = async (req, res) => {
  try {
    const { id } = req.params;
    const { entry } = req.body || {};
    const { name } = req.user || {};

    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
    if (!entry) return res.status(400).json({ success: false, message: "Entry data is required" });

    const updateData = {
      work_mode: entry.workMode,
      project_name: entry.projectId || entry.projectName,
      task_name: entry.task,
      book_element: entry.bookElement,
      chapter_number: entry.chapterNo || "",
      hours_spent: Number(entry.hoursSpent) || 0,
      number_of_units: Number(entry.noOfUnits) || 0,
      unit_type: entry.unitsType,
      status: entry.status,
      due_on: entry.dueOn ? new Date(entry.dueOn) : null,
      details: entry.remarks || "",
    };

    const result = await prisma.todaysWorklog.update({
      where: { id: parseInt(id), name: { equals: name, mode: "insensitive" } },
      data: updateData,
    });

    return res.json({ success: true, entry: result });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Entry not found or access denied" });
    }
    console.error("updateTodaysWorklog error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Delete entry from TodaysWorklog (existing)
exports.deleteTodaysWorklog = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.user || {};
    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

    await prisma.todaysWorklog.delete({
      where: { id: parseInt(id), name: { equals: name, mode: "insensitive" } },
    });

    return res.json({ success: true, message: "Entry deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Entry not found or access denied" });
    }
    console.error("deleteTodaysWorklog error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get today's worklog entries (existing)
exports.getTodaysWorklog = async (req, res) => {
  try {
    const { name } = req.user || {};
    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

    const dateOnly = getUTCDateOnly();

    const entries = await prisma.todaysWorklog.findMany({
      where: { name: { equals: name, mode: "insensitive" }, date: dateOnly },
      orderBy: { id: "asc" },
    });

    return res.json({ success: true, entries });
  } catch (err) {
    console.error("getTodaysWorklog error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Bulk save today's worklog (existing)
exports.bulkSaveTodaysWorklog = async (req, res) => {
  try {
    const { entries } = req.body || {};
    const { name, team } = req.user || {};

    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.json({ success: true, inserted: 0, message: "No entries to save" });
    }

    const dateOnly = getUTCDateOnly();

    await prisma.todaysWorklog.deleteMany({
      where: { name: { equals: name, mode: "insensitive" }, date: dateOnly }
    });

    const data = entries.map((entry) => ({
      date: dateOnly,
      work_mode: entry.workMode,
      project_name: entry.projectId || entry.projectName,
      task_name: entry.task,
      book_element: entry.bookElement,
      chapter_number: entry.chapterNo || "",
      hours_spent: Number(entry.hoursSpent) || 0,
      number_of_units: Number(entry.noOfUnits) || 0,
      unit_type: entry.unitsType,
      status: entry.status,
      due_on: entry.dueOn ? new Date(entry.dueOn) : null,
      details: entry.remarks || "",
      name,
      team: team || "",
    }));

    const result = await prisma.todaysWorklog.createMany({ data });
    return res.json({ success: true, inserted: result.count });
  } catch (err) {
    console.error("bulkSaveTodaysWorklog error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * ---------------- NEW ENDPOINT ----------------
 * Resubmit a rejected worklog (to Re-Pending)
 *
 * Rules:
 *  - Allowed only if current audit_status = "Rejected"
 *  - Allowed only until D+4 (EOD)
 *  - On resubmission, audit_status -> "Re-Pending"
 *  - Employee can edit all columns EXCEPT: Date, Audit Status
 *  - Once resubmitted, cannot edit again
 */
exports.resubmitRejectedWorklog = async (req, res) => {
  try {
    const { id } = req.params;
    const { entry } = req.body || {};
    const { name } = req.user || {};
    if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
    if (!id || !entry) return res.status(400).json({ success: false, message: "id and entry required" });

    const worklogId = parseInt(id, 10);
    const row = await prisma.masterDatabase.findUnique({ where: { id: worklogId } });
    if (!row) return res.status(404).json({ success: false, message: "Worklog not found" });

    if (row.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(403).json({ success: false, message: "Not your worklog" });
    }

    const currentStatus = row.audit_status || "Pending";
    if (currentStatus !== "Rejected") {
      return res.status(409).json({ success: false, message: `Cannot resubmit worklog in status "${currentStatus}"` });
    }

    const D = new Date(Date.UTC(row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDate()));
    const now = new Date();
    const deadline = addDaysEOD(D, 4);
    if (now > deadline) {
      return res.status(409).json({ success: false, message: "Resubmission window (until D+4) has expired" });
    }

    const updateData = {
      work_mode: entry.workMode,
      project_name: entry.projectId || entry.projectName,
      task_name: entry.task,
      book_element: entry.bookElement,
      chapter_number: entry.chapterNo || "",
      hours_spent: Number(entry.hoursSpent) || 0,
      number_of_units: Number(entry.noOfUnits) || 0,
      unit_type: entry.unitsType,
      status: entry.status,
      due_on: entry.dueOn ? new Date(entry.dueOn) : null,
      details: entry.remarks || "",
      audit_status: "Re-Pending",
    };

    const updated = await prisma.masterDatabase.update({
      where: { id: worklogId },
      data: updateData,
    });

    return res.json({ success: true, message: "Resubmitted successfully", worklog: updated });
  } catch (err) {
    console.error("resubmitRejectedWorklog error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
