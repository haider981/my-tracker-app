const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminProjectRequestController");
const authMiddleware = require("../middleware/auth");

// frontend calls POST for requests
router.post("/requests", authMiddleware, ctrl.getProjectRequests);

// single update
router.put("/update-status", authMiddleware, ctrl.updateProjectStatus);

// bulk update
router.put("/bulk-update-status", authMiddleware, ctrl.bulkUpdateProjectStatus);

router.get("/spocs", authMiddleware, ctrl.getSpocs);

module.exports = router;
