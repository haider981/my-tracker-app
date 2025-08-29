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
//     if (!Array.isArray(entries) || entries.length === 0) {
//       return res.status(400).json({ success: false, message: "entries[] required" });
//     }

//     // name & team come from the JWT created at login
//     const { name, team } = req.user || {};
//     if (!name) {
//       return res.status(401).json({ success: false, message: "Missing user in token" });
//     }

//     // date = today's date (no time portion); stored as DateTime
//     const now = new Date();
//     const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//     const data = entries.map((e) => ({
//       // Remove id from here - let Prisma auto-increment it
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
//       due_on: e.dueOn ? new Date(e.dueOn) : dateOnly, // Set default due_on to today if not provided
//       details: e.remarks || "", // Use empty string instead of null
//       audit_status: "Pending",
//       name,
//       team: team || "",
//     }));

//     // Use createMany for better performance, or individual creates if you need the returned data
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

/**
 * POST /api/worklogs
 * Body: { entries: [{ workMode, projectName, task, bookElement, chapterNo, hoursSpent, noOfUnits, unitsType, status, dueOn, remarks }] }
 * Uses req.user.name and req.user.team from JWT
 */
exports.submitWorklogs = async (req, res) => {
  try {
    const { entries } = req.body || {};
    
    // name & team come from the JWT created at login
    const { name, team } = req.user || {};
    if (!name) {
      return res.status(401).json({ success: false, message: "Missing user in token" });
    }

    // date = today's date (no time portion); stored as DateTime
    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if entries are provided, if not create default "Leave" entry
    let finalEntries = entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      // Create default "Leave" entry when no data is provided
      finalEntries = [{
        date: dateOnly,
        workMode: "Leave",
        projectId: "", // blank
        task: "", // blank
        bookElement: "", // blank
        chapterNo: "", // blank
        hoursSpent: 7.5, // blank/0
        noOfUnits: 0, // blank/0
        unitsType: "general", // default
        status: "", // blank
        dueOn: null, // blank
        remarks: "", // blank
      }];
    }

    const data = finalEntries.map((e) => ({
      date: dateOnly,
      work_mode: e.workMode,
      project_name: e.projectId, // Use projectName if available, fallback to projectId
      task_name: e.task,
      book_element: e.bookElement,
      chapter_number: e.chapterNo || "",
      hours_spent: Number(e.hoursSpent) || 0,
      number_of_units: Number(e.noOfUnits) || 0,
      unit_type: e.unitsType,
      status: e.status,
      due_on: e.dueOn ? new Date(e.dueOn) : dateOnly, // Allow null for blank due date
      details: e.remarks || "",
      audit_status: "Pending",
      name,
      team: team || "",
    }));

    try {
      // Option 1: Use createMany (faster, but doesn't return created records)
      const result = await prisma.masterDatabase.createMany({
        data: data,
        skipDuplicates: true, // Optional: skip if duplicate entries exist
      });

      return res.json({ success: true, inserted: result.count });
    } catch (createManyError) {
      // Fallback to individual creates if createMany fails
      console.log("createMany failed, falling back to individual creates:", createManyError.message);
      
      const results = [];
      for (const item of data) {
        try {
          const created = await prisma.masterDatabase.create({
            data: item
          });
          results.push(created);
        } catch (individualError) {
          console.error("Individual create failed for item:", item, "Error:", individualError.message);
          // Continue with other items, or throw if you want to stop on first error
        }
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

    // Calculate date range - last N days including today
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Tomorrow start
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)); // N days ago

    console.log(`Fetching worklogs for ${name} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const rows = await prisma.masterDatabase.findMany({
      where: {
        date: { 
          gte: startDate,
          lt: endDate 
        },
        // case-insensitive name match
        name: { equals: name, mode: 'insensitive' },
      },
      orderBy: [
        { date: 'desc' },
        { id: 'desc' }
      ],
      take: 500,
    });

    console.log(`Found ${rows.length} worklog entries for ${name}`);

    return res.json({ success: true, rows, count: rows.length });
  } catch (err) {
    console.error("getRecentWorklogs error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};
