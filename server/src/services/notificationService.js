const prisma = require("../lib/prisma");

/**
 * Finds the parent User account linked to a student via parentEmail,
 * then sends them an automatic message in the Messages system.
 *
 * @param {string} studentId  - The student's DB id
 * @param {string} message    - The message text to send to the parent
 * @param {string} senderId   - The teacher/admin user id sending the notification
 */
async function notifyParent(studentId, message, senderId) {
  try {
    // 1. Get the student with parentEmail
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { fullName: true, parentEmail: true, parentName: true },
    });

    if (!student || !student.parentEmail) {
      // No parent email on file — skip silently
      return { sent: false, reason: "No parent email on file" };
    }

    // 2. Find the parent User account by email
    const parentUser = await prisma.user.findUnique({
      where: { email: student.parentEmail },
      select: { id: true, name: true, role: true },
    });

    if (!parentUser) {
      // Parent hasn't registered an account yet — skip silently
      return { sent: false, reason: "Parent has no account yet" };
    }

    if (parentUser.role !== "PARENT") {
      return { sent: false, reason: "Matched user is not a PARENT role" };
    }

    const timeLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 3. Find or create a message thread between sender and parent
    const existing = await prisma.messageThread.findFirst({
      where: {
        participantIds: { hasEvery: [senderId, parentUser.id] },
      },
    });

    if (existing) {
      // Add message to existing thread
      await prisma.messageChat.create({
        data: {
          threadId: existing.id,
          senderId,
          text: message,
          timeLabel,
        },
      });

      await prisma.messageThread.update({
        where: { id: existing.id },
        data: { preview: message, timeLabel, updatedAt: new Date() },
      });

      return { sent: true, threadId: existing.id, parentName: parentUser.name };
    } else {
      // Create a new thread with the first message
      const newThread = await prisma.messageThread.create({
        data: {
          participantIds: [senderId, parentUser.id],
          preview: message,
          timeLabel,
          chats: {
            create: {
              senderId,
              text: message,
              timeLabel,
            },
          },
        },
      });

      return { sent: true, threadId: newThread.id, parentName: parentUser.name };
    }
  } catch (err) {
    // Never crash the main request because of a notification failure
    console.error("[notifyParent] Failed to send parent notification:", err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Builds a friendly message for when a teacher logs a general activity
 * that involves a specific student.
 */
function buildActivityMessage(studentName, activityTitle, activityDesc) {
  return (
    `📚 Update about ${studentName}: ${activityTitle}. ${activityDesc} ` +
    `— Axion Montessori System`
  );
}

/**
 * Builds a friendly message for when a student is awarded behavior points.
 */
function buildAwardMessage(studentName, points, description) {
  return (
    `🌟 Great news! ${studentName} was awarded ${points} behavior point${points !== 1 ? "s" : ""} today. ` +
    `"${description}" — Axion Montessori System`
  );
}

/**
 * Builds a message for attendance events.
 */
function buildAttendanceMessage(studentName, status) {
  if (status === "present") {
    return `✅ ${studentName} has arrived at school and is present today. — Axion Montessori System`;
  }
  if (status === "absent") {
    return `⚠️ ${studentName} has been marked absent today. Please contact the school if this is unexpected. — Axion Montessori System`;
  }
  return `📋 Attendance update for ${studentName}: ${status}. — Axion Montessori System`;
}

module.exports = {
  notifyParent,
  buildActivityMessage,
  buildAwardMessage,
  buildAttendanceMessage,
};
