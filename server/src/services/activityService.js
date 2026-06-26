const prisma = require("../lib/prisma");
const {
  notifyParent,
  notifyParentViaNotification,
  buildActivityMessage,
} = require("./notificationService");

async function getActivities() {
  const activities = await prisma.activity.findMany({
    orderBy: { id: "desc" },
  });

  return activities.map((item) => ({
    id: item.id,
    icon: item.icon,
    bg: "var(--primary-pale)",
    title: item.title,
    desc: item.desc,
    time: item.timeLabel,
    studentId: item.studentId || null,
  }));
}

/**
 * Creates a new activity. If studentId is provided, automatically
 * notifies the student's parent via the Messages system.
 *
 * @param {object} data
 * @param {string} data.icon
 * @param {string} data.title
 * @param {string} data.desc
 * @param {string} [data.studentId]   - optional: link activity to a student
 * @param {string} [data.studentName] - optional: used in parent message
 * @param {string} actorId            - the user (teacher/admin) creating the activity
 */
async function createActivity(data, actorId) {
  const timeLabel = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const activity = await prisma.activity.create({
    data: {
      icon: data.icon || "📋",
      title: data.title,
      desc: data.desc,
      timeLabel,
      studentId: data.studentId || null,
    },
  });

  // Auto-notify parent if this activity is linked to a student
  let notification = { sent: false };
  if (data.studentId && actorId) {
    const studentName = data.studentName || "your child";
    const msg = buildActivityMessage(studentName, data.title, data.desc);
    notification = await notifyParent(data.studentId, msg, actorId);
    notifyParentViaNotification(data.studentId, data.title, data.desc, "activity", null).catch(err => console.error("[activityService] notifyParentViaNotification:", err.message));
  }

  return {
    id: activity.id,
    icon: activity.icon,
    bg: "var(--primary-pale)",
    title: activity.title,
    desc: activity.desc,
    time: activity.timeLabel,
    studentId: activity.studentId || null,
    notification, // tells the caller whether parent was notified
  };
}

module.exports = { getActivities, createActivity };
