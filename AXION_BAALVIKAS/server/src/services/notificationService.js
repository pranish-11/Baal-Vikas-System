const prisma = require("../lib/prisma");
const { getIO } = require("../socket");

const DEMO_EMAIL_TO_ID = {
  'admin@axion.edu': '000000000000000000000000',
  'anika@axion.edu': '000000000000000000000001',
  'lena@axion.edu': '000000000000000000000002',
};

function getEmailBasedId(email) {
  return email.replace(/[^a-z0-9]/gi, '_');
}

/**
 * Create a notification and emit real-time socket event.
 */
async function createNotification({ userId, role, title, body, type, link, extraUserIds }) {
  try {
    const notif = await prisma.notification.create({
      data: { userId, role, title, body, type, link, read: false },
    });
    const io = getIO();
    if (io) {
      const emitTo = [userId, ...(extraUserIds || [])];
      for (const uid of [...new Set(emitTo)]) {
        io.to(uid).emit("notification", {
          id: notif.id,
          title,
          body,
          type,
          link,
          role,
          createdAt: notif.createdAt,
        });
      }
    }
    return notif;
  } catch (err) {
    console.error("[createNotification] Error:", err.message);
    return null;
  }
}

/**
 * Get notifications for a user, sorted newest first.
 * Accepts a single userId or array of userIds.
 */
async function getNotifications(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  return prisma.notification.findMany({
    where: { userId: { in: ids } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Get unread count for a user.
 * Accepts a single userId or array of userIds.
 */
async function getUnreadCount(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  return prisma.notification.count({
    where: { userId: { in: ids }, read: false },
  });
}

/**
 * Mark a single notification as read.
 */
async function markRead(notifId, userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  return prisma.notification.updateMany({
    where: { id: notifId, userId: { in: ids } },
    data: { read: true },
  });
}

async function markAllRead(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  return prisma.notification.updateMany({
    where: { userId: { in: ids }, read: false },
    data: { read: true },
  });
}

async function deleteAllRead(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  return prisma.notification.deleteMany({
    where: { userId: { in: ids }, read: true },
  });
}

async function deleteOne(notifId, userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  return prisma.notification.deleteMany({
    where: { id: notifId, userId: { in: ids } },
  });
}

// ─── Legacy notifyParent via Messages system ───

async function notifyParent(studentId, message, senderId) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { fullName: true, parentEmail: true, parentName: true },
    });
    if (!student || !student.parentEmail) return { sent: false, reason: "No parent email on file" };
    const parentUser = await prisma.user.findUnique({
      where: { email: student.parentEmail },
      select: { id: true, name: true, role: true },
    });
    if (!parentUser || parentUser.role !== "PARENT") return { sent: false, reason: "Parent has no account yet" };
    const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const existing = await prisma.messageThread.findFirst({
      where: { participantIds: { hasEvery: [senderId, parentUser.id] } },
    });
    if (existing) {
      await prisma.messageChat.create({ data: { threadId: existing.id, senderId, text: message, timeLabel } });
      await prisma.messageThread.update({ where: { id: existing.id }, data: { preview: message, timeLabel, updatedAt: new Date() } });
      return { sent: true, threadId: existing.id, parentName: parentUser.name };
    }
    const newThread = await prisma.messageThread.create({
      data: { participantIds: [senderId, parentUser.id], preview: message, timeLabel, chats: { create: { senderId, text: message, timeLabel } } },
    });
    return { sent: true, threadId: newThread.id, parentName: parentUser.name };
  } catch (err) {
    console.error("[notifyParent] Error:", err.message);
    return { sent: false, reason: err.message };
  }
}

function buildActivityMessage(studentName, activityTitle, activityDesc) {
  return `📚 Update about ${studentName}: ${activityTitle}. ${activityDesc} — Axion Montessori System`;
}
function buildAwardMessage(studentName, points, description) {
  return `🌟 Great news! ${studentName} was awarded ${points} behavior point${points !== 1 ? "s" : ""} today. "${description}" — Axion Montessori System`;
}
function buildAttendanceMessage(studentName, status) {
  if (status === "present") return `✅ ${studentName} has arrived at school and is present today. — Axion Montessori System`;
  if (status === "absent") return `⚠️ ${studentName} has been marked absent today. Please contact the school if this is unexpected. — Axion Montessori System`;
  return `📋 Attendance update for ${studentName}: ${status}. — Axion Montessori System`;
}

// ─── New helper: notify parent via new Notification system ───

async function notifyParentViaNotification(studentId, title, body, type, link) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { parentEmail: true },
    });
    if (!student || !student.parentEmail) return null;
    const parentUser = await prisma.user.findUnique({
      where: { email: student.parentEmail },
    });
    const extraUserIds = [];
    const emailId = getEmailBasedId(student.parentEmail);
    if (emailId) extraUserIds.push(emailId);
    const demoId = DEMO_EMAIL_TO_ID[student.parentEmail];
    if (demoId) extraUserIds.push(demoId);
    if (parentUser && parentUser.role === "PARENT") {
      return createNotification({ userId: parentUser.id, role: "PARENT", title, body, type, link, extraUserIds });
    }
    // Fallback: use email-based ID for demo/mock users
    return createNotification({ userId: emailId, role: "PARENT", title, body, type, link, extraUserIds });
  } catch (err) {
    console.error("[notifyParentViaNotification] Error:", err.message);
    return null;
  }
}

async function notifyAdmins(title, body, type, link) {
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    const seen = new Set();
    for (const admin of admins) {
      const extra = [];
      const emailId = getEmailBasedId(admin.email);
      if (emailId) extra.push(emailId);
      const demoId = DEMO_EMAIL_TO_ID[admin.email];
      if (demoId) extra.push(demoId);
      await createNotification({ userId: admin.id, role: "ADMIN", title, body, type, link, extraUserIds: extra });
      seen.add(admin.id);
    }
    // Fallback for demo admin token
    const demoAdminId = '000000000000000000000000';
    if (!seen.has(demoAdminId)) {
      const extra = [getEmailBasedId('admin@axion.edu')].filter(Boolean);
      await createNotification({ userId: demoAdminId, role: "ADMIN", title, body, type, link, extraUserIds: extra });
    }
  } catch (err) {
    console.error("[notifyAdmins] Error:", err.message);
  }
}

async function notifyTeachers(title, body, type, link) {
  try {
    const teachers = await prisma.user.findMany({ where: { role: "TEACHER" } });
    const seen = new Set();
    for (const t of teachers) {
      const extra = [];
      const emailId = getEmailBasedId(t.email);
      if (emailId) extra.push(emailId);
      const demoId = DEMO_EMAIL_TO_ID[t.email];
      if (demoId) extra.push(demoId);
      await createNotification({ userId: t.id, role: "TEACHER", title, body, type, link, extraUserIds: extra });
      seen.add(t.id);
    }
    // Fallback for demo teacher token
    const demoTeacherId = '000000000000000000000001';
    if (!seen.has(demoTeacherId)) {
      const extra = [getEmailBasedId('anika@axion.edu')].filter(Boolean);
      await createNotification({ userId: demoTeacherId, role: "TEACHER", title, body, type, link, extraUserIds: extra });
    }
  } catch (err) {
    console.error("[notifyTeachers] Error:", err.message);
  }
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteAllRead,
  deleteOne,
  notifyParent,
  buildActivityMessage,
  buildAwardMessage,
  buildAttendanceMessage,
  notifyParentViaNotification,
  notifyAdmins,
  notifyTeachers,
};
