const express = require("express");
const { markShifts, getShiftHistory, getEmployeesUnderSpoc, checkExistingShifts, deleteShiftEntry,getActiveShifts} = require("../controllers/markShiftController");
// const { markShifts, getShiftHistory, getEmployeesUnderSpoc} = require("../controllers/markShiftController");

const router = express.Router();

router.get("/employees-under-spoc", getEmployeesUnderSpoc);
router.post("/mark", markShifts);
router.get("/history", getShiftHistory);
router.get("/active", getActiveShifts);
router.get("/check-existing", checkExistingShifts);
router.delete("/", deleteShiftEntry);


module.exports=router;
