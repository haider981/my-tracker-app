// const prisma = require("../config/prisma");

// function getUTCDateOnly() {
//   const now = new Date();
//   return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
// }

// function addDaysEOD(dateOnly, days) {
//   const d = new Date(dateOnly);
//   d.setUTCDate(d.getUTCDate() + days);
//   d.setUTCHours(23, 59, 59, 999);
//   return d;
// }


// // Final submission to masterDatabase (existing function)

// exports.submitWorklogs = async (req, res) => {
//   try {
//     const { entries } = req.body || {};
//     const { name, team } = req.user || {};
//     if (!name) {
//       return res.status(401).json({ success: false, message: "Missing user in token" });
//     }

//     const dateOnly = getUTCDateOnly();

//     // FIRST: Fetch all created_at from TodaysWorklog
//     const todaysEntries = await prisma.todaysWorklog.findMany({
//       where: {
//         name: { equals: name, mode: "insensitive" },
//         date: dateOnly,
//       },
//       orderBy: { id: "asc" },
//       select: {
//         created_at: true,
//       }
//     });

//     let finalEntries = entries;
//     if (!Array.isArray(entries) || entries.length === 0) {
//       finalEntries = [{
//         date: dateOnly,
//         workMode: "Leave",
//         projectId: "",
//         task: "",
//         bookElement: "",
//         chapterNo: "",
//         hoursSpent: 7.5,
//         noOfUnits: 0,
//         unitsType: "general",
//         status: "",
//         dueOn: null,
//         remarks: "",
//       }];
//     } else {
//       const hasHalfDay = finalEntries.some(e => e.workMode === "Half Day");
//       if (hasHalfDay) {
//         finalEntries.push({
//           date: dateOnly,
//           workMode: "Leave",
//           projectId: "",
//           task: "",
//           bookElement: "",
//           chapterNo: "",
//           hoursSpent: 3.75,
//           noOfUnits: 0,
//           unitsType: "general",
//           status: "",
//           dueOn: null,
//           remarks: "",
//         });
//       }
//     }

//     // Map with index to get corresponding created_at
//     const data = finalEntries.map((e, index) => ({
//       date: dateOnly,
//       work_mode: e.workMode,
//       project_name: e.projectId,
//       task_name: e.task,
//       book_element: e.bookElement,
//       chapter_number: e.chapterNo || "",
//       hours_spent: Number(e.hoursSpent) || 0,
//       number_of_units: Number(e.noOfUnits) || 0,
//       unit_type: e.unitsType,
//       status: e.status,
//       due_on: e.dueOn ? new Date(e.dueOn) : dateOnly,
//       details: e.remarks || "",
//       audit_status: "Pending",
//       name,
//       team: team || "",
//       created_at: todaysEntries[index]?.created_at || new Date(), // <-- YAHAN paste kiya
//       submitted_at: new Date(),
//     }));

//     try {
//       const result = await prisma.masterDatabase.createMany({
//         data,
//         skipDuplicates: true,
//       });

//       await prisma.todaysWorklog.deleteMany({
//         where: {
//           name: { equals: name, mode: "insensitive" },
//           date: dateOnly,
//         }
//       });

//       return res.json({ success: true, inserted: result.count });
//     } catch (createManyError) {
//       console.log("createMany failed, falling back to individual creates:", createManyError.message);

//       const results = [];
//       for (const item of data) {
//         try {
//           const created = await prisma.masterDatabase.create({ data: item });
//           results.push(created);
//         } catch (individualError) {
//           console.error("Individual create failed for item:", item, "Error:", individualError.message);
//         }
//       }

//       if (results.length > 0) {
//         await prisma.todaysWorklog.deleteMany({
//           where: {
//             name: { equals: name, mode: "insensitive" },
//             date: dateOnly,
//           }
//         });
//       }

//       return res.json({ success: true, inserted: results.length, data: results });
//     }
//   } catch (err) {
//     console.error("submitWorklogs error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// // Get recent worklogs from masterDatabase (existing function)
// exports.getRecentWorklogs = async (req, res) => {
//   try {
//     const days = Math.max(1, parseInt(req.query.days || "7", 10));
//     const { name } = req.user || {};
//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

