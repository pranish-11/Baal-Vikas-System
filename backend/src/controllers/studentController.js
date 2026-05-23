const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    let where = {};

    if (role === "TEACHER") {
      const classroom = await prisma.classroom.findUnique({ where: { teacherId: userId } });
      if (classroom) where.classroomId = classroom.id;
      else return res.json([]);
    } else if (role === "PARENT") {
      where.parentId = userId;
    }

    const students = await prisma.student.findMany({
      where,
      include: { classroom: { select: { name: true } } },
      orderBy: { firstName: "asc" },
    });

    return res.json(
      students.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        age: s.age,
        classroom: s.classroom.name,
        classroomId: s.classroomId,
        behaviorPoints: s.behaviorPoints,
        profilePhoto: s.profilePhoto,
      }))
    );
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classroom: { select: { name: true, id: true } },
        attendance: { orderBy: { date: "desc" }, take: 30 },
        fees: { orderBy: { createdAt: "desc" } },
        observations: { orderBy: { date: "desc" }, take: 10 },
      },
    });

    if (!student) return res.status(404).json({ error: "Student not found" });

    const totalAttendance = student.attendance.length;
    const present = student.attendance.filter((a) => a.status === "PRESENT").length;
    const absent = student.attendance.filter((a) => a.status === "ABSENT").length;
    const late = student.attendance.filter((a) => a.status === "LATE").length;

    return res.json({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age,
      classroom: student.classroom.name,
      classroomId: student.classroomId,
      enrollmentDate: student.enrollmentDate,
      medicalNotes: student.medicalNotes,
      behaviorPoints: student.behaviorPoints,
      profilePhoto: student.profilePhoto,
      attendance: {
        total: totalAttendance,
        present,
        absent,
        late,
        rate: totalAttendance > 0 ? Math.round((present / totalAttendance) * 100) : 0,
        recent: student.attendance.slice(0, 10),
      },
      fees: student.fees.map((f) => ({
        id: f.id,
        title: f.title,
        amount: f.amount,
        amountPaid: f.amountPaid,
        status: f.status,
        dueDate: f.dueDate,
      })),
      observations: student.observations.map((o) => ({
        id: o.id,
        tags: o.tags,
        note: o.note,
        date: o.date,
        aiSummary: o.aiSummary,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById };
