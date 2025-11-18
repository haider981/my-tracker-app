// const prisma = require("../config/prisma");

// // Utility: find upcoming Sunday (UTC)
// function getNextSundayUTC(date) {
//   const sunday = new Date(date);
//   const diff = (7 - sunday.getUTCDay()) % 7 || 7;
//   sunday.setUTCDate(sunday.getUTCDate() + diff);
//   sunday.setUTCHours(0, 0, 0, 0);
//   return sunday;
// }

// // Utility: check if shift is still active (UTC)
// function isShiftActive(shiftDate, shiftType) {
//   const now = new Date();
//   const shiftDateTime = new Date(shiftDate);

//   if (shiftType === "NIGHT") {
//     // Night shifts become historical at 08:00 UTC next day
//     const nextMorning8AM = new Date(shiftDateTime);
//     nextMorning8AM.setUTCDate(nextMorning8AM.getUTCDate() + 1);
//     nextMorning8AM.setUTCHours(2, 30, 0, 0);
//     return now < nextMorning8AM;
//   } else if (shiftType === "SUNDAY") {
//     // Sunday shifts become historical at 08:00 UTC Monday
//     const mondayAfter8AM = new Date(shiftDateTime);
//     mondayAfter8AM.setUTCDate(mondayAfter8AM.getUTCDate() + 1);
//     mondayAfter8AM.setUTCHours(2, 30, 0, 0);
//     return now < mondayAfter8AM;
//   }

//   return false;
// }

// // Helper function: get today's date normalized (UTC midnight)
// function getTodayNormalizedUTC() {
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);
//   return today;
// }

// // Helper function: get upcoming Sunday normalized (UTC midnight)
// function getUpcomingSundayNormalizedUTC() {
//   const today = new Date();
//   return getNextSundayUTC(today);
// }

// // GET employees under a SPOC - FIXED VERSION
// const getEmployeesUnderSpoc = async (req, res) => {
//   try {
//     const { spoc_email } = req.query;
    
//     if (!spoc_email) {
//       return res.status(400).json({ error: "SPOC email is required" });
//     }

//     console.log(`Fetching employees for SPOC: ${spoc_email}`);

//     // Use case-insensitive query with OR condition to match any role variation
//     const employeesUnderSpoc = await prisma.$queryRaw`
//       SELECT id, name, email, role, spoc_email
//       FROM "Users" 
//       WHERE LOWER(spoc_email) = LOWER(${spoc_email})
//       AND (
//         LOWER(role::text) = 'employee' 
//         OR role::text = 'EMPLOYEE'
//         OR role::text = 'Employee'
//       )
//     `;

//     console.log(`Found ${employeesUnderSpoc.length} employees under ${spoc_email}`);
    
//     // Log the results for debugging
//     if (employeesUnderSpoc.length > 0) {
//       console.log('Employee details:', employeesUnderSpoc.map(e => ({
//         name: e.name,
//         email: e.email,
//         role: e.role
//       })));
//     } else {
//       // Additional debugging: check if there are any users with this spoc_email at all
//       const allUsersWithSpoc = await prisma.$queryRaw`
//         SELECT id, name, email, role, spoc_email
//         FROM "Users" 
//         WHERE LOWER(spoc_email) = LOWER(${spoc_email})
//       `;
      
//       console.log(`Total users with spoc_email ${spoc_email}:`, allUsersWithSpoc.length);
//       if (allUsersWithSpoc.length > 0) {
//         console.log('Users found (with roles):', allUsersWithSpoc.map(u => ({
//           name: u.name,
//           email: u.email,
//           role: u.role,
//           role_type: typeof u.role
//         })));
//       }
//     }

//     res.json(employeesUnderSpoc);
//   } catch (error) {
//     console.error("Error fetching employees under SPOC:", error);
//     res.status(500).json({ 
//       error: "Failed to fetch employees",
//       details: error.message 
//     });
//   }
// };

// // Check existing shifts for validation
// const checkExistingShifts = async (req, res) => {
//   try {
//     const { spoc_email, employees } = req.body;

//     if (!spoc_email || !employees || !Array.isArray(employees)) {
//       return res
//         .status(400)
//         .json({ error: "SPOC email and employees array are required" });
//     }

//     const todayStart = getTodayNormalizedUTC();
//     const sundayStart = getUpcomingSundayNormalizedUTC();
//     const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
//     const nextMondayStart = new Date(
//       sundayStart.getTime() + 24 * 60 * 60 * 1000
//     );

//     const employeeEmails = employees.map(emp => emp.email);

