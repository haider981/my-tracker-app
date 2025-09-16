const express = require("express");
const { 
  manualTriggerAutoSubmitAndLeave,
  manualTriggerAutoLeave // Keep for backward compatibility
} = require("../controllers/scheduledJobController");

const authMiddleware = require("../middleware/auth"); 

const router = express.Router();

// New endpoint: Manual trigger for auto-submit worklogs and leave assignment
router.post("/auto-submit-worklogs", authMiddleware, manualTriggerAutoSubmitAndLeave);

// Legacy endpoint: Manual trigger for testing (kept for backward compatibility)
router.post("/auto-assign-leave", authMiddleware, manualTriggerAutoLeave);

module.exports = router;
