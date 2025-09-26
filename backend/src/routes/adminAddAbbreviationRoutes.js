const express = require('express');
const router = express.Router();
const {
  getAbbreviations,
  getAllAbbreviationsBySegment,
  addAbbreviation,
  updateAbbreviation,
  deleteAbbreviation
} = require('../controllers/adminAddAbbreviationController');


const authenticateToken = require('../middleware/auth'); 

// GET /api/abbreviations?type=Subject&segment=UNI
router.get('/', authenticateToken, getAbbreviations);

// GET /api/abbreviations/segment/UNI - Get all abbreviations for a segment grouped by type
router.get('/segment/:segment', authenticateToken, getAllAbbreviationsBySegment);

// POST /api/abbreviations
router.post('/', authenticateToken, addAbbreviation);

// PUT /api/abbreviations/:id
router.put('/:id', authenticateToken, updateAbbreviation);

// DELETE /api/abbreviations/:id
router.delete('/:id', authenticateToken, deleteAbbreviation);

module.exports = router;
