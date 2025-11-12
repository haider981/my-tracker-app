// const prisma = require('../config/prisma'); 

// // Submit a new entry request
// const submitEntryRequest = async (req, res) => {
//   try {
//     const userName = req.user.name; // Using name from JWT token
//     const userTeam = req.user.team;
    
//     const {
//       entryDate,
//       workMode,
//       projectId,
//       projectName,
//       task,
//       bookElement,
//       chapterNo,
//       hoursSpent,
//       noOfUnits,
//       unitsType,
//       status,
//       dueOn,
//       remarks,
//       lateReason
//     } = req.body;

//     // Validate required fields
//     if (!entryDate || !workMode || !task || !bookElement || !chapterNo || 
//         !hoursSpent || !status || !noOfUnits || !unitsType || !lateReason) {
//       return res.status(400).json({
//         success: false,
//         message: 'All required fields must be provided'
//       });
//     }

//     // Validate that the entry date is within the last 3 days
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const entryDateObj = new Date(entryDate);
//     entryDateObj.setHours(0, 0, 0, 0);
//     const daysDiff = Math.floor((today - entryDateObj) / (1000 * 60 * 60 * 24));
    
//     if (daysDiff < 1 || daysDiff > 3) {
//       return res.status(400).json({
//         success: false,
//         message: 'Entry date must be within the last 3 days (yesterday to 3 days ago)'
//       });
//     }


//     // Insert the entry request into TodaysWorklog table with is_entry_request flag
//     const newEntry = await prisma.todaysWorklog.create({
//       data: {
//         date: new Date(entryDate),
//         work_mode: workMode,
//         project_name: projectId || projectName,
//         task_name: task,
//         book_element: bookElement,
//         chapter_number: chapterNo,
//         hours_spent: parseFloat(hoursSpent),
//         number_of_units: parseInt(noOfUnits),
//         unit_type: unitsType,
//         status: status,
//         due_on: dueOn ? new Date(dueOn) : null,
//         details: remarks || null,
//         audit_status: "Approved",
//         name: userName,
//         team: userTeam,
//         created_at: new Date(),
        
//         late_reason: lateReason,
//         is_entry_request: true,
//         request_status: 'Pending',
        
//       }
//     });

//     res.json({
//       success: true,
//       message: 'Entry request submitted successfully',
//       entry: newEntry
//     });

//   } catch (error) {
//     console.error('Error submitting entry request:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to submit entry request',
//       error: error.message
//     });
//   }
// };

// // Get pending entry requests for the logged-in employee
// const getPendingRequests = async (req, res) => {
//   try {
//     const userName = req.user.name;

//     const requests = await prisma.todaysWorklog.findMany({
//       where: {
//         name: userName,
//         is_entry_request: true,
//         request_status: 'Pending'
//       },
//       orderBy: {
//         date: 'desc'
//       },
//       select: {
//         id: true,
//         date: true,
//         work_mode: true,
//         project_name: true,
//         task_name: true,
//         book_element: true,
//         chapter_number: true,
//         hours_spent: true,
//         number_of_units: true,
//         unit_type: true,
//         status: true,
//         due_on: true,
//         details: true,
//         late_reason: true,
//         request_status: true,
//         created_at: true
//       }
//     });

//     // Format the response to match frontend expectations
//     const formattedRequests = requests.map(req => ({
//       id: req.id,
//       entry_date: req.date,
//       work_mode: req.work_mode,
//       project_name: req.project_name,
//       task_name: req.task_name,
//       book_element: req.book_element,
//       chapter_number: req.chapter_number,
//       hours_spent: req.hours_spent,
//       number_of_units: req.number_of_units,
//       unit_type: req.unit_type,
//       status: req.status,
//       due_on: req.due_on,
//       details: req.details,
//       late_reason: req.late_reason,
//       request_status: req.request_status,
//       created_at: req.created_at
//     }));

//     res.json({
//       success: true,
//       requests: formattedRequests
//     });

//   } catch (error) {
//     console.error('Error fetching pending requests:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch pending requests',
//       error: error.message
//     });
//   }
// };

// // Get past (approved/rejected) entry requests
// const getPastRequests = async (req, res) => {
//   try {
//     const userName = req.user.name;

