const prisma = require("../lib/prisma");
const { notifyParent, notifyParentViaNotification, buildAttendanceMessage } = require("./notificationService");

/**
 * Get attendance records for a given date.
 * Returns a map of { studentId: status } for that date.
 * Optionally filtered by classroomName.
 */
async function getAttendanceByDate(dateStr, user) {
  const records = await prisma.attendanceRecord.findMany({
    where: { date: dateStr },
  });

  // Parents can only see their own child's attendance
  if (user.role === "PARENT") {
    const parentEmail = user.email;
    const linkedStudents = await prisma.student.findMany({
      where: { parentEmail: { equals: parentEmail, mode: "insensitive" } },
      select: { id: true },
    });
    const allowedIds = new Set(linkedStudents.map((s) => s.id));
    return records
      .filter((r) => allowedIds.has(r.studentId))
      .reduce((acc, r) => {
        acc[r.studentId] = r.status;
        return acc;
      }, {});
  }

  return records.reduce((acc, r) => {
    acc[r.studentId] = r.status;
    return acc;
  }, {});
}

/**
 * Get attendance records for a student across a date range.
 * Used for monthly reports and history.
 */
async function getAttendanceByStudent(studentId, user, fromDate, toDate) {
  // Parents can only see their own child
  if (user.role === "PARENT") {
    const parentEmail = user.email;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (
      !student ||
      !parentEmail ||
      student.parentEmail?.toLowerCase() !== parentEmail.toLowerCase()
    ) {
      const err = new Error("Unauthorized");
      err.statusCode = 403;
      throw err;
    }
  }

  const where = { studentId };
  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) where.date.gte = fromDate;
    if (toDate) where.date.lte = toDate;
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "desc" },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === "present" || r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const leave = records.filter((r) => r.status === "leave").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    studentId,
    records: records.map((r) => ({
      date: r.date,
      status: r.status,
      note: r.note || null,
    })),
    summary: { total, present, absent, leave, pct },
  };
}

/**
 * Save (upsert) attendance for a full day.
 * Accepts { records: { [studentId]: status }, date: 'YYYY-MM-DD', note?: string }
 * Only teachers and admins can mark attendance.
 */
async function saveAttendance(data, user) {
  if (user.role === "PARENT") {
    const err = new Error("Parents cannot mark attendance.");
    err.statusCode = 403;
    throw err;
  }

  const { date, records } = data;
  if (!date || !records || typeof records !== "object") {
    const err = new Error("date and records are required.");
    err.statusCode = 400;
    throw err;
  }

  const studentIds = Object.keys(records);
  if (studentIds.length === 0) return { saved: 0 };

  // Upsert each record
  const ops = studentIds.map((studentId) =>
    prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId, date } },
      update: {
        status: records[studentId],
        markedBy: user.userId,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        date,
        status: records[studentId],
        markedBy: user.userId,
      },
    })
  );

  await Promise.all(ops);

  // Auto-notify parents of absent students
  const absentIds = studentIds.filter((id) => records[id] === "absent");
  for (const studentId of absentIds) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { fullName: true, parentEmail: true },
    });
    if (student && student.parentEmail) {
      const msg = buildAttendanceMessage(student.fullName, "absent");
      await notifyParent(studentId, msg, user.userId).catch(() => {});
      await notifyParentViaNotification(studentId, `${student.fullName} is absent`, `Marked absent today`, "attendance", null).catch(() => {});
    }
  }

  return { saved: studentIds.length, date };
}

/**
 * Get a monthly attendance report for all students.
 * Returns per-student summary for the given month (YYYY-MM).
 */
async function getMonthlyReport(month, user) {
  if (user.role === "PARENT") {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  // month = 'YYYY-MM'
  const fromDate = `${month}-01`;
  const year = parseInt(month.split("-")[0]);
  const mon = parseInt(month.split("-")[1]);
  const lastDay = new Date(year, mon, 0).getDate();
  const toDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const records = await prisma.attendanceRecord.findMany({
    where: { date: { gte: fromDate, lte: toDate } },
  });

  const students = await prisma.student.findMany({
    select: { id: true, fullName: true, className: true },
  });

  const byStudent = {};
  for (const s of students) {
    byStudent[s.id] = {
      studentId: s.id,
      name: s.fullName,
      class: s.className,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      total: 0,
      pct: 0,
    };
  }

  for (const r of records) {
    if (!byStudent[r.studentId]) continue;
    byStudent[r.studentId].total++;
    if (r.status === "present") byStudent[r.studentId].present++;
    else if (r.status === "absent") byStudent[r.studentId].absent++;
    else if (r.status === "late") byStudent[r.studentId].late++;
    else if (r.status === "leave") byStudent[r.studentId].leave++;
  }

  for (const id of Object.keys(byStudent)) {
    const s = byStudent[id];
    const attended = s.present + s.late;
    s.pct = s.total > 0 ? Math.round((attended / s.total) * 100) : 0;
  }

  return {
    month,
    fromDate,
    toDate,
    students: Object.values(byStudent),
  };
}

module.exports = {
  getAttendanceByDate,
  getAttendanceByStudent,
  saveAttendance,
  getMonthlyReport,
};
