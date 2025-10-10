const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const dropdownController = require('../controllers/teamWiseDropdownController');

// Team routes
router.get('/teams/all', authenticateToken, dropdownController.getAllTeams);
router.get('/:teamName', authenticateToken, dropdownController.getDropdownDataByTeam);
router.post('/', authenticateToken, dropdownController.addDropdownValue);
router.put('/', authenticateToken, dropdownController.updateDropdownValue);
router.delete('/', authenticateToken, dropdownController.deleteDropdownValue);

module.exports = router;