//     const requests = await prisma.todaysWorklog.findMany({
//       where: {
//         name: userName,
//         is_entry_request: true,
//         request_status: {
//           in: ['Approved', 'Rejected']
//         }
//       },
//       orderBy: {
//         date: 'desc'
//       },
//       take: 50,
//       select: {
//         id: true,
//         date: true,
//         work_mode: true,
//         project_name: true,
//         task_name: true,
//         book_element: true,
//         chapter_number: true,
//         hours_spent: true,
//         number_of_units: true,
//         unit_type: true,
//         status: true,
//         due_on: true,
//         details: true,
//         late_reason: true,
//         request_status: true,
//         reviewed_at: true,
//         reviewed_by: true
//       }
//     });

//     // Format the response to match frontend expectations
//     const formattedRequests = requests.map(req => ({
//       id: req.id,
//       entry_date: req.date,
//       work_mode: req.work_mode,
//       project_name: req.project_name,
//       task_name: req.task_name,
//       book_element: req.book_element,
//       chapter_number: req.chapter_number,
//       hours_spent: req.hours_spent,
//       number_of_units: req.number_of_units,
//       unit_type: req.unit_type,
//       status: req.status,
//       due_on: req.due_on,
//       details: req.details,
//       late_reason: req.late_reason,
//       request_status: req.request_status,
//       reviewed_at: req.reviewed_at,
//       reviewed_by: req.reviewed_by
//     }));

//     res.json({
//       success: true,
//       requests: formattedRequests
//     });

//   } catch (error) {
//     console.error('Error fetching past requests:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch past requests',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   submitEntryRequest,
//   getPendingRequests,
//   getPastRequests
// };

const prisma = require('../config/prisma'); 

const getUnitTypeForCombination = async (req, res) => {
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

// Submit a new entry request
const submitEntryRequest = async (req, res) => {
  try {
    const userName = req.user.name; // Using name from JWT token
    const userTeam = req.user.team;
    
    const {
      entryDate,
      workMode,
      projectId,
      projectName,
      task,
      bookElement,
      chapterNo,
      hoursSpent,
      noOfUnits,
      unitsType,
      status,
      dueOn,
      remarks,
      lateReason
    } = req.body;

    // Validate required fields
    if (!entryDate || !workMode || !task || !bookElement || !chapterNo || 
        !hoursSpent || !status || !noOfUnits || !unitsType || !lateReason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate that the entry date is within the last 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDateObj = new Date(entryDate);
    entryDateObj.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - entryDateObj) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1 || daysDiff > 3) {
      return res.status(400).json({
        success: false,
        message: 'Entry date must be within the last 3 days (yesterday to 3 days ago)'
      });
    }


    // Insert the entry request into TodaysWorklog table with is_entry_request flag
    const newEntry = await prisma.todaysWorklog.create({
      data: {
        date: new Date(entryDate),
        work_mode: workMode,
        project_name: projectId || projectName,
        task_name: task,
        book_element: bookElement,
        chapter_number: chapterNo,
        hours_spent: parseFloat(hoursSpent),
        number_of_units: parseInt(noOfUnits),
        unit_type: unitsType,
        status: status,
        due_on: dueOn ? new Date(dueOn) : null,
        details: remarks || null,
        audit_status: "Approved",
        name: userName,
        team: userTeam,
        created_at: new Date(),
        
        late_reason: lateReason,
        is_entry_request: true,
        request_status: 'Pending',
        
      }
    });

    res.json({
      success: true,
      message: 'Entry request submitted successfully',
      entry: newEntry
    });

  } catch (error) {
    console.error('Error submitting entry request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit entry request',
      error: error.message
    });
  }
};

