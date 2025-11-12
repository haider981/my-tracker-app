const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const addEntryRequestController = require('../controllers/addEntryRequestController');

// POST /api/entry-requests - Submit a new entry request
router.post('/', authenticateToken, addEntryRequestController.submitEntryRequest);

// GET /api/entry-requests/pending - Get pending entry requests for the logged-in employee
router.get('/pending', authenticateToken, addEntryRequestController.getPendingRequests);

// GET /api/entry-requests/past - Get past (approved/rejected) entry requests
router.get('/past', authenticateToken, addEntryRequestController.getPastRequests);

router.get("/unit-type-lookup", authenticateToken, addEntryRequestController.getUnitTypeForCombination);

router.get('/monthly-stats', authenticateToken, addEntryRequestController.getMonthlyRequestStats);

module.exports = router;