//     // Night shifts (today UTC)
//     const existingNightShifts = await prisma.markShift.findMany({
//       where: {
//         spoc_email,
//         email: { in: employeeEmails },
//         shift_type: "NIGHT",
//         shift_date: { gte: todayStart, lt: tomorrowStart }
//       },
//       select: { email: true, shift_date: true }
//     });

//     const activeNightShifts = existingNightShifts.filter(shift =>
//       isShiftActive(shift.shift_date, "NIGHT")
//     );

//     // Sunday shifts (upcoming Sunday UTC)
//     const existingSundayShifts = await prisma.markShift.findMany({
//       where: {
//         spoc_email,
//         email: { in: employeeEmails },
//         shift_type: "SUNDAY",
//         shift_date: { gte: sundayStart, lt: nextMondayStart }
//       },
//       select: { email: true, shift_date: true }
//     });

//     const activeSundayShifts = existingSundayShifts.filter(shift =>
//       isShiftActive(shift.shift_date, "SUNDAY")
//     );

//     res.json({
//       conflictingNightShifts: activeNightShifts.map(shift => shift.email),
//       conflictingSundayShifts: activeSundayShifts.map(shift => shift.email)
//     });
//   } catch (error) {
//     console.error("Error checking existing shifts:", error);
//     res.status(500).json({ error: "Failed to check existing shifts" });
//   }
// };

// // Delete a shift entry (only active UTC)
// const deleteShiftEntry = async (req, res) => {
//   try {
//     // Try numeric id first (backwards compatible)
//     const idParam = req.params && req.params.id;
//     if (idParam) {
//       const id = parseInt(idParam);
//       if (Number.isNaN(id)) {
//         return res.status(400).json({ error: "Invalid shift id" });
//       }

//       const existingShift = await prisma.markShift.findUnique({ where: { id } });

//       if (!existingShift) {
//         return res.status(404).json({ error: "Shift entry not found" });
//       }

//       if (!isShiftActive(existingShift.shift_date, existingShift.shift_type)) {
//         return res.status(400).json({
//           error:
//             "Cannot delete historical shift entries. This shift has already been completed."
//         });
//       }

//       await prisma.markShift.delete({ where: { id } });
//       return res.json({ message: "Shift entry deleted successfully", deletedCount: 1 });
//     }

//     // --- Composite-key delete path (no id available) ---
//     const { email, shift_date: shiftDateParam, shift_type: shiftTypeParam, spoc_email } = req.query;

//     if (!email || !shiftDateParam || !shiftTypeParam || !spoc_email) {
//       return res.status(400).json({
//         error: "Missing required params. Provide email, shift_date, shift_type, spoc_email as query parameters"
//       });
//     }

//     // Parse and normalize shift_date to UTC midnight
//     const parsedShiftDate = new Date(shiftDateParam);
//     if (isNaN(parsedShiftDate.getTime())) {
//       return res.status(400).json({ error: "Invalid shift_date. Use ISO date string." });
//     }
//     parsedShiftDate.setUTCHours(0, 0, 0, 0);
//     const nextDay = new Date(parsedShiftDate.getTime() + 24 * 60 * 60 * 1000);

//     const normalizedShiftType = String(shiftTypeParam).toUpperCase();

//     // Find matching rows for that day
//     const matches = await prisma.markShift.findMany({
//       where: {
//         email,
//         spoc_email,
//         shift_type: normalizedShiftType,
//         shift_date: { gte: parsedShiftDate, lt: nextDay }
//       }
//     });

//     if (!matches || matches.length === 0) {
//       return res.status(404).json({ error: "No matching shift entry found" });
//     }

//     // Check if any match is historical
//     const nonActive = matches.filter(m => !isShiftActive(m.shift_date, m.shift_type));
//     if (nonActive.length > 0) {
//       return res.status(400).json({
//         error: "Cannot delete historical shift entries. One or more matching shifts are already completed.",
//         historical: nonActive.map(m => ({ 
//           name: m.name, 
//           email: m.email, 
//           shift_date: m.shift_date, 
//           shift_type: m.shift_type 
//         }))
//       });
//     }

//     // All matches are active — delete them
//     const deleted = await prisma.markShift.deleteMany({
//       where: {
//         email,
//         spoc_email,
//         shift_type: normalizedShiftType,
//         shift_date: { gte: parsedShiftDate, lt: nextDay }
//       }
//     });

//     return res.json({
//       message: "Shift entry deleted successfully",
//       deletedCount: deleted.count
//     });

//   } catch (error) {
//     console.error("Error deleting shift entry:", error);
//     return res.status(500).json({ error: "Failed to delete shift entry" });
//   }
// };

// // POST /api/shifts/mark
// const markShifts = async (req, res) => {
//   try {
//     const { spoc_name, spoc_email, nightEmployees, sundayEmployees } = req.body;

