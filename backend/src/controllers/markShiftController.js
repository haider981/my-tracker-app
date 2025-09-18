// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

const prisma = require("../config/prisma");

// Utility: find upcoming Sunday (UTC)
function getNextSundayUTC(date) {
  const sunday = new Date(date);
  const diff = (7 - sunday.getUTCDay()) % 7 || 7;
  sunday.setUTCDate(sunday.getUTCDate() + diff);
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

// Utility: check if shift is still active (UTC)
function isShiftActive(shiftDate, shiftType) {
  const now = new Date();
  const shiftDateTime = new Date(shiftDate);

  if (shiftType === "NIGHT") {
    // Night shifts become historical at 08:00 UTC next day
    const nextMorning8AM = new Date(shiftDateTime);
    nextMorning8AM.setUTCDate(nextMorning8AM.getUTCDate() + 1);
    nextMorning8AM.setUTCHours(2, 30, 0, 0);
    return now < nextMorning8AM;
  } else if (shiftType === "SUNDAY") {
    // Sunday shifts become historical at 08:00 UTC Monday
    const mondayAfter8AM = new Date(shiftDateTime);
    mondayAfter8AM.setUTCDate(mondayAfter8AM.getUTCDate() + 1);
    mondayAfter8AM.setUTCHours(2, 30, 0, 0);
    return now < mondayAfter8AM;
  }

  return false;
}

// Helper function: get today's date normalized (UTC midnight)
function getTodayNormalizedUTC() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

// Helper function: get upcoming Sunday normalized (UTC midnight)
function getUpcomingSundayNormalizedUTC() {
  const today = new Date();
  return getNextSundayUTC(today);
}

// GET employees under a SPOC
const getEmployeesUnderSpoc = async (req, res) => {
  try {
    const { spoc_email } = req.query;
    if (!spoc_email) {
      return res.status(400).json({ error: "SPOC email is required" });
    }

    let employeesUnderSpoc;

    try {
      employeesUnderSpoc = await prisma.users.findMany({
        where: { spoc_email, role: "EMPLOYEE" },
        select: { id: true, name: true, email: true }
      });
    } catch {
      try {
        employeesUnderSpoc = await prisma.users.findMany({
          where: { spoc_email, role: "employee" },
          select: { id: true, name: true, email: true }
        });
      } catch {
        employeesUnderSpoc = await prisma.$queryRaw`
          SELECT id, name, email 
          FROM "Users" 
          WHERE spoc_email = ${spoc_email} 
          AND role::text = 'Employee'
        `;
      }
    }

    res.json(employeesUnderSpoc);
  } catch (error) {
    console.error("Error fetching employees under SPOC:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Check existing shifts for validation
const checkExistingShifts = async (req, res) => {
  try {
    const { spoc_email, employees } = req.body;

    if (!spoc_email || !employees || !Array.isArray(employees)) {
      return res
        .status(400)
        .json({ error: "SPOC email and employees array are required" });
    }

    const todayStart = getTodayNormalizedUTC();
    const sundayStart = getUpcomingSundayNormalizedUTC();
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const nextMondayStart = new Date(
      sundayStart.getTime() + 24 * 60 * 60 * 1000
    );

    const employeeEmails = employees.map(emp => emp.email);

    // Night shifts (today UTC)
    const existingNightShifts = await prisma.markShift.findMany({
      where: {
        spoc_email,
        email: { in: employeeEmails },
        shift_type: "NIGHT",
        shift_date: { gte: todayStart, lt: tomorrowStart }
      },
      select: { email: true, shift_date: true }
    });

    const activeNightShifts = existingNightShifts.filter(shift =>
      isShiftActive(shift.shift_date, "NIGHT")
    );

    // Sunday shifts (upcoming Sunday UTC)
    const existingSundayShifts = await prisma.markShift.findMany({
      where: {
        spoc_email,
        email: { in: employeeEmails },
        shift_type: "SUNDAY",
        shift_date: { gte: sundayStart, lt: nextMondayStart }
      },
      select: { email: true, shift_date: true }
    });

    const activeSundayShifts = existingSundayShifts.filter(shift =>
      isShiftActive(shift.shift_date, "SUNDAY")
    );

    res.json({
      conflictingNightShifts: activeNightShifts.map(shift => shift.email),
      conflictingSundayShifts: activeSundayShifts.map(shift => shift.email)
    });
  } catch (error) {
    console.error("Error checking existing shifts:", error);
    res.status(500).json({ error: "Failed to check existing shifts" });
  }
};

// Delete a shift entry (only active UTC)
const deleteShiftEntry = async (req, res) => {
  try {
    // Try numeric id first (backwards compatible)
    const idParam = req.params && req.params.id;
    if (idParam) {
      const id = parseInt(idParam);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid shift id" });
      }

      const existingShift = await prisma.markShift.findUnique({ where: { id } });

      if (!existingShift) {
        return res.status(404).json({ error: "Shift entry not found" });
      }

      if (!isShiftActive(existingShift.shift_date, existingShift.shift_type)) {
        return res.status(400).json({
          error:
            "Cannot delete historical shift entries. This shift has already been completed."
        });
      }

      await prisma.markShift.delete({ where: { id } });
      return res.json({ message: "Shift entry deleted successfully", deletedCount: 1 });
    }

    // --- Composite-key delete path (no id available) ---
    // Accept query params only for DELETE requests
    const { email, shift_date: shiftDateParam, shift_type: shiftTypeParam, spoc_email } = req.query;

    if (!email || !shiftDateParam || !shiftTypeParam || !spoc_email) {
      return res.status(400).json({
        error: "Missing required params. Provide email, shift_date, shift_type, spoc_email as query parameters"
      });
    }

    // Parse and normalize shift_date to UTC midnight and use day-range match to be robust
    const parsedShiftDate = new Date(shiftDateParam);
    if (isNaN(parsedShiftDate.getTime())) {
      return res.status(400).json({ error: "Invalid shift_date. Use ISO date string." });
    }
    parsedShiftDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(parsedShiftDate.getTime() + 24 * 60 * 60 * 1000);

    const normalizedShiftType = String(shiftTypeParam).toUpperCase();

    // Find matching rows for that day (range) to avoid timestamp precision issues
    const matches = await prisma.markShift.findMany({
      where: {
        email,
        spoc_email,
        shift_type: normalizedShiftType,
        shift_date: { gte: parsedShiftDate, lt: nextDay }
      }
    });

    if (!matches || matches.length === 0) {
      return res.status(404).json({ error: "No matching shift entry found" });
    }

    // If *any* match is historical, refuse deletion (consistent with previous behavior)
    const nonActive = matches.filter(m => !isShiftActive(m.shift_date, m.shift_type));
    if (nonActive.length > 0) {
      return res.status(400).json({
        error: "Cannot delete historical shift entries. One or more matching shifts are already completed.",
        historical: nonActive.map(m => ({ name: m.name, email: m.email, shift_date: m.shift_date, shift_type: m.shift_type }))
      });
    }

    // All matches are active — delete them (deleteMany)
    const deleted = await prisma.markShift.deleteMany({
      where: {
        email,
        spoc_email,
        shift_type: normalizedShiftType,
        shift_date: { gte: parsedShiftDate, lt: nextDay }
      }
    });

    return res.json({
      message: "Shift entry/deletions successful",
      deletedCount: deleted.count
    });

  } catch (error) {
    console.error("Error deleting shift entry:", error);
    return res.status(500).json({ error: "Failed to delete shift entry" });
  }
};
// POST /api/shifts/mark
const markShifts = async (req, res) => {
  try {
    const { spoc_name, spoc_email, nightEmployees, sundayEmployees } = req.body;

    if (!spoc_name || !spoc_email) {
      return res.status(400).json({ error: "SPOC details required" });
    }

    const today = new Date();
    const todayStart = getTodayNormalizedUTC();
    const sundayStart = getUpcomingSundayNormalizedUTC();
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const nextMondayStart = new Date(
      sundayStart.getTime() + 24 * 60 * 60 * 1000
    );

    const records = [];
    const conflicts = [];

    // Night employees
    if (nightEmployees?.length > 0) {
      const nightEmails = nightEmployees.map(emp => emp.email);

      const existingNightShifts = await prisma.markShift.findMany({
        where: {
          spoc_email,
          email: { in: nightEmails },
          shift_type: "NIGHT",
          shift_date: { gte: todayStart, lt: tomorrowStart }
        }
      });

      const activeNightConflicts = existingNightShifts
        .filter(shift => isShiftActive(shift.shift_date, "NIGHT"))
        .map(shift => shift.email);

      for (const emp of nightEmployees) {
        if (activeNightConflicts.includes(emp.email)) {
          conflicts.push({
            name: emp.name,
            type: "night",
            date: todayStart.toISOString()
          });
        } else {
          records.push({
            date: today,
            name: emp.name,
            email: emp.email,
            spoc_name,
            spoc_email,
            shift_date: todayStart,
            shift_type: "NIGHT"
          });
        }
      }
    }

    // Sunday employees
    if (sundayEmployees?.length > 0) {
      const sundayEmails = sundayEmployees.map(emp => emp.email);

      const existingSundayShifts = await prisma.markShift.findMany({
        where: {
          spoc_email,
          email: { in: sundayEmails },
          shift_type: "SUNDAY",
          shift_date: { gte: sundayStart, lt: nextMondayStart }
        }
      });

      const activeSundayConflicts = existingSundayShifts
        .filter(shift => isShiftActive(shift.shift_date, "SUNDAY"))
        .map(shift => shift.email);

      for (const emp of sundayEmployees) {
        if (activeSundayConflicts.includes(emp.email)) {
          conflicts.push({
            name: emp.name,
            type: "sunday",
            date: sundayStart.toISOString()
          });
        } else {
          records.push({
            date: today,
            name: emp.name,
            email: emp.email,
            spoc_name,
            spoc_email,
            shift_date: sundayStart,
            shift_type: "SUNDAY"
          });
        }
      }
    }

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: "Some shifts already exist",
        conflicts,
        message: `The following employees already have active shifts marked: ${conflicts
          .map(c => `${c.name} (${c.type})`)
          .join(", ")}`
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        error: "No valid employees selected or all shifts already exist"
      });
    }

    const saved = await prisma.markShift.createMany({ data: records });
    res.json({
      message: "Shifts marked successfully",
      count: saved.count
    });
  } catch (error) {
    console.error("Error marking shifts:", error);
    res.status(500).json({ error: "Failed to mark shifts" });
  }
};

