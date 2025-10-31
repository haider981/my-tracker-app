const express = require('express');
const router = express.Router();
const adminPushMissingRequestController = require('../controllers/adminPushMissingRequestController');
const authMiddleware = require('../middleware/auth'); // Your JWT auth middleware

// GET /api/admin/employees - Get all employees for filter dropdown
router.get('/employees', authMiddleware, adminPushMissingRequestController.getAllEmployees);

// POST /api/admin/entry-requests - Get all pending entry requests (SPOC approved only)
router.post('/entry-requests', authMiddleware, adminPushMissingRequestController.getPendingEntryRequests);

// PUT /api/admin/entry-requests/approve - Approve single entry request (Push to database)
router.put('/approve', authMiddleware, adminPushMissingRequestController.approveEntryRequest);

// PUT /api/admin/entry-requests/reject - Reject single entry request
router.put('/reject', authMiddleware, adminPushMissingRequestController.rejectEntryRequest);

// PUT /api/admin/entry-requests/bulk-approve - Bulk approve entry requests
router.put('/bulk-approve', authMiddleware, adminPushMissingRequestController.bulkApproveEntryRequests);

module.exports = router;