//     if (!spoc_name || !spoc_email) {
//       return res.status(400).json({ error: "SPOC details required" });
//     }

//     const today = new Date();
//     const todayStart = getTodayNormalizedUTC();
//     const sundayStart = getUpcomingSundayNormalizedUTC();
//     const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
//     const nextMondayStart = new Date(
//       sundayStart.getTime() + 24 * 60 * 60 * 1000
//     );

//     const records = [];
//     const conflicts = [];

//     // Night employees
//     if (nightEmployees?.length > 0) {
//       const nightEmails = nightEmployees.map(emp => emp.email);

//       const existingNightShifts = await prisma.markShift.findMany({
//         where: {
//           spoc_email,
//           email: { in: nightEmails },
//           shift_type: "NIGHT",
//           shift_date: { gte: todayStart, lt: tomorrowStart }
//         }
//       });

//       const activeNightConflicts = existingNightShifts
//         .filter(shift => isShiftActive(shift.shift_date, "NIGHT"))
//         .map(shift => shift.email);

//       for (const emp of nightEmployees) {
//         if (activeNightConflicts.includes(emp.email)) {
//           conflicts.push({
//             name: emp.name,
//             type: "night",
//             date: todayStart.toISOString()
//           });
//         } else {
//           records.push({
//             date: today,
//             name: emp.name,
//             email: emp.email,
//             spoc_name,
//             spoc_email,
//             shift_date: todayStart,
//             shift_type: "NIGHT"
//           });
//         }
//       }
//     }

//     // Sunday employees
//     if (sundayEmployees?.length > 0) {
//       const sundayEmails = sundayEmployees.map(emp => emp.email);

//       const existingSundayShifts = await prisma.markShift.findMany({
//         where: {
//           spoc_email,
//           email: { in: sundayEmails },
//           shift_type: "SUNDAY",
//           shift_date: { gte: sundayStart, lt: nextMondayStart }
//         }
//       });

//       const activeSundayConflicts = existingSundayShifts
//         .filter(shift => isShiftActive(shift.shift_date, "SUNDAY"))
//         .map(shift => shift.email);

//       for (const emp of sundayEmployees) {
//         if (activeSundayConflicts.includes(emp.email)) {
//           conflicts.push({
//             name: emp.name,
//             type: "sunday",
//             date: sundayStart.toISOString()
//           });
//         } else {
//           records.push({
//             date: today,
//             name: emp.name,
//             email: emp.email,
//             spoc_name,
//             spoc_email,
//             shift_date: sundayStart,
//             shift_type: "SUNDAY"
//           });
//         }
//       }
//     }

//     if (conflicts.length > 0) {
//       return res.status(409).json({
//         error: "Some shifts already exist",
//         conflicts,
//         message: `The following employees already have active shifts marked: ${conflicts
//           .map(c => `${c.name} (${c.type})`)
//           .join(", ")}`
//       });
//     }

//     if (records.length === 0) {
//       return res.status(400).json({
//         error: "No valid employees selected or all shifts already exist"
//       });
//     }

//     const saved = await prisma.markShift.createMany({ data: records });
//     res.json({
//       message: "Shifts marked successfully",
//       count: saved.count
//     });
//   } catch (error) {
//     console.error("Error marking shifts:", error);
//     res.status(500).json({ error: "Failed to mark shifts" });
//   }
// };

// // GET /api/shifts/history
// const getShiftHistory = async (req, res) => {
//   try {
//     const { spoc_email, type, include_active } = req.query;
//     const where = {};

//     if (spoc_email) where.spoc_email = spoc_email;
//     if (type) where.shift_type = type.toUpperCase();

//     const shifts = await prisma.markShift.findMany({
//       where,
//       orderBy: { shift_date: "desc" }
//     });

//     const activeShifts = [];
//     const historicalShifts = [];

//     shifts.forEach(shift => {
//       if (isShiftActive(shift.shift_date, shift.shift_type)) {
//         activeShifts.push({ ...shift, canDelete: true });
//       } else {
//         historicalShifts.push({ ...shift, canDelete: false });
//       }
//     });

//     if (include_active === "true") {
//       res.json({ active: activeShifts, historical: historicalShifts });
//     } else {
//       res.json(historicalShifts);
//     }
//   } catch (error) {
//     console.error("Error fetching history:", error);
//     res.status(500).json({ error: "Failed to fetch history" });
//   }
// };

// // GET /api/shifts/active
// const getActiveShifts = async (req, res) => {
//   try {
//     const { spoc_email, type } = req.query;
//     const where = {};

//     if (spoc_email) where.spoc_email = spoc_email;
//     if (type) where.shift_type = type.toUpperCase();

