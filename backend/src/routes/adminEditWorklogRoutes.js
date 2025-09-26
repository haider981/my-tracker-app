const express = require('express');
const router = express.Router();
const {
  getWorklogsForEdit,
  updateWorklogEntry,
  deleteWorklogEntry,
  createWorklogEntry,
  // getAllEmployees,
} = require('../controllers/adminEditWorklogController');

// Routes for admin worklog management

// @route   POST /api/admin/worklogs
// @desc    Get worklogs with filters for admin edit page
// @access  Private (Admin/SPOC)
router.post('/worklogs', getWorklogsForEdit);
router.post("/worklogs/create", createWorklogEntry);

// @route   GET /api/admin/users
// @desc    Get all employees for dropdown
// @access  Private (Admin/SPOC)
// router.get('/users',getAllEmployees);

// @route   POST /api/spoc/worklogs
// @desc    Create new worklog entry
// @access  Private (Admin/SPOC)
// router.post('/spoc/worklogs',createWorklogEntry);

// @route   PUT /api/spoc/worklogs/:id
// @desc    Update worklog entry
// @access  Private (Admin/SPOC)
router.put('/worklogs/:id',updateWorklogEntry);

// @route   DELETE /api/spoc/worklogs/:id
// @desc    Delete worklog entry
// @access  Private (Admin/SPOC)
router.delete('/worklogs/:id',deleteWorklogEntry);

module.exports = router;