//     const now = new Date();
//     const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
//     const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));

//     const rows = await prisma.masterDatabase.findMany({
//       where: {
//         date: { gte: startDate, lt: endDate },
//         name: { equals: name, mode: "insensitive" },
//       },
//       orderBy: [{ date: "desc" }, { id: "desc" }],
//       take: 500,
//     });

//     return res.json({ success: true, rows, count: rows.length });
//   } catch (err) {
//     console.error("getRecentWorklogs error:", err);
//     return res.status(500).json({ success: false, message: err?.message || "Server error" });
//   }
// };

// // Save individual entries to TodaysWorklog (existing)
// exports.saveTodaysWorklog = async (req, res) => {
//   try {
//     const { entry } = req.body || {};
//     const { name, team } = req.user || {};
//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
//     if (!entry) return res.status(400).json({ success: false, message: "Entry data is required" });

//     const dateOnly = getUTCDateOnly();

//     const data = {
//       date: dateOnly,
//       work_mode: entry.workMode,
//       project_name: entry.projectId || entry.projectName,
//       task_name: entry.task,
//       book_element: entry.bookElement,
//       chapter_number: entry.chapterNo || "",
//       hours_spent: Number(entry.hoursSpent) || 0,
//       number_of_units: Number(entry.noOfUnits) || 0,
//       unit_type: entry.unitsType,
//       status: entry.status,
//       due_on: entry.dueOn ? new Date(entry.dueOn) : null,
//       details: entry.remarks || "",
//       name,
//       team: team || "",
//       created_at: new Date(),
//     };

//     const result = await prisma.todaysWorklog.create({ data });
//     return res.json({ success: true, entry: result });
//   } catch (err) {
//     console.error("saveTodaysWorklog error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// // Update entry in TodaysWorklog (existing)
// exports.updateTodaysWorklog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { entry } = req.body || {};
//     const { name } = req.user || {};

//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
//     if (!entry) return res.status(400).json({ success: false, message: "Entry data is required" });

//     const updateData = {
//       work_mode: entry.workMode,
//       project_name: entry.projectId || entry.projectName,
//       task_name: entry.task,
//       book_element: entry.bookElement,
//       chapter_number: entry.chapterNo || "",
//       hours_spent: Number(entry.hoursSpent) || 0,
//       number_of_units: Number(entry.noOfUnits) || 0,
//       unit_type: entry.unitsType,
//       status: entry.status,
//       due_on: entry.dueOn ? new Date(entry.dueOn) : null,
//       details: entry.remarks || "",
//     };

//     const result = await prisma.todaysWorklog.update({
//       where: { id: parseInt(id), name: { equals: name, mode: "insensitive" } },
//       data: updateData,
//     });

//     return res.json({ success: true, entry: result });
//   } catch (err) {
//     if (err.code === "P2025") {
//       return res.status(404).json({ success: false, message: "Entry not found or access denied" });
//     }
//     console.error("updateTodaysWorklog error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// // Delete entry from TodaysWorklog (existing)
// exports.deleteTodaysWorklog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name } = req.user || {};
//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

//     await prisma.todaysWorklog.delete({
//       where: { id: parseInt(id), name: { equals: name, mode: "insensitive" } },
//     });

//     return res.json({ success: true, message: "Entry deleted successfully" });
//   } catch (err) {
//     if (err.code === "P2025") {
//       return res.status(404).json({ success: false, message: "Entry not found or access denied" });
//     }
//     console.error("deleteTodaysWorklog error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// // Get today's worklog entries (existing)
// exports.getTodaysWorklog = async (req, res) => {
//   try {
//     const { name } = req.user || {};
//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });

//     const dateOnly = getUTCDateOnly();

//     const entries = await prisma.todaysWorklog.findMany({
//       where: { name: { equals: name, mode: "insensitive" }, date: dateOnly },
//       orderBy: { id: "asc" },
//     });

