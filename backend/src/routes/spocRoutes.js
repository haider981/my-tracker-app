// const express = require('express');
// const router = express.Router();
// const SpocController = require('../controllers/spocController');
// const authenticateToken = require("../middleware/auth");

// // Routes - Note: Using SpocController.methodName instead of importing methods directly
// router.get('/worklogs/pending', authenticateToken, SpocController.getPendingWorklogs);
// router.put('/worklogs/update-status', authenticateToken, SpocController.updateWorklogStatus);
// router.get('/worklogs/summary', authenticateToken, SpocController.getWorklogSummary);
// router.get('/employees', authenticateToken, SpocController.getEmployeesUnderSpoc);

// module.exports = router;

const express = require('express');
const router = express.Router();
const SpocController = require('../controllers/spocController');
const authenticateToken = require("../middleware/auth");

router.post('/worklogs', authenticateToken, SpocController.getWorklogs);
router.put('/worklogs/update-status', authenticateToken, SpocController.updateWorklogStatus);
router.put('/worklogs/bulk-update-status', authenticateToken, SpocController.bulkUpdateWorklogStatus);
router.get('/worklogs/summary', authenticateToken, SpocController.getWorklogSummary);
router.get('/employees', authenticateToken, SpocController.getEmployeesUnderSpoc);
router.get('/unit-type-lookup', authenticateToken, SpocController.getUnitTypeForCombination);

module.exports = router;
