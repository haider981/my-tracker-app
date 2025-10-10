
// const prisma = require("../config/prisma");

// /* ============ Fetch worklogs ============ */
// const getWorklogsForEdit = async (req, res) => {
//   try {
//     const { startDate, endDate, employees } = req.body;

//     if (!startDate || !endDate) {
//       return res.status(400).json({ success: false, message: "startDate and endDate (YYYY-MM-DD) are required." });
//     }

//     const worklogs = await prisma.masterDatabase.findMany({
//       where: {
//         date: { gte: new Date(startDate), lte: new Date(endDate) },
//         ...(employees && employees.length > 0 ? { name: { in: employees } } : {}),
//       },
//       orderBy: { date: "desc" },
//     });

//     // Group by dateKey
//     const worklogsByDate = {};
//     worklogs.forEach((w) => {
//       const key = w.date.toISOString().split("T")[0];
//       if (!worklogsByDate[key]) worklogsByDate[key] = [];
//       worklogsByDate[key].push(w);
//     });

//     res.json({ success: true, worklogsByDate });
//   } catch (err) {
//     console.error("Error fetching worklogs:", err);
//     res.status(500).json({ success: false, message: "Server error while fetching worklogs" });
//   }
// };

// /* ============ Add worklog ============ */
// const createWorklogEntry = async (req, res) => {
//   try {
//     const data = req.body;

//     const employee = await prisma.users.findFirst({
//       where: { name: data.employeeName },
//       select: { team: true }
//     });

//     if (!employee) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Employee '${data.employeeName}' not found` 
//       });
//     }

//     const newWorklog = await prisma.masterDatabase.create({
//       data: {
//         name: data.employeeName,
//         date: new Date(data.date),
//         work_mode: data.workMode,
//         project_name: data.projectName,
//         task_name: data.task,
//         book_element: data.bookElement,
//         chapter_number: data.chapterNumbers,
//         hours_spent: data.hoursSpent,
//         number_of_units: data.noOfUnits,
//         unit_type: data.unitType,
//         status: data.status,
//         due_on: new Date(data.dueOn),
//         details: data.details,
//         audit_status: data.auditStatus,
//         team: employee.team, 
//       },
//     });

//     res.json({ success: true, worklog: newWorklog });
//   } catch (err) {
//     console.error("Error creating worklog:", err);
//     res.status(500).json({ success: false, message: "Server error while creating worklog" });
//   }
// };

// /* ============ Update worklog ============ */
// const updateWorklogEntry = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const data = req.body;

//     const updated = await prisma.masterDatabase.update({
//       where: { id: Number(id)},
//       data: {
//         name: data.employeeName,
//         work_mode: data.workMode,
//         project_name: data.projectName,
//         task_name: data.task,
//         book_element: data.bookElement,
//         chapter_number: data.chapterNumbers,
//         hours_spent: data.hoursSpent,
//         number_of_units: data.noOfUnits,
//         unit_type: data.unitType,
//         status: data.status,
//         details: data.details,
//         audit_status: data.auditStatus,
//       },
//     });

//     res.json({ success: true, worklog: updated });
//   } catch (err) {
//     console.error("Error updating worklog:", err);
//     res.status(500).json({ success: false, message: "Server error while updating worklog" });
//   }
// };

// /* ============ Delete worklog ============ */
// const deleteWorklogEntry = async (req, res) => {
//   try {
//     const { id } = req.params;

//     console.log('Deleting worklog:', id);

//     const deletedWorklog = await prisma.masterDatabase.delete({
//       where: { id: Number(id) },
//     });

//     res.json({
//       success: true,
//       message: "Worklog entry deleted successfully",
//       deletedWorklog: {
//         id: deletedWorklog.id.toString(),
//         name: deletedWorklog.name,
//         project_name: deletedWorklog.project_name,
//         due_on: deletedWorklog.due_on ? deletedWorklog.due_on.toISOString().split("T")[0] : null,
//       },
//     });
//   } catch (error) {
//     console.error("Error deleting worklog entry:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete worklog entry",
//       error: error.message,
//     });
//   }
// };


// module.exports = {
//   getWorklogsForEdit,
//   updateWorklogEntry,
//   deleteWorklogEntry,
//   createWorklogEntry,
// };


const prisma = require("../config/prisma");

