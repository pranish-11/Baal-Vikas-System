const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const { role } = req.user;
    const notices = await prisma.notice.findMany({
      where: { targetRoles: { hasSome: [role] } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return res.json(notices);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { role, sub: userId } = req.user;
    if (role !== "ADMIN" && role !== "TEACHER") {
      return res.status(403).json({ error: "Only admins and teachers can create notices" });
    }

    const { title, body, targetRoles, classroomId } = req.body;
    if (!title || !body || !targetRoles) {
      return res.status(400).json({ error: "title, body, targetRoles required" });
    }

    const notice = await prisma.notice.create({
      data: { senderId: userId, title, body, targetRoles, classroomId: classroomId || null },
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      for (const r of targetRoles) {
        io.to(`role:${r}`).emit("notification", {
          type: "NOTICE",
          title: "New Notice",
          body: title,
        });
      }
    }

    return res.status(201).json(notice);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create };
