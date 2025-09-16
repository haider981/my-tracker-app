const express = require('express');
const router = express.Router();
const spocAddProjectController = require('../controllers/spocAddProjectController');
const authenticateToken = require("../middleware/auth");

// POST /api/projects - Create a new project
router.post('/',authenticateToken, spocAddProjectController.createProject);

// GET /api/projects - Get all projects
router.get('/',authenticateToken, spocAddProjectController.getAllProjects);

// GET /api/projects/:project_id - Get a specific project by ID
router.get('/:project_id', authenticateToken, spocAddProjectController.getProjectById);

// PUT /api/projects/:project_id/status - Update project status (for admin)
router.put('/:project_id/status', authenticateToken, spocAddProjectController.updateProjectStatus);

module.exports = router;
