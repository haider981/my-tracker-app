const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/adminMarkExtraShiftController');
const authenticateToken = require('../middleware/auth');

// GET /api/admin/shifts/employees - Get all employees (Admin only)
router.get('/employees', authenticateToken, shiftController.getAllEmployees);

// GET /api/admin/shifts/active - Get active/upcoming shifts (Admin only)
router.get('/active', authenticateToken, shiftController.getActiveShifts);

// GET /api/admin/shifts/history - Get historical shifts (Admin only)
router.get('/history', authenticateToken, shiftController.getHistoricalShifts);

// POST /api/admin/shifts/mark - Mark shifts for employees (Admin only)
router.post('/mark', authenticateToken, shiftController.markShifts);

// DELETE /api/admin/shifts - Delete a shift entry (Admin only)
router.delete('/', authenticateToken, shiftController.deleteShift);

module.exports = router;