// Get pending entry requests for the logged-in employee
const getPendingRequests = async (req, res) => {
  try {
    const userName = req.user.name;

    const requests = await prisma.todaysWorklog.findMany({
      where: {
        name: userName,
        is_entry_request: true,
        request_status: 'Pending'
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        id: true,
        date: true,
        work_mode: true,
        project_name: true,
        task_name: true,
        book_element: true,
        chapter_number: true,
        hours_spent: true,
        number_of_units: true,
        unit_type: true,
        status: true,
        due_on: true,
        details: true,
        late_reason: true,
        request_status: true,
        created_at: true
      }
    });

    // Format the response to match frontend expectations
    const formattedRequests = requests.map(req => ({
      id: req.id,
      entry_date: req.date,
      work_mode: req.work_mode,
      project_name: req.project_name,
      task_name: req.task_name,
      book_element: req.book_element,
      chapter_number: req.chapter_number,
      hours_spent: req.hours_spent,
      number_of_units: req.number_of_units,
      unit_type: req.unit_type,
      status: req.status,
      due_on: req.due_on,
      details: req.details,
      late_reason: req.late_reason,
      request_status: req.request_status,
      created_at: req.created_at
    }));

    res.json({
      success: true,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
      error: error.message
    });
  }
};

// Get past (approved/rejected) entry requests
const getPastRequests = async (req, res) => {
  try {
    const userName = req.user.name;

    const requests = await prisma.todaysWorklog.findMany({
      where: {
        name: userName,
        is_entry_request: true,
        request_status: {
          in: ['Approved', 'Rejected']
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 50,
      select: {
        id: true,
        date: true,
        work_mode: true,
        project_name: true,
        task_name: true,
        book_element: true,
        chapter_number: true,
        hours_spent: true,
        number_of_units: true,
        unit_type: true,
        status: true,
        due_on: true,
        details: true,
        late_reason: true,
        request_status: true,
        reviewed_at: true,
        reviewed_by: true
      }
    });

    // Format the response to match frontend expectations
    const formattedRequests = requests.map(req => ({
      id: req.id,
      entry_date: req.date,
      work_mode: req.work_mode,
      project_name: req.project_name,
      task_name: req.task_name,
      book_element: req.book_element,
      chapter_number: req.chapter_number,
      hours_spent: req.hours_spent,
      number_of_units: req.number_of_units,
      unit_type: req.unit_type,
      status: req.status,
      due_on: req.due_on,
      details: req.details,
      late_reason: req.late_reason,
      request_status: req.request_status,
      reviewed_at: req.reviewed_at,
      reviewed_by: req.reviewed_by
    }));

    res.json({
      success: true,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching past requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past requests',
      error: error.message
    });
  }
};

const getMonthlyRequestStats = async (req, res) => {
  try {
    const userName = req.user.name;
    const monthlyLimit = 5; // Set the monthly limit

    // Get current month's start and end dates in IST (Indian Standard Time)
    const now = new Date();
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const nowIST = new Date(now.getTime() + istOffset);
    
    // Get start of month in IST
    const startOfMonth = new Date(nowIST.getFullYear(), nowIST.getMonth(), 1);
    // Convert back to UTC for database query
    const startOfMonthUTC = new Date(startOfMonth.getTime() - istOffset);
    
    // Get end of month in IST
    const endOfMonth = new Date(nowIST.getFullYear(), nowIST.getMonth() + 1, 0, 23, 59, 59, 999);
    // Convert back to UTC for database query
    const endOfMonthUTC = new Date(endOfMonth.getTime() - istOffset);

    // Get all entry requests for the current month (both pending and approved)
    const monthlyRequests = await prisma.todaysWorklog.findMany({
      where: {
        name: userName,
        is_entry_request: true,
        date: {
          gte: startOfMonthUTC,
          lte: endOfMonthUTC
        },
        request_status: {
          in: ['Pending', 'Approved'] // Count both pending and approved requests
        }
      },
      select: {
        date: true,
        request_status: true
      }
    });

    // Count unique days (distinct dates) for the current month
    const uniqueDays = new Set();
    monthlyRequests.forEach(request => {
      // Convert stored UTC date to IST for accurate day calculation
      const dateInIST = new Date(request.date.getTime() + istOffset);
      const dateStr = dateInIST.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      uniqueDays.add(dateStr);
    });

    const currentMonthDays = uniqueDays.size;
    const isLimitReached = currentMonthDays >= monthlyLimit;

    res.json({
      success: true,
      currentMonthDays,
      monthlyLimit,
      isLimitReached,
      currentMonth: nowIST.toLocaleString('default', { month: 'long', year: 'numeric' })
    });

  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly statistics',
      error: error.message
    });
  }
};

module.exports = {
  submitEntryRequest,
  getPendingRequests,
  getPastRequests,
  getUnitTypeForCombination,
  getMonthlyRequestStats
};
