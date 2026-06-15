const {
  getAttendanceByDate,
  getAttendanceByStudent,
  saveAttendance,
  getMonthlyReport,
  getWeeklyReport,
} = require("../services/attendanceService");
const { getIO } = require("../socket");

async function listByDate(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await getAttendanceByDate(date, req.user);
    res.json({ date, records });
  } catch (err) {
    next(err);
  }
}

async function listByStudent(req, res, next) {
  try {
    const { studentId } = req.params;
    const { from, to } = req.query;
    const result = await getAttendanceByStudent(studentId, req.user, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markAttendance(req, res, next) {
  try {
    const result = await saveAttendance(req.body, req.user);
    res.json(result);

    try {
      const io = getIO();
      if (io) {
        io.emit("attendance_updated", { date: req.body.date, saved: result.saved });
      }
    } catch (e) {
      console.warn("Socket emit failed:", e.message);
    }
  } catch (err) {
    next(err);
  }
}

async function weeklyReport(req, res, next) {
  try {
    const weekStart = req.query.weekStart;
    const start = weekStart || (() => {
      const now = new Date();
      const day = now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - day);
      return sunday.toISOString().slice(0, 10);
    })();
    const result = await getWeeklyReport(start, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function monthlyReport(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const result = await getMonthlyReport(month, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listByDate, listByStudent, markAttendance, monthlyReport, weeklyReport };
