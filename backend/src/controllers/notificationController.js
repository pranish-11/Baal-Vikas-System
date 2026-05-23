const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(notifications);
  } catch (err) {
    return next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return res.json(notification);
  } catch (err) {
    return next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.sub, isRead: false },
      data: { isRead: true },
    });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, markRead, markAllRead };
