// const express = require("express");
// const router = express.Router();
// const authenticateToken = require("../middleware/auth");
// const { 
//   submitWorklogs, 
//   getRecentWorklogs, 
//   saveTodaysWorklog, 
//   updateTodaysWorklog, 
//   deleteTodaysWorklog, 
//   getTodaysWorklog, 
//   bulkSaveTodaysWorklog,
//   resubmitRejectedWorklog 
// } = require("../controllers/worklogController");

// // Final submission routes (existing)
// router.post("/", authenticateToken, submitWorklogs);
// router.get("/recent", authenticateToken, getRecentWorklogs);

// // Today's worklog routes (existing)
// router.post("/today", authenticateToken, saveTodaysWorklog);
// router.put("/today/:id", authenticateToken, updateTodaysWorklog);
// router.delete("/today/:id", authenticateToken, deleteTodaysWorklog);
// router.get("/today", authenticateToken, getTodaysWorklog);
// router.post("/today/bulk", authenticateToken, bulkSaveTodaysWorklog);

// // NEW: Resubmission route
// router.put("/resubmit/:id", authenticateToken, resubmitRejectedWorklog);

// module.exports = router;


const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { 
  submitWorklogs, 
  getRecentWorklogs, 
  saveTodaysWorklog, 
  updateTodaysWorklog, 
  deleteTodaysWorklog, 
  getTodaysWorklog, 
  bulkSaveTodaysWorklog,
  resubmitRejectedWorklog,
  getTeamWiseDropdowns
} = require("../controllers/worklogController");

// Final submission routes (existing)
router.post("/", authenticateToken, submitWorklogs);
router.get("/recent", authenticateToken, getRecentWorklogs);

// Today's worklog routes (existing)
router.post("/today", authenticateToken, saveTodaysWorklog);
router.put("/today/:id", authenticateToken, updateTodaysWorklog);
router.delete("/today/:id", authenticateToken, deleteTodaysWorklog);
router.get("/today", authenticateToken, getTodaysWorklog);
router.post("/today/bulk", authenticateToken, bulkSaveTodaysWorklog);

// NEW: Resubmission route
router.put("/resubmit/:id", authenticateToken, resubmitRejectedWorklog);
router.get("/team-dropdowns",authenticateToken,getTeamWiseDropdowns);

module.exports = router;
