const notificationService = require("../services/notificationService");
const prisma = require("../lib/prisma");

const DEMO_IDS = {
  'admin@axion.edu': '000000000000000000000000',
  'anika@axion.edu': '000000000000000000000001',
  'lena@axion.edu': '000000000000000000000002',
};

async function resolveUserIds(user) {
  const ids = [user.userId];
  if (user.email) {
    const emailId = user.email.replace(/[^a-z0-9]/gi, '_');
    if (emailId !== user.userId) ids.push(emailId);
    const demoId = DEMO_IDS[user.email];
    if (demoId && !ids.includes(demoId)) ids.push(demoId);
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
      if (dbUser && !ids.includes(dbUser.id)) ids.push(dbUser.id);
    } catch {}
  }
  return ids;
}

async function getMyNotifications(req, res, next) {
  try {
    const ids = await resolveUserIds(req.user);
    const items = await notificationService.getNotifications(ids);
    const unread = await notificationService.getUnreadCount(ids);
    res.json({ items, unread });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const ids = await resolveUserIds(req.user);
    await notificationService.markRead(req.params.id, ids);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const ids = await resolveUserIds(req.user);
    await notificationService.markAllRead(ids);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function clearAllRead(req, res, next) {
  try {
    const ids = await resolveUserIds(req.user);
    await notificationService.deleteAllRead(ids);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteOne(req, res, next) {
  try {
    const ids = await resolveUserIds(req.user);
    await notificationService.deleteOne(req.params.id, ids);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function sendTestNotification(req, res, next) {
  try {
    const ids = await resolveUserIds(req.user);
    const created = [];
    for (const uid of ids) {
      const n = await notificationService.createNotification({
        userId: uid,
        role: req.user.role || 'ADMIN',
        title: '🔔 Test notification',
        body: 'This is a test — if you see this, notifications work!',
        type: 'notice',
        link: null,
      });
      if (n) created.push(n.id);
    }
    res.json({ success: true, created, forUserIds: ids });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyNotifications, markRead, markAllRead, clearAllRead, deleteOne, sendTestNotification };
