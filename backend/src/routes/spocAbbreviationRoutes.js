const express = require('express');
const router = express.Router();
const abbreviationsController = require('../controllers/abbreviationsController');
const authenticateToken = require("../middleware/auth");

router.get('/segments', authenticateToken, abbreviationsController.getAllSegments);

// GET /api/admin/abbreviations/:segment - Get all abbreviations for a specific segment
router.get('/:segment', authenticateToken, abbreviationsController.getAbbreviationsBySegment);

// GET /api/admin/abbreviations/details/:id - Get abbreviation by ID
router.get('/details/:id', authenticateToken, abbreviationsController.getAbbreviationById);

module.exports = router;
