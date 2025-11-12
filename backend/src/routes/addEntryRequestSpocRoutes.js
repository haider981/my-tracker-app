const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const addEntryRequestSpocController = require('../controllers/addEntryRequestSpocController');

// POST /api/entry-requests - Submit a new entry request
router.post('/', authenticateToken, addEntryRequestSpocController.submitEntryRequest);

// GET /api/entry-requests/pending - Get pending entry requests for the logged-in employee
router.get('/pending', authenticateToken, addEntryRequestSpocController.getPendingRequests);

// GET /api/entry-requests/past - Get past (approved/rejected) entry requests
router.get('/past', authenticateToken, addEntryRequestSpocController.getPastRequests);

router.get("/unit-type-lookup", authenticateToken, addEntryRequestSpocController.getUnitTypeForCombination);

router.get('/monthly-stats', authenticateToken, addEntryRequestSpocController.getMonthlyRequestStats);

module.exports = router;