/* ============ Fetch worklogs ============ */
const getWorklogsForEdit = async (req, res) => {
  try {
    const { startDate, endDate, employees, auditStatus, workModes, teams } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate (YYYY-MM-DD) are required." });
    }

    let whereClause = {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    };

    // Add filters
    if (employees && employees.length > 0) {
      whereClause.name = { in: employees };
    }
    if (auditStatus && auditStatus.length > 0) {
      whereClause.audit_status = { in: auditStatus };
    }
    if (workModes && workModes.length > 0) {
      whereClause.work_mode = { in: workModes };
    }
    if (teams && teams.length > 0) {
      whereClause.team = { in: teams };
    }

    const worklogs = await prisma.masterDatabase.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    // Group by dateKey
    const worklogsByDate = {};
    worklogs.forEach((w) => {
      const key = w.date.toISOString().split("T")[0];
      if (!worklogsByDate[key]) worklogsByDate[key] = [];
      
      // Add admin action info to the worklog
      const worklogWithAdminInfo = {
        ...w,
        adminAction: w.added_by_admin ? 'added' : (w.edited_by_admin ? 'edited' : 'none'),
        adminActionBy: w.admin_action_by,
        adminActionDate: w.admin_action_date
      };
      
      worklogsByDate[key].push(worklogWithAdminInfo);
    });

    res.json({ success: true, worklogsByDate });
  } catch (err) {
    console.error("Error fetching worklogs:", err);
    res.status(500).json({ success: false, message: "Server error while fetching worklogs" });
  }
};

/* ============ Add worklog ============ */
const createWorklogEntry = async (req, res) => {
  try {
    const data = req.body;

    // Get admin info from JWT
    if (!req.user || !req.user.name) {
      return res.status(401).json({ 
        success: false, 
        message: "Admin authentication required" 
      });
    }

    const adminActionBy = req.user.name;

    // Find employee team
    const employee = await prisma.users.findFirst({
      where: { name: data.employeeName },
      select: { team: true }
    });

    if (!employee) {
      return res.status(400).json({ 
        success: false, 
        message: `Employee '${data.employeeName}' not found` 
      });
    }

    // Create new worklog entry
    const newWorklog = await prisma.masterDatabase.create({
      data: {
        name: data.employeeName,
        date: data.date ? new Date(data.date) : null,
        work_mode: data.workMode,
        project_name: data.projectName,
        task_name: data.task,
        book_element: data.bookElement,
        chapter_number: data.chapterNumbers,
        hours_spent: data.hoursSpent,
        number_of_units: data.noOfUnits,
        unit_type: data.unitType,
        status: data.status,
        due_on: data.dueOn ? new Date(data.dueOn) : null,
        details: data.details,
        audit_status: data.auditStatus,
        team: employee.team,

        // Admin tracking fields
        added_by_admin: true,
        edited_by_admin: false,
        admin_action_by: adminActionBy,
        admin_action_date: new Date()
      },
    });

    // Response with admin action info
    const worklogWithAdminInfo = {
      ...newWorklog,
      adminAction: "added",
      adminActionBy,
      adminActionDate: newWorklog.admin_action_date
    };

    res.json({ success: true, worklog: worklogWithAdminInfo });

  } catch (err) {
    console.error("Error creating worklog:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while creating worklog" 
    });
  }
};


/* ============ Update worklog ============ */
const updateWorklogEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Get admin info from JWT
    if (!req.user || !req.user.name) {
      return res.status(401).json({ 
        success: false, 
        message: "Admin authentication required" 
      });
    }

    const adminActionBy = req.user.name;

    const updated = await prisma.masterDatabase.update({
      where: { id: Number(id) },
      data: {
        name: data.employeeName,
        work_mode: data.workMode,
        project_name: data.projectName,
        task_name: data.task,
        book_element: data.bookElement,
        chapter_number: data.chapterNumbers,
        hours_spent: data.hoursSpent,
        number_of_units: data.noOfUnits,
        unit_type: data.unitType,
        status: data.status,
        details: data.details,
        audit_status: data.auditStatus,
        
        edited_by_admin: true,
        admin_action_by: adminActionBy,
        admin_action_date: new Date(),
      },
    });

    const worklogWithAdminInfo = {
      ...updated,
      adminAction: updated.added_by_admin ? "added" : "edited",
      adminActionBy,
      adminActionDate: updated.admin_action_date,
    };

    res.json({ success: true, worklog: worklogWithAdminInfo });
  } catch (err) {
    console.error("Error updating worklog:", err);
    res.status(500).json({ success: false, message: "Server error while updating worklog" });
  }
};


/* ============ Delete worklog ============ */
const deleteWorklogEntry = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting worklog:', id);

    const deletedWorklog = await prisma.masterDatabase.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: "Worklog entry deleted successfully",
      deletedWorklog: {
        id: deletedWorklog.id.toString(),
        name: deletedWorklog.name,
        project_name: deletedWorklog.project_name,
        due_on: deletedWorklog.due_on ? deletedWorklog.due_on.toISOString().split("T")[0] : null,
      },
    });
  } catch (error) {
    console.error("Error deleting worklog entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete worklog entry",
      error: error.message,
    });
  }
};

module.exports = {
  getWorklogsForEdit,
  updateWorklogEntry,
  deleteWorklogEntry,
  createWorklogEntry,
};