//     const shifts = await prisma.markShift.findMany({
//       where,
//       orderBy: { shift_date: "asc" }
//     });

//     const activeShifts = shifts
//       .filter(shift => isShiftActive(shift.shift_date, shift.shift_type))
//       .map(shift => ({ ...shift, canDelete: true }));

//     res.json(activeShifts);
//   } catch (error) {
//     console.error("Error fetching active shifts:", error);
//     res.status(500).json({ error: "Failed to fetch active shifts" });
//   }
// };

// module.exports = {
//   markShifts,
//   getShiftHistory,
//   getActiveShifts,
//   getEmployeesUnderSpoc,
//   checkExistingShifts,
//   deleteShiftEntry
// };


// const prisma = require("../config/prisma");

// // Utility: find upcoming Sunday (UTC)
// function getNextSundayUTC(date) {
//   const sunday = new Date(date);
//   const diff = (7 - sunday.getUTCDay()) % 7 || 7;
//   sunday.setUTCDate(sunday.getUTCDate() + diff);
//   sunday.setUTCHours(0, 0, 0, 0);
//   return sunday;
// }

// // Utility: check if shift is still active (UTC)
// function isShiftActive(shiftDate, shiftType) {
//   const now = new Date();
//   const shiftDateTime = new Date(shiftDate);

//   if (shiftType === "NIGHT") {
//     // Night shifts become historical at 08:00 UTC next day
//     const nextMorning8AM = new Date(shiftDateTime);
//     nextMorning8AM.setUTCDate(nextMorning8AM.getUTCDate() + 1);
//     nextMorning8AM.setUTCHours(2, 30, 0, 0);
//     return now < nextMorning8AM;
//   } else if (shiftType === "SUNDAY") {
//     // Sunday shifts become historical at 08:00 UTC Monday
//     const mondayAfter8AM = new Date(shiftDateTime);
//     mondayAfter8AM.setUTCDate(mondayAfter8AM.getUTCDate() + 1);
//     mondayAfter8AM.setUTCHours(2, 30, 0, 0);
//     return now < mondayAfter8AM;
//   }

//   return false;
// }

// // Helper function: get today's date normalized (UTC midnight)
// function getTodayNormalizedUTC() {
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);
//   return today;
// }

// // Helper function: get upcoming Sunday normalized (UTC midnight)
// function getUpcomingSundayNormalizedUTC() {
//   const today = new Date();
//   return getNextSundayUTC(today);
// }

// // GET employees under a SPOC - FIXED VERSION
// const getEmployeesUnderSpoc = async (req, res) => {
//   try {
//     const { spoc_email } = req.query;
    
//     if (!spoc_email) {
//       return res.status(400).json({ error: "SPOC email is required" });
//     }

//     console.log(`Fetching employees for SPOC: ${spoc_email}`);

//     // Use case-insensitive query with OR condition to match any role variation
//     // Now also fetch team field
//     const employeesUnderSpoc = await prisma.$queryRaw`
//       SELECT id, name, email, role, spoc_email, team
//       FROM "Users" 
//       WHERE LOWER(spoc_email) = LOWER(${spoc_email})
//       AND (
//         LOWER(role::text) = 'employee' 
//         OR role::text = 'EMPLOYEE'
//         OR role::text = 'Employee'
//       )
//     `;

//     console.log(`Found ${employeesUnderSpoc.length} employees under ${spoc_email}`);
    
//     // Log the results for debugging
//     if (employeesUnderSpoc.length > 0) {
//       console.log('Employee details:', employeesUnderSpoc.map(e => ({
//         name: e.name,
//         email: e.email,
//         role: e.role,
//         team: e.team
//       })));
//     } else {
//       // Additional debugging: check if there are any users with this spoc_email at all
//       const allUsersWithSpoc = await prisma.$queryRaw`
//         SELECT id, name, email, role, spoc_email, team
//         FROM "Users" 
//         WHERE LOWER(spoc_email) = LOWER(${spoc_email})
//       `;
      
//       console.log(`Total users with spoc_email ${spoc_email}:`, allUsersWithSpoc.length);
//       if (allUsersWithSpoc.length > 0) {
//         console.log('Users found (with roles):', allUsersWithSpoc.map(u => ({
//           name: u.name,
//           email: u.email,
//           role: u.role,
//           team: u.team,
//           role_type: typeof u.role
//         })));
//       }
//     }

//     res.json(employeesUnderSpoc);
//   } catch (error) {
//     console.error("Error fetching employees under SPOC:", error);
//     res.status(500).json({ 
//       error: "Failed to fetch employees",
//       details: error.message 
//     });
//   }
// };

// // Check existing shifts for validation
// const checkExistingShifts = async (req, res) => {
//   try {
//     const { spoc_email, employees } = req.body;

