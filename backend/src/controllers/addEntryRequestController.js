const prisma = require('../config/prisma'); 

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
        audit_status: "Pending",
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

module.exports = {
  submitEntryRequest,
  getPendingRequests,
  getPastRequests
};
