const express = require('express');
const router = express.Router();
const adminAddProjectController = require('../controllers/adminAddProjectController');
const authenticateToken = require("../middleware/auth");

// POST /api/projects - Create a new project
router.post('/projects',authenticateToken, adminAddProjectController.createProject);

// GET /api/projects - Get all projects
router.get('/projects',authenticateToken, adminAddProjectController.getAllProjects);

// GET /api/projects/:project_id - Get a specific project by ID
router.get('/:project_id', authenticateToken, adminAddProjectController.getProjectById);

// PUT /api/projects/:project_id/status - Update project status (for admin)
router.put('/:project_id/status', authenticateToken, adminAddProjectController.updateProjectStatus);

module.exports = router;
