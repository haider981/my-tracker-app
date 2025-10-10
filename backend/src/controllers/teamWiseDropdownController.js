const prisma = require("../config/prisma");

const getAllTeams = async (req, res) => {
  try {
    const teams = await prisma.teamWiseDropdowns.findMany({
      select: { team: true },
      distinct: ['team']
    });

    const teamNames = teams.map(t => t.team).sort();

    res.json({ success: true, data: teamNames });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teams', error: error.message });
  }
};

// ===============================
// GET: Dropdown data for a specific team
// ===============================
const getDropdownDataByTeam = async (req, res) => {
  try {
    const { teamName } = req.params;

    // Fetch all rows for the given team
    const data = await prisma.teamWiseDropdowns.findMany({
      where: { team: teamName },
      orderBy: { id: 'asc' }
    });

    const groupedData = { bookElements: [], chapterNumbers: [], taskNames: [] };

    data.forEach(item => {
      if (item.column_header === 'book_element') groupedData.bookElements.push(item.values);
      else if (item.column_header === 'chapter_number') groupedData.chapterNumbers.push(item.values);
      else if (item.column_header === 'task') groupedData.taskNames.push(item.values);
    });

    // Remove duplicates
    groupedData.bookElements = [...new Set(groupedData.bookElements)];
    groupedData.chapterNumbers = [...new Set(groupedData.chapterNumbers)];
    groupedData.taskNames = [...new Set(groupedData.taskNames)];

    res.json({ success: true, data: groupedData });
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dropdown data', error: error.message });
  }
};


// ===============================
// POST: Add a new dropdown value
// ===============================
const addDropdownValue = async (req, res) => {
  try {
    const { teamName, columnHeader, value } = req.body;
    if (!teamName || !columnHeader || !value)
      return res.status(400).json({ success: false, message: 'Team name, column header, and value are required' });

    const validHeaders = ['book_element', 'chapter_number', 'task'];
    if (!validHeaders.includes(columnHeader))
      return res.status(400).json({ success: false, message: 'Invalid column header' });

    const existing = await prisma.teamWiseDropdowns.findFirst({
      where: { team: teamName, column_header: columnHeader, values: value.trim() }
    });

    if (existing)
      return res.status(400).json({ success: false, message: 'This value already exists' });

    const newEntry = await prisma.teamWiseDropdowns.create({
      data: { team: teamName, column_header: columnHeader, values: value.trim() }
    });

    res.status(201).json({ success: true, message: 'Value added successfully', data: newEntry });
  } catch (error) {
    console.error('Error adding dropdown value:', error);
    res.status(500).json({ success: false, message: 'Failed to add dropdown value', error: error.message });
  }
};

// ===============================
// PUT: Update a dropdown value
// ===============================
const updateDropdownValue = async (req, res) => {
  try {
    const { teamName, columnHeader, oldValue, newValue } = req.body;
    if (!teamName || !columnHeader || !oldValue || !newValue)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const validHeaders = ['book_element', 'chapter_number', 'task_name'];
    if (!validHeaders.includes(columnHeader))
      return res.status(400).json({ success: false, message: 'Invalid column header' });

    const existing = await prisma.teamWiseDropdowns.findFirst({
      where: {
        team: teamName,
        column_header: columnHeader,
        values: newValue.trim(),
        NOT: { values: oldValue.trim() }
      }
    });

    if (existing)
      return res.status(400).json({ success: false, message: 'The new value already exists' });

    const result = await prisma.teamWiseDropdowns.updateMany({
      where: { team: teamName, column_header: columnHeader, values: oldValue.trim() },
      data: { values: newValue.trim() }
    });

    if (result.count === 0)
      return res.status(404).json({ success: false, message: 'Value not found' });

    res.json({ success: true, message: 'Value updated successfully', updatedCount: result.count });
  } catch (error) {
    console.error('Error updating dropdown value:', error);
    res.status(500).json({ success: false, message: 'Failed to update dropdown value', error: error.message });
  }
};

// ===============================
// DELETE: Delete a dropdown value
// ===============================
const deleteDropdownValue = async (req, res) => {
  try {
    const { teamName, columnHeader, value } = req.body;
    if (!teamName || !columnHeader || !value)
      return res.status(400).json({ success: false, message: 'Team name, column header, and value are required' });

    const validHeaders = ['book_element', 'chapter_number', 'task'];
    if (!validHeaders.includes(columnHeader))
      return res.status(400).json({ success: false, message: 'Invalid column header' });

    const result = await prisma.teamWiseDropdowns.deleteMany({
      where: { team: teamName, column_header: columnHeader, values: value.trim() }
    });

    if (result.count === 0)
      return res.status(404).json({ success: false, message: 'Value not found' });

    res.json({ success: true, message: 'Value deleted successfully', deletedCount: result.count });
  } catch (error) {
    console.error('Error deleting dropdown value:', error);
    res.status(500).json({ success: false, message: 'Failed to delete dropdown value', error: error.message });
  }
};

module.exports = {
  getAllTeams,
  getDropdownDataByTeam,
  addDropdownValue,
  updateDropdownValue,
  deleteDropdownValue
};
