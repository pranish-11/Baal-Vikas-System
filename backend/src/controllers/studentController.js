const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    let where = {};

    if (role === "TEACHER") {
      const classrooms = await prisma.classroom.findMany({ where: { teacherId: userId } });
      if (classrooms.length > 0) where.classroomId = { in: classrooms.map((c) => c.id) };
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

async function create(req, res, next) {
  try {
    const { firstName, lastName, age, parentEmail, classroomId, enrollmentDate, medicalNotes } = req.body;
    
    // Check parent
    const parent = await prisma.user.findUnique({ where: { email: parentEmail } });
    if (!parent || parent.role !== "PARENT") {
      return res.status(400).json({ error: "Invalid parent email or user is not a PARENT" });
    }

    // Check classroom
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!classroom) {
      return res.status(400).json({ error: "Invalid classroom ID" });
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        age: Number(age),
        parentId: parent.id,
        classroomId,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        medicalNotes,
      },
    });
    
    return res.status(201).json(student);
  } catch (err) {
    return next(err);
  }
}

async function assignClassroom(req, res, next) {
  try {
    const { id } = req.params;
    const { classroomId } = req.body;

    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!classroom) {
      return res.status(400).json({ error: "Invalid classroom ID" });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: { classroomId },
    });

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const { classroomId } = req.query;
    let where = {}; // Show all students regardless of points
    
    if (classroomId) {
      where.classroomId = classroomId;
    }

    const students = await prisma.student.findMany({
      where,
      include: { classroom: { select: { name: true } } },
      orderBy: { behaviorPoints: "desc" },
      take: 50, // Top 50 max
    });

    return res.json(
      students.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
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

module.exports = { list, getById, create, assignClassroom, getLeaderboard };