//     return res.json({ success: true, entries });
//   } catch (err) {
//     console.error("getTodaysWorklog error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// // Bulk save today's worklog (existing)
// exports.bulkSaveTodaysWorklog = async (req, res) => {
//   try {
//     const { entries } = req.body || {};
//     const { name, team } = req.user || {};

//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
//     if (!Array.isArray(entries) || entries.length === 0) {
//       return res.json({ success: true, inserted: 0, message: "No entries to save" });
//     }

//     const dateOnly = getUTCDateOnly();

//     await prisma.todaysWorklog.deleteMany({
//       where: { name: { equals: name, mode: "insensitive" }, date: dateOnly }
//     });

//     const data = entries.map((entry) => ({
//       date: dateOnly,
//       work_mode: entry.workMode,
//       project_name: entry.projectId || entry.projectName,
//       task_name: entry.task,
//       book_element: entry.bookElement,
//       chapter_number: entry.chapterNo || "",
//       hours_spent: Number(entry.hoursSpent) || 0,
//       number_of_units: Number(entry.noOfUnits) || 0,
//       unit_type: entry.unitsType,
//       status: entry.status,
//       due_on: entry.dueOn ? new Date(entry.dueOn) : null,
//       details: entry.remarks || "",
//       name,
//       team: team || "",
//     }));

//     const result = await prisma.todaysWorklog.createMany({ data });
//     return res.json({ success: true, inserted: result.count });
//   } catch (err) {
//     console.error("bulkSaveTodaysWorklog error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };


// exports.resubmitRejectedWorklog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { entry } = req.body || {};
//     const { name } = req.user || {};
//     if (!name) return res.status(401).json({ success: false, message: "Missing user in token" });
//     if (!id || !entry) return res.status(400).json({ success: false, message: "id and entry required" });

//     const worklogId = parseInt(id, 10);
//     const row = await prisma.masterDatabase.findUnique({ where: { id: worklogId } });
//     if (!row) return res.status(404).json({ success: false, message: "Worklog not found" });

//     if (row.name.toLowerCase() !== name.toLowerCase()) {
//       return res.status(403).json({ success: false, message: "Not your worklog" });
//     }

//     const currentStatus = row.audit_status || "Pending";
//     if (currentStatus !== "Rejected") {
//       return res.status(409).json({ success: false, message: `Cannot resubmit worklog in status "${currentStatus}"` });
//     }

//     const D = new Date(Date.UTC(row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDate()));
//     const now = new Date();
//     const deadline = addDaysEOD(D, 4);
//     if (now > deadline) {
//       return res.status(409).json({ success: false, message: "Resubmission window (until D+4) has expired" });
//     }

//     const updateData = {
//       work_mode: entry.workMode,
//       project_name: entry.projectId || entry.projectName,
//       task_name: entry.task,
//       book_element: entry.bookElement,
//       chapter_number: entry.chapterNo || "",
//       hours_spent: Number(entry.hoursSpent) || 0,
//       number_of_units: Number(entry.noOfUnits) || 0,
//       unit_type: entry.unitsType,
//       status: entry.status,
//       due_on: entry.dueOn ? new Date(entry.dueOn) : null,
//       details: entry.remarks || "",
//       audit_status: "Re-Pending",
//     };

//     const updated = await prisma.masterDatabase.update({
//       where: { id: worklogId },
//       data: updateData,
//     });

//     return res.json({ success: true, message: "Resubmitted successfully", worklog: updated });
//   } catch (err) {
//     console.error("resubmitRejectedWorklog error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// exports.getTeamWiseDropdowns = async (req, res) => {
//   try {
//     const { sub_team } = req.user || {};

//     if (!sub_team) {
//       return res.status(400).json({
//         success: false,
//         message: "Sub-team not found in user token",
//       });
//     }

