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

module.exports = { list, getById };