//     if (!spoc_email || !employees || !Array.isArray(employees)) {
//       return res
//         .status(400)
//         .json({ error: "SPOC email and employees array are required" });
//     }

//     const todayStart = getTodayNormalizedUTC();
//     const sundayStart = getUpcomingSundayNormalizedUTC();
//     const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
//     const nextMondayStart = new Date(
//       sundayStart.getTime() + 24 * 60 * 60 * 1000
//     );

//     const employeeEmails = employees.map(emp => emp.email);

//     // Night shifts (today UTC)
//     const existingNightShifts = await prisma.markShift.findMany({
//       where: {
//         spoc_email,
//         email: { in: employeeEmails },
//         shift_type: "NIGHT",
//         shift_date: { gte: todayStart, lt: tomorrowStart }
//       },
//       select: { email: true, shift_date: true }
//     });

//     const activeNightShifts = existingNightShifts.filter(shift =>
//       isShiftActive(shift.shift_date, "NIGHT")
//     );

//     // Sunday shifts (upcoming Sunday UTC)
//     const existingSundayShifts = await prisma.markShift.findMany({
//       where: {
//         spoc_email,
//         email: { in: employeeEmails },
//         shift_type: "SUNDAY",
//         shift_date: { gte: sundayStart, lt: nextMondayStart }
//       },
//       select: { email: true, shift_date: true }
//     });

//     const activeSundayShifts = existingSundayShifts.filter(shift =>
//       isShiftActive(shift.shift_date, "SUNDAY")
//     );

//     res.json({
//       conflictingNightShifts: activeNightShifts.map(shift => shift.email),
//       conflictingSundayShifts: activeSundayShifts.map(shift => shift.email)
//     });
//   } catch (error) {
//     console.error("Error checking existing shifts:", error);
//     res.status(500).json({ error: "Failed to check existing shifts" });
//   }
// };

// // Delete a shift entry (only active UTC)
// const deleteShiftEntry = async (req, res) => {
//   try {
//     // Try numeric id first (backwards compatible)
//     const idParam = req.params && req.params.id;
//     if (idParam) {
//       const id = parseInt(idParam);
//       if (Number.isNaN(id)) {
//         return res.status(400).json({ error: "Invalid shift id" });
//       }

//       const existingShift = await prisma.markShift.findUnique({ where: { id } });

//       if (!existingShift) {
//         return res.status(404).json({ error: "Shift entry not found" });
//       }

//       if (!isShiftActive(existingShift.shift_date, existingShift.shift_type)) {
//         return res.status(400).json({
//           error:
//             "Cannot delete historical shift entries. This shift has already been completed."
//         });
//       }

//       await prisma.markShift.delete({ where: { id } });
//       return res.json({ message: "Shift entry deleted successfully", deletedCount: 1 });
//     }

//     // --- Composite-key delete path (no id available) ---
//     const { email, shift_date: shiftDateParam, shift_type: shiftTypeParam, spoc_email } = req.query;

//     if (!email || !shiftDateParam || !shiftTypeParam || !spoc_email) {
//       return res.status(400).json({
//         error: "Missing required params. Provide email, shift_date, shift_type, spoc_email as query parameters"
//       });
//     }

//     // Parse and normalize shift_date to UTC midnight
//     const parsedShiftDate = new Date(shiftDateParam);
//     if (isNaN(parsedShiftDate.getTime())) {
//       return res.status(400).json({ error: "Invalid shift_date. Use ISO date string." });
//     }
//     parsedShiftDate.setUTCHours(0, 0, 0, 0);
//     const nextDay = new Date(parsedShiftDate.getTime() + 24 * 60 * 60 * 1000);

//     const normalizedShiftType = String(shiftTypeParam).toUpperCase();

//     // Find matching rows for that day
//     const matches = await prisma.markShift.findMany({
//       where: {
//         email,
//         spoc_email,
//         shift_type: normalizedShiftType,
//         shift_date: { gte: parsedShiftDate, lt: nextDay }
//       }
//     });

//     if (!matches || matches.length === 0) {
//       return res.status(404).json({ error: "No matching shift entry found" });
//     }

//     // Check if any match is historical
//     const nonActive = matches.filter(m => !isShiftActive(m.shift_date, m.shift_type));
//     if (nonActive.length > 0) {
//       return res.status(400).json({
//         error: "Cannot delete historical shift entries. One or more matching shifts are already completed.",
//         historical: nonActive.map(m => ({ 
//           name: m.name, 
//           email: m.email, 
//           shift_date: m.shift_date, 
//           shift_type: m.shift_type 
//         }))
//       });
//     }

