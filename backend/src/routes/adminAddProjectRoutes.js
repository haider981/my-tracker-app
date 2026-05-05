const express = require('express');
const router = express.Router();
const adminAddProjectController = require('../controllers/adminAddProjectController');
const authenticateToken = require("../middleware/auth");

// POST /api/admin/projects - Create a new project
router.post('/projects', authenticateToken, adminAddProjectController.createProject);

// GET /api/admin/projects - Get all projects
router.get('/projects', authenticateToken, adminAddProjectController.getAllProjects);
router.get('/projects/master-db-teams', authenticateToken, adminAddProjectController.getMasterDatabaseTeams);

// PUT /api/admin/projects/:project_id/status - Update project status (MUST come before generic /:project_id)
router.put('/projects/:project_id/status', authenticateToken, adminAddProjectController.updateProjectStatus);

// PUT /api/admin/projects/:project_id - Update project
router.put('/projects/:project_id', authenticateToken, adminAddProjectController.updateProject);

// DELETE /api/admin/projects/:project_id - Delete project
router.delete('/projects/:project_id', authenticateToken, adminAddProjectController.deleteProject);

// GET /api/admin/projects/:project_id - Get a specific project by ID (MUST come last)
router.get('/projects/:project_id', authenticateToken, adminAddProjectController.getProjectById);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const adminAddProjectController = require('../controllers/adminAddProjectController');
// const authenticateToken = require("../middleware/auth");

// // POST /api/admin/projects - Create a new project
// router.post('/projects', authenticateToken, adminAddProjectController.createProject);

// // GET /api/admin/projects - Get all projects
// router.get('/projects', authenticateToken, adminAddProjectController.getAllProjects);

// // PUT /api/admin/projects/:project_id/status - Update project status (MUST come before generic /:project_id)
// router.put('/projects/:project_id/status', authenticateToken, adminAddProjectController.updateProjectStatus);

// // PUT /api/admin/projects/:project_id - Update project
// router.put('/projects/:project_id', authenticateToken, adminAddProjectController.updateProject);

// // DELETE /api/admin/projects/:project_id - Delete project
// router.delete('/projects/:project_id', authenticateToken, adminAddProjectController.deleteProject);

// // GET /api/admin/projects/:project_id - Get a specific project by ID (MUST come last)
// router.get('/projects/:project_id', authenticateToken, adminAddProjectController.getProjectById);

// module.exports = router;
