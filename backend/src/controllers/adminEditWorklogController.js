
const prisma = require("../config/prisma");

/* ============ Fetch worklogs ============ */
const getWorklogsForEdit = async (req, res) => {
  try {
    const { startDate, endDate, employees } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate (YYYY-MM-DD) are required." });
    }

    const worklogs = await prisma.masterDatabase.findMany({
      where: {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
        ...(employees && employees.length > 0 ? { name: { in: employees } } : {}),
      },
      orderBy: { date: "desc" },
    });

    // Group by dateKey
    const worklogsByDate = {};
    worklogs.forEach((w) => {
      const key = w.date.toISOString().split("T")[0];
      if (!worklogsByDate[key]) worklogsByDate[key] = [];
      worklogsByDate[key].push(w);
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

    const newWorklog = await prisma.masterDatabase.create({
      data: {
        name: data.employeeName,
        date: new Date(data.date),
        work_mode: data.workMode,
        project_name: data.projectName,
        task_name: data.task,
        book_element: data.bookElement,
        chapter_number: data.chapterNumbers,
        hours_spent: data.hoursSpent,
        number_of_units: data.noOfUnits,
        unit_type: data.unitType,
        status: data.status,
        due_on: new Date(data.dueOn),
        details: data.details,
        audit_status: data.auditStatus,
        team: employee.team, 
      },
    });

    res.json({ success: true, worklog: newWorklog });
  } catch (err) {
    console.error("Error creating worklog:", err);
    res.status(500).json({ success: false, message: "Server error while creating worklog" });
  }
};

/* ============ Update worklog ============ */
const updateWorklogEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.masterDatabase.update({
      where: { id: Number(id)},
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
      },
    });

    res.json({ success: true, worklog: updated });
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
