const express = require('express');
const router = express.Router();
const spocApproveMissingRequest = require('../controllers/spocApproveMissingRequest'); // Adjust path as needed
const authMiddleware = require('../middleware/auth'); // Your JWT auth middleware

// GET /api/spoc/employees - Get all employees under this SPOC
router.get('/employees', authMiddleware, spocApproveMissingRequest.getEmployees);

// POST /api/spoc/worklogs - Get worklogs with filters
router.post('/worklogs', authMiddleware, spocApproveMissingRequest.getWorklogs);

// PUT /api/spoc/worklogs/update-status - Update single worklog audit status
router.put('/worklogs/update-status', authMiddleware, spocApproveMissingRequest.updateWorklogStatus);

// PUT /api/spoc/worklogs/bulk-update-status - Bulk update worklog audit status
router.put('/worklogs/bulk-update-status', authMiddleware, spocApproveMissingRequest.bulkUpdateWorklogStatus);

module.exports = router;