//     // All matches are active — delete them
//     const deleted = await prisma.markShift.deleteMany({
//       where: {
//         email,
//         spoc_email,
//         shift_type: normalizedShiftType,
//         shift_date: { gte: parsedShiftDate, lt: nextDay }
//       }
//     });

//     return res.json({
//       message: "Shift entry deleted successfully",
//       deletedCount: deleted.count
//     });

//   } catch (error) {
//     console.error("Error deleting shift entry:", error);
//     return res.status(500).json({ error: "Failed to delete shift entry" });
//   }
// };

// // POST /api/shifts/mark
// const markShifts = async (req, res) => {
//   try {
//     const { spoc_name, spoc_email, nightEmployees, sundayEmployees } = req.body;

//     if (!spoc_name || !spoc_email) {
//       return res.status(400).json({ error: "SPOC details required" });
//     }

//     const today = new Date();
//     const todayStart = getTodayNormalizedUTC();
//     const sundayStart = getUpcomingSundayNormalizedUTC();
//     const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
//     const nextMondayStart = new Date(
//       sundayStart.getTime() + 24 * 60 * 60 * 1000
//     );

//     const records = [];
//     const conflicts = [];

//     // Night employees
//     if (nightEmployees?.length > 0) {
//       const nightEmails = nightEmployees.map(emp => emp.email);

//       const existingNightShifts = await prisma.markShift.findMany({
//         where: {
//           spoc_email,
//           email: { in: nightEmails },
//           shift_type: "NIGHT",
//           shift_date: { gte: todayStart, lt: tomorrowStart }
//         }
//       });

//       const activeNightConflicts = existingNightShifts
//         .filter(shift => isShiftActive(shift.shift_date, "NIGHT"))
//         .map(shift => shift.email);

//       for (const emp of nightEmployees) {
//         if (activeNightConflicts.includes(emp.email)) {
//           conflicts.push({
//             name: emp.name,
//             type: "night",
//             date: todayStart.toISOString()
//           });
//         } else {
//           records.push({
//             date: today,
//             name: emp.name,
//             email: emp.email,
//             spoc_name,
//             spoc_email,
//             shift_date: todayStart,
//             shift_type: "NIGHT",
//             team: emp.team || "Unknown", // Use employee's team or default
//             role: emp.role || "Employee"  // Use employee's role or default
//           });
//         }
//       }
//     }

//     // Sunday employees
//     if (sundayEmployees?.length > 0) {
//       const sundayEmails = sundayEmployees.map(emp => emp.email);

//       const existingSundayShifts = await prisma.markShift.findMany({
//         where: {
//           spoc_email,
//           email: { in: sundayEmails },
//           shift_type: "SUNDAY",
//           shift_date: { gte: sundayStart, lt: nextMondayStart }
//         }
//       });

//       const activeSundayConflicts = existingSundayShifts
//         .filter(shift => isShiftActive(shift.shift_date, "SUNDAY"))
//         .map(shift => shift.email);

//       for (const emp of sundayEmployees) {
//         if (activeSundayConflicts.includes(emp.email)) {
//           conflicts.push({
//             name: emp.name,
//             type: "sunday",
//             date: sundayStart.toISOString()
//           });
//         } else {
//           records.push({
//             date: today,
//             name: emp.name,
//             email: emp.email,
//             spoc_name,
//             spoc_email,
//             shift_date: sundayStart,
//             shift_type: "SUNDAY",
//             team: emp.team || "Unknown", // Use employee's team or default
//             role: emp.role || "Employee"  // Use employee's role or default
//           });
//         }
//       }
//     }

//     if (conflicts.length > 0) {
//       return res.status(409).json({
//         error: "Some shifts already exist",
//         conflicts,
//         message: `The following employees already have active shifts marked: ${conflicts
//           .map(c => `${c.name} (${c.type})`)
//           .join(", ")}`
//       });
//     }

//     if (records.length === 0) {
//       return res.status(400).json({
//         error: "No valid employees selected or all shifts already exist"
//       });
//     }

//     const saved = await prisma.markShift.createMany({ data: records });
//     res.json({
//       message: "Shifts marked successfully",
//       count: saved.count
//     });
//   } catch (error) {
//     console.error("Error marking shifts:", error);
//     res.status(500).json({ error: "Failed to mark shifts" });
//   }
// };

// // GET /api/shifts/history
// const getShiftHistory = async (req, res) => {
//   try {
//     const { spoc_email, type, include_active } = req.query;
//     const where = {};

//     if (spoc_email) where.spoc_email = spoc_email;
//     if (type) where.shift_type = type.toUpperCase();

//     const shifts = await prisma.markShift.findMany({
//       where,
//       orderBy: { shift_date: "desc" }
//     });

