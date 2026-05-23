const prisma = require("../lib/prisma");

async function getAttendance(req, res, next) {
  try {
    const { studentId, date, classroomId } = req.query;
    const where = {};

    if (studentId) where.studentId = studentId;
    if (date) {
      const d = new Date(date);
      where.date = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }
    if (classroomId) {
      const students = await prisma.student.findMany({
        where: { classroomId },
        select: { id: true },
      });
      where.studentId = { in: students.map((s) => s.id) };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      take: 100,
    });

    return res.json(records);
  } catch (err) {
    return next(err);
  }
}

async function markAttendance(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    if (role !== "TEACHER" && role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers and admins can mark attendance" });
    }

    const { records } = req.body; // [{ studentId, status, note? }]
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: "records array required" });
    }

    const today = new Date(new Date().toISOString().slice(0, 10));
    const results = [];

    for (const rec of records) {
      // Upsert: update if already marked today, otherwise create
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: rec.studentId,
          date: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
      });

      let attendance;
      if (existing) {
        attendance = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: rec.status, note: rec.note || null },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            studentId: rec.studentId,
            date: today,
            status: rec.status,
            note: rec.note || null,
            markedBy: userId,
          },
        });
      }
      results.push(attendance);

      // Create notification for parent
      const student = await prisma.student.findUnique({
        where: { id: rec.studentId },
        select: { firstName: true, lastName: true, parentId: true },
      });

      if (student) {
        await prisma.notification.create({
          data: {
            userId: student.parentId,
            type: "ATTENDANCE",
            title: "Attendance Marked",
            body: `${student.firstName} ${student.lastName} was marked ${rec.status} today.`,
            payload: JSON.stringify({ studentId: rec.studentId, status: rec.status }),
          },
        });

        // Emit socket event if io is available
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${student.parentId}`).emit("notification", {
            type: "ATTENDANCE",
            title: "Attendance Marked",
            body: `${student.firstName} ${student.lastName} was marked ${rec.status} today.`,
          });
        }
      }
    }

    return res.json({ count: results.length, records: results });
  } catch (err) {
    return next(err);
  }
}

async function todayByClassroom(req, res, next) {
  try {
    const { classroomId } = req.params;
    const today = new Date(new Date().toISOString().slice(0, 10));

    const students = await prisma.student.findMany({
      where: { classroomId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    });

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        date: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    });

    const attendanceMap = {};
    for (const a of attendance) attendanceMap[a.studentId] = a;

    const result = students.map((s) => ({
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      status: attendanceMap[s.id]?.status || null,
      note: attendanceMap[s.id]?.note || null,
      attendanceId: attendanceMap[s.id]?.id || null,
    }));

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAttendance, markAttendance, todayByClassroom };
