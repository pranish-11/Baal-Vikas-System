const express = require("express");
const { getAttendance, markAttendance, todayByClassroom } = require("../controllers/attendanceController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, getAttendance);
router.post("/", requireAuth, markAttendance);
router.get("/today/:classroomId", requireAuth, todayByClassroom);
module.exports = router;