//     const activeShifts = [];
//     const historicalShifts = [];

//     shifts.forEach(shift => {
//       if (isShiftActive(shift.shift_date, shift.shift_type)) {
//         activeShifts.push({ ...shift, canDelete: true });
//       } else {
//         historicalShifts.push({ ...shift, canDelete: false });
//       }
//     });

//     if (include_active === "true") {
//       res.json({ active: activeShifts, historical: historicalShifts });
//     } else {
//       res.json(historicalShifts);
//     }
//   } catch (error) {
//     console.error("Error fetching history:", error);
//     res.status(500).json({ error: "Failed to fetch history" });
//   }
// };

// // GET /api/shifts/active
// const getActiveShifts = async (req, res) => {
//   try {
//     const { spoc_email, type } = req.query;
//     const where = {};

//     if (spoc_email) where.spoc_email = spoc_email;
//     if (type) where.shift_type = type.toUpperCase();

//     const shifts = await prisma.markShift.findMany({
//       where,
//       orderBy: { shift_date: "asc" }
//     });

//     const activeShifts = shifts
//       .filter(shift => isShiftActive(shift.shift_date, shift.shift_type))
//       .map(shift => ({ ...shift, canDelete: true }));

//     res.json(activeShifts);
//   } catch (error) {
//     console.error("Error fetching active shifts:", error);
//     res.status(500).json({ error: "Failed to fetch active shifts" });
//   }
// };

// module.exports = {
//   markShifts,
//   getShiftHistory,
//   getActiveShifts,
//   getEmployeesUnderSpoc,
//   checkExistingShifts,
//   deleteShiftEntry
// };


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

