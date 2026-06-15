const express = require("express");
const {
  listByDate,
  listByStudent,
  markAttendance,
  monthlyReport,
  weeklyReport,
} = require("../controllers/attendanceController");

const router = express.Router();

// GET /api/attendance?date=YYYY-MM-DD  — get all records for a date
router.get("/", listByDate);

// GET /api/attendance/report?month=YYYY-MM  — monthly report (admin/teacher)
router.get("/report", monthlyReport);

// GET /api/attendance/weekly?weekStart=YYYY-MM-DD  — weekly report
router.get("/weekly", weeklyReport);

// GET /api/attendance/student/:studentId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/student/:studentId", listByStudent);

// POST /api/attendance  — save/upsert attendance for a day
router.post("/", markAttendance);

module.exports = router;