//     // Fetch dropdown values for this sub_team
//     const dropdowns = await prisma.teamWiseDropdowns.findMany({
//       where: {
//         team: {
//           equals: sub_team,
//           mode: "insensitive",
//         },
//       },
//       select: {
//         id: true,
//         values: true,
//         column_header: true,
//         team: true,
//       },
//     });

//     if (dropdowns.length === 0) {
//       return res.json({
//         success: true,
//         message: "No custom dropdowns found for this team",
//         dropdowns: {
//           bookElements: [],
//           taskNames: [],
//           chapterNumbers: [],
//         },
//       });
//     }

//     // Helper: parse possible value formats
//     const parseValues = (val) => {
//       if (!val && val !== 0) return [];
//       if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
//       if (typeof val === "string") {
//         return val
//           .split(/[,;\r\n]+/)
//           .map((v) => v.trim())
//           .filter(Boolean);
//       }
//       return [String(val).trim()].filter(Boolean);
//     };

//     // Initialize sets to avoid duplicates
//     const sets = {
//       bookElements: new Set(),
//       taskNames: new Set(),
//       chapterNumbers: new Set(),
//     };

//     // Group into sets
//     dropdowns.forEach((item) => {
//       const header = (item.column_header || "").toLowerCase();
//       const vals = parseValues(item.values);

//       if (["book_element", "bookelements", "book element"].includes(header)) {
//         vals.forEach((v) => sets.bookElements.add(v));
//       } else if (["task", "task_name", "taskname"].includes(header)) {
//         vals.forEach((v) => sets.taskNames.add(v));
//       } else if (["chapter_number", "chapternumber", "chapter number"].includes(header)) {
//         vals.forEach((v) => sets.chapterNumbers.add(v));
//       }
//     });

//     // Sorting: Alphabetic first (A–Z), then numeric ascending
//     const isNumeric = (s) => /^-?\d+(\.\d+)?$/.test(s);

//     const comparator = (a, b) => {
//       const aNum = isNumeric(a);
//       const bNum = isNumeric(b);

//       // Alphabetic first
//       if (!aNum && bNum) return -1;
//       if (aNum && !bNum) return 1;

//       // Both alphabetic: case-insensitive sort
//       if (!aNum && !bNum)
//         return a.localeCompare(b, undefined, { sensitivity: "base" });

//       // Both numeric: numeric ascending
//       return parseFloat(a) - parseFloat(b);
//     };

//     // Convert to sorted arrays
//     const grouped = {
//       bookElements: Array.from(sets.bookElements).sort(comparator),
//       taskNames: Array.from(sets.taskNames).sort(comparator),
//       chapterNumbers: Array.from(sets.chapterNumbers).sort(comparator),
//     };

//     return res.json({
//       success: true,
//       dropdowns: grouped,
//       team: sub_team,
//     });
//   } catch (err) {
//     console.error("getTeamWiseDropdowns error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };

const prisma = require("../config/prisma");

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


