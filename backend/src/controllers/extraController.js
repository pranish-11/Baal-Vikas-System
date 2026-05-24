const prisma = require("../lib/prisma");

async function createObservation(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    if (role !== "TEACHER" && role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers can create observations" });
    }

    const { studentId, tags, note } = req.body;
    if (!studentId || !tags || tags.length === 0) {
      return res.status(400).json({ error: "studentId and tags required" });
    }

    const observation = await prisma.observation.create({
      data: {
        studentId,
        teacherId: userId,
        tags,
        note: note || null,
        date: new Date(),
      },
    });

    // Notify parent
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true, parentId: true },
    });

    if (student) {
      await prisma.notification.create({
        data: {
          userId: student.parentId,
          type: "OBSERVATION",
          title: "New Teacher Observation",
          body: `${student.firstName} ${student.lastName}: ${tags.join(", ")}${note ? " — " + note.slice(0, 60) : ""}`,
          payload: JSON.stringify({ studentId, observationId: observation.id }),
        },
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${student.parentId}`).emit("notification", {
          type: "OBSERVATION",
          title: "New Teacher Observation",
          body: `${student.firstName}: ${tags.join(", ")}`,
        });
      }
    }

    return res.status(201).json(observation);
  } catch (err) {
    return next(err);
  }
}

async function updateBehaviorPoints(req, res, next) {
  try {
    const { role } = req.user;
    if (role !== "TEACHER" && role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers/admins can update behavior points" });
    }

    const { id } = req.params;
    const { points, reason } = req.body;
    if (points === undefined) return res.status(400).json({ error: "points required" });

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const newPoints = student.behaviorPoints + Number(points);
    const updated = await prisma.student.update({
      where: { id },
      data: { behaviorPoints: Math.max(0, newPoints) },
    });

    // Notify parent
    await prisma.notification.create({
      data: {
        userId: student.parentId,
        type: "BEHAVIOR",
        title: points > 0 ? "Behavior Points Awarded 🌟" : "Behavior Points Deducted",
        body: `${student.firstName} ${student.lastName} ${points > 0 ? "earned" : "lost"} ${Math.abs(points)} behavior point(s)${reason ? ": " + reason : ""}. Total: ${Math.max(0, newPoints)}`,
        payload: JSON.stringify({ studentId: id }),
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${student.parentId}`).emit("notification", {
        type: "BEHAVIOR",
        title: points > 0 ? "Points Awarded 🌟" : "Points Deducted",
        body: `${student.firstName}: ${points > 0 ? "+" : ""}${points} points`,
      });
    }

    return res.json({ id: updated.id, behaviorPoints: updated.behaviorPoints });
  } catch (err) {
    return next(err);
  }
}

// List all contacts (teachers, parents, admins) for messaging
async function listContacts(req, res, next) {
  try {
    const { sub: userId } = req.user;
    const users = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      orderBy: { name: "asc" },
    });
    return res.json(users);
  } catch (err) {
    return next(err);
  }
}

// Admin only: create a teacher
const bcrypt = require("bcryptjs");

async function createTeacher(req, res, next) {
  try {
    const { role } = req.user;
    if (role !== "ADMIN") return res.status(403).json({ error: "Only admins can create teachers" });

    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Missing required fields" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const teacher = await prisma.user.create({
      data: { email, passwordHash, name, role: "TEACHER" },
      select: { id: true, email: true, name: true, role: true }
    });

    return res.status(201).json(teacher);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createObservation, updateBehaviorPoints, listContacts, createTeacher };