// GET employees under a SPOC - FIXED VERSION
const getEmployeesUnderSpoc = async (req, res) => {
  try {
    const { spoc_email } = req.query;
    
    if (!spoc_email) {
      return res.status(400).json({ error: "SPOC email is required" });
    }

    console.log(`Fetching employees for SPOC: ${spoc_email}`);

    // Use case-insensitive query with OR condition to match any role variation
    // Now also fetch team field
    const employeesUnderSpoc = await prisma.$queryRaw`
      SELECT id, name, email, role, spoc_email, team
      FROM "Users" 
      WHERE LOWER(spoc_email) = LOWER(${spoc_email})
      AND (
        LOWER(role::text) = 'employee' 
        OR role::text = 'EMPLOYEE'
        OR role::text = 'Employee'
      )
    `;

    console.log(`Found ${employeesUnderSpoc.length} employees under ${spoc_email}`);
    
    // Log the results for debugging
    if (employeesUnderSpoc.length > 0) {
      console.log('Employee details:', employeesUnderSpoc.map(e => ({
        name: e.name,
        email: e.email,
        role: e.role,
        team: e.team
      })));
    } else {
      // Additional debugging: check if there are any users with this spoc_email at all
      const allUsersWithSpoc = await prisma.$queryRaw`
        SELECT id, name, email, role, spoc_email, team
        FROM "Users" 
        WHERE LOWER(spoc_email) = LOWER(${spoc_email})
      `;
      
      console.log(`Total users with spoc_email ${spoc_email}:`, allUsersWithSpoc.length);
      if (allUsersWithSpoc.length > 0) {
        console.log('Users found (with roles):', allUsersWithSpoc.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          team: u.team,
          role_type: typeof u.role
        })));
      }
    }

    res.json(employeesUnderSpoc);
  } catch (error) {
    console.error("Error fetching employees under SPOC:", error);
    res.status(500).json({ 
      error: "Failed to fetch employees",
      details: error.message 
    });
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
    const { email, shift_date: shiftDateParam, shift_type: shiftTypeParam, spoc_email } = req.query;

    if (!email || !shiftDateParam || !shiftTypeParam || !spoc_email) {
      return res.status(400).json({
        error: "Missing required params. Provide email, shift_date, shift_type, spoc_email as query parameters"
      });
    }

    // Parse and normalize shift_date to UTC midnight
    const parsedShiftDate = new Date(shiftDateParam);
    if (isNaN(parsedShiftDate.getTime())) {
      return res.status(400).json({ error: "Invalid shift_date. Use ISO date string." });
    }
    parsedShiftDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(parsedShiftDate.getTime() + 24 * 60 * 60 * 1000);

    const normalizedShiftType = String(shiftTypeParam).toUpperCase();

    // Find matching rows for that day
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

    // Check if any match is historical
    const nonActive = matches.filter(m => !isShiftActive(m.shift_date, m.shift_type));
    if (nonActive.length > 0) {
      return res.status(400).json({
        error: "Cannot delete historical shift entries. One or more matching shifts are already completed.",
        historical: nonActive.map(m => ({ 
          name: m.name, 
          email: m.email, 
          shift_date: m.shift_date, 
          shift_type: m.shift_type 
        }))
      });
    }

    // All matches are active — delete them
    const deleted = await prisma.markShift.deleteMany({
      where: {
        email,
        spoc_email,
        shift_type: normalizedShiftType,
        shift_date: { gte: parsedShiftDate, lt: nextDay }
      }
    });

    return res.json({
      message: "Shift entry deleted successfully",
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
            shift_type: "NIGHT",
            team: emp.team || "Unknown", // Use employee's team or default
            role: emp.role || "Employee"  // Use employee's role or default
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
            shift_type: "SUNDAY",
            team: emp.team || "Unknown", // Use employee's team or default
            role: emp.role || "Employee"  // Use employee's role or default
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
// const getShiftHistory = async (req, res) => {
//   try {
//     const { spoc_email, type, include_active } = req.query;
//     const where = {};

//     if (spoc_email) where.spoc_email = spoc_email;
//     if (type) where.shift_type = type.toUpperCase();

//     const shifts = await prisma.markShift.findMany({
//       where,
//       orderBy: { shift_date: "desc" }
//     });

//     const activeShifts = [];
//     const historicalShifts = [];

//     shifts.forEach(shift => {
//       if (isShiftActive(shift.shift_date, shift.shift_type)) {
//         activeShifts.push({ ...shift, canDelete: true });
//       } else {
//         historicalShifts.push({ ...shift, canDelete: false });
//       }
//     });

//     if (include_active === "true") {
//       res.json({ active: activeShifts, historical: historicalShifts });
//     } else {
//       res.json(historicalShifts);
//     }
//   } catch (error) {
//     console.error("Error fetching history:", error);
//     res.status(500).json({ error: "Failed to fetch history" });
//   }
// };

const getShiftHistory = async (req, res) => {
  try {
    const { spoc_email, type, include_active } = req.query;

    if (!spoc_email) {
      return res.status(400).json({ error: "spoc_email is required" });
    }

    // STEP 1: Get employees under this SPOC
    const employees = await prisma.users.findMany({
      where: { spoc_email },
      select: { name: true }
    });

    const employeeNames = employees.map(e => e.name);

    if (employeeNames.length === 0) {
      return res.json([]); // no employees → no shift history
    }

    // STEP 2: Build WHERE for markShift
    const where = {
      name: { in: employeeNames }
    };

    if (type) where.shift_type = type.toUpperCase();

    // STEP 3: Fetch all shifts
    const shifts = await prisma.markShift.findMany({
      where,
      orderBy: { shift_date: "desc" }
    });

    const activeShifts = [];
    const historicalShifts = [];

    // STEP 4: Separate active & historical
    shifts.forEach(shift => {
      if (isShiftActive(shift.shift_date, shift.shift_type)) {
        activeShifts.push({ ...shift, canDelete: true });
      } else {
        historicalShifts.push({ ...shift, canDelete: false });
      }
    });

    // STEP 5: Return based on include_active flag
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
// const getActiveShifts = async (req, res) => {
//   try {
//     const { spoc_email, type } = req.query;
//     const where = {};

//     if (spoc_email) where.spoc_email = spoc_email;
//     if (type) where.shift_type = type.toUpperCase();

//     const shifts = await prisma.markShift.findMany({
//       where,
//       orderBy: { shift_date: "asc" }
//     });

//     const activeShifts = shifts
//       .filter(shift => isShiftActive(shift.shift_date, shift.shift_type))
//       .map(shift => ({ ...shift, canDelete: true }));

//     res.json(activeShifts);
//   } catch (error) {
//     console.error("Error fetching active shifts:", error);
//     res.status(500).json({ error: "Failed to fetch active shifts" });
//   }
// };

const getActiveShifts = async (req, res) => {
  try {
    const { spoc_email, type } = req.query;

    if (!spoc_email) {
      return res.status(400).json({ error: "spoc_email is required" });
    }

    // STEP 1: Get all employees under this SPOC
    const employees = await prisma.users.findMany({
      where: { spoc_email },
      select: { name: true }
    });

    const employeeNames = employees.map(e => e.name);

    if (employeeNames.length === 0) {
      return res.json([]); // No employees found → no shifts
    }

    // STEP 2: Build WHERE condition for markShift
    const where = {
      name: { in: employeeNames }
    };

    if (type) where.shift_type = type.toUpperCase();

    // STEP 3: Fetch shifts of those employees
    const shifts = await prisma.markShift.findMany({
      where,
      orderBy: { shift_date: "asc" }
    });

    // STEP 4: Filter active shifts
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