exports.getUnitTypeForCombination = async (req, res) => {
  try {
    const { task, bookElement } = req.query;

    if (!task || !bookElement) {
      return res.status(400).json({
        success: false,
        message: "Both task and bookElement are required"
      });
    }

    // Find the unit type for this combination
    const unitTypeRecord = await prisma.unitType.findFirst({
      where: {
        task_name: {
          equals: task,
          mode: "insensitive"
        },
        book_element: {
          equals: bookElement,
          mode: "insensitive"
        }
      },
      select: {
        unit_type: true
      }
    });

    if (!unitTypeRecord) {
      return res.json({
        success: true,
        found: false,
        unitType: null,
        isNA: false,
        message: "No unit type defined for this combination"
      });
    }

    const isNA = unitTypeRecord.unit_type?.toLowerCase() === 'n/a' || 
                 unitTypeRecord.unit_type?.toLowerCase() === 'na';

    return res.json({
      success: true,
      found: true,
      unitType: unitTypeRecord.unit_type,
      isNA: isNA
    });

  } catch (err) {
    console.error("getUnitTypeForCombination error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};



exports.submitWorklogs = async (req, res) => {
  try {
    const { entries } = req.body || {};
    const { name, team } = req.user || {};
    if (!name) {
      return res.status(401).json({ success: false, message: "Missing user in token" });
    }

    const dateOnly = getUTCDateOnly();

    // FIRST: Fetch all created_at from TodaysWorklog
    const todaysEntries = await prisma.todaysWorklog.findMany({
      where: {
        name: { equals: name, mode: "insensitive" },
        date: dateOnly,
      },
      orderBy: { id: "asc" },
      select: {
        created_at: true,
      }
    });

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

    // Map with index to get corresponding created_at
    const data = finalEntries.map((e, index) => ({
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
      created_at: todaysEntries[index]?.created_at || new Date(), // <-- YAHAN paste kiya
      submitted_at: new Date(),
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

    // ADD: Transform rows to include admin action info
    const transformedRows = rows.map(row => ({
      ...row,
      adminAction: row.added_by_admin ? 'added' : (row.edited_by_admin ? 'edited' : 'none'),
      adminActionBy: row.admin_action_by,
      adminActionDate: row.admin_action_date
    }));

    return res.json({ success: true, rows: transformedRows, count: transformedRows.length });
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
      created_at: new Date(),
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


exports.getTeamWiseDropdowns = async (req, res) => {
  try {
    const { sub_team } = req.user || {};

    if (!sub_team) {
      return res.status(400).json({
        success: false,
        message: "Sub-team not found in user token",
      });
    }

    // Fetch dropdown values for this sub_team
    const dropdowns = await prisma.teamWiseDropdowns.findMany({
      where: {
        team: {
          equals: sub_team,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        values: true,
        column_header: true,
        team: true,
      },
    });

    if (dropdowns.length === 0) {
      return res.json({
        success: true,
        message: "No custom dropdowns found for this team",
        dropdowns: {
          bookElements: [],
          taskNames: [],
          chapterNumbers: [],
        },
      });
    }

    // Helper: parse possible value formats
    const parseValues = (val) => {
      if (!val && val !== 0) return [];
      if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
      if (typeof val === "string") {
        return val
          .split(/[,;\r\n]+/)
          .map((v) => v.trim())
          .filter(Boolean);
      }
      return [String(val).trim()].filter(Boolean);
    };

    // Initialize sets to avoid duplicates
    const sets = {
      bookElements: new Set(),
      taskNames: new Set(),
      chapterNumbers: new Set(),
    };

    // Group into sets
    dropdowns.forEach((item) => {
      const header = (item.column_header || "").toLowerCase();
      const vals = parseValues(item.values);

      if (["book_element", "bookelements", "book element"].includes(header)) {
        vals.forEach((v) => sets.bookElements.add(v));
      } else if (["task", "task_name", "taskname"].includes(header)) {
        vals.forEach((v) => sets.taskNames.add(v));
      } else if (["chapter_number", "chapternumber", "chapter number"].includes(header)) {
        vals.forEach((v) => sets.chapterNumbers.add(v));
      }
    });

    // Sorting: Alphabetic first (A–Z), then numeric ascending
    const isNumeric = (s) => /^-?\d+(\.\d+)?$/.test(s);

    const comparator = (a, b) => {
      const aNum = isNumeric(a);
      const bNum = isNumeric(b);

      // Alphabetic first
      if (!aNum && bNum) return -1;
      if (aNum && !bNum) return 1;

      // Both alphabetic: case-insensitive sort
      if (!aNum && !bNum)
        return a.localeCompare(b, undefined, { sensitivity: "base" });

      // Both numeric: numeric ascending
      return parseFloat(a) - parseFloat(b);
    };

    // Convert to sorted arrays
    const grouped = {
      bookElements: Array.from(sets.bookElements).sort(comparator),
      taskNames: Array.from(sets.taskNames).sort(comparator),
      chapterNumbers: Array.from(sets.chapterNumbers).sort(comparator),
    };

    return res.json({
      success: true,
      dropdowns: grouped,
      team: sub_team,
    });
  } catch (err) {
    console.error("getTeamWiseDropdowns error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
