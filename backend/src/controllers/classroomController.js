const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: {
        _count: { select: { students: true } },
        teacher: { select: { name: true, id: true } },
        school: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return res.json(
      classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        school: c.school.name,
        teacher: c.teacher?.name || "Unassigned",
        teacherId: c.teacherId,
        studentCount: c._count.students,
        cameraUrl: c.cameraUrl,
      }))
    );
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { name: true, email: true } },
        school: { select: { name: true } },
        students: {
          select: { id: true, firstName: true, lastName: true, age: true, behaviorPoints: true },
          orderBy: { firstName: "asc" },
        },
      },
    });
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });
    return res.json(classroom);
  } catch (err) {
    return next(err);
  }
}

async function assignTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    
    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    // Validate teacher role
    if (teacherId) {
      const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
      if (!teacher || teacher.role !== "TEACHER") {
        return res.status(400).json({ error: "Invalid teacher ID" });
      }
    }

    // Assign teacher
    const updated = await prisma.classroom.update({
      where: { id },
      data: { teacherId: teacherId || null },
    });
    
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById, assignTeacher };