// GET /api/shifts/history
const getShiftHistory = async (req, res) => {
  try {
    const { spoc_email, type, include_active } = req.query;
    const where = {};

    if (spoc_email) where.spoc_email = spoc_email;
    if (type) where.shift_type = type.toUpperCase();

    const shifts = await prisma.markShift.findMany({
      where,
      orderBy: { shift_date: "desc" }
    });

    const activeShifts = [];
    const historicalShifts = [];

    shifts.forEach(shift => {
      if (isShiftActive(shift.shift_date, shift.shift_type)) {
        activeShifts.push({ ...shift, canDelete: true });
      } else {
        historicalShifts.push({ ...shift, canDelete: false });
      }
    });

    if (include_active === "true") {
      res.json({ active: activeShifts, historical: historicalShifts });
    } else {
      res.json(historicalShifts);
    }
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// GET /api/shifts/active
const getActiveShifts = async (req, res) => {
  try {
    const { spoc_email, type } = req.query;
    const where = {};

    if (spoc_email) where.spoc_email = spoc_email;
    if (type) where.shift_type = type.toUpperCase();

    const shifts = await prisma.markShift.findMany({
      where,
      orderBy: { shift_date: "asc" }
    });

    const activeShifts = shifts
      .filter(shift => isShiftActive(shift.shift_date, shift.shift_type))
      .map(shift => ({ ...shift, canDelete: true }));

    res.json(activeShifts);
  } catch (error) {
    console.error("Error fetching active shifts:", error);
    res.status(500).json({ error: "Failed to fetch active shifts" });
  }
};

module.exports = {
  markShifts,
  getShiftHistory,
  getActiveShifts,
  getEmployeesUnderSpoc,
  checkExistingShifts,
  deleteShiftEntry
};

