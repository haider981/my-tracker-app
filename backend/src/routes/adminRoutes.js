const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authenticateToken = require("../middleware/auth");

// Worklog management routes
router.post('/worklogs', authenticateToken, AdminController.getWorklogs);
router.put('/worklogs/update-status', authenticateToken, AdminController.updateWorklogStatus);
router.put('/worklogs/bulk-update-status', authenticateToken, AdminController.bulkUpdateWorklogStatus);
router.get('/worklogs/summary', authenticateToken, AdminController.getWorklogSummary);

// User management routes
router.get('/users', authenticateToken, AdminController.getAllUsers);
router.get('/users/by-role', authenticateToken, AdminController.getUsersByRole);

module.exports = router;
