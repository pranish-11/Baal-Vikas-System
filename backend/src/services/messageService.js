const prisma = require("../lib/prisma");

async function getEligibleUsers(user) {
  let roles = [];
  if (user.role === 'PARENT') roles = ['TEACHER'];
  else if (user.role === 'TEACHER') roles = ['PARENT'];
  else if (user.role === 'ADMIN') roles = ['TEACHER', 'PARENT'];

  const users = await prisma.user.findMany({
    where: { 
      role: { in: roles },
      id: { not: user.userId }
    },
    select: { id: true, name: true, role: true }
  });
  return users;
}

async function getMessages(user) {
  let whereClause = {};
  if (user.role !== 'ADMIN') {
    whereClause = { participantIds: { has: user.userId } };
  }

  const threads = await prisma.messageThread.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      participants: true,
      chats: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return threads.map((thread) => {
    // For admin: if they are a participant show the other person,
    // otherwise show the non-admin participant (prefer teacher so teacher threads are visible)
    let otherUser;
    if (thread.participantIds.includes(user.userId)) {
      otherUser = thread.participants.find(p => p.id !== user.userId) || thread.participants[0];
    } else {
      // Admin viewing a teacher↔parent thread — show the teacher as the label
      otherUser =
        thread.participants.find(p => p.role === 'TEACHER') ||
        thread.participants.find(p => p.role === 'PARENT') ||
        thread.participants[0];
    }

    const avi = otherUser?.name?.substring(0, 2).toUpperCase() || 'U';

    let aColor = 'var(--surface2)';
    let aText = 'var(--text2)';
    if (otherUser?.role === 'TEACHER') {
      aColor = 'var(--sky-pale)'; aText = 'var(--sky)';
    } else if (otherUser?.role === 'PARENT') {
      aColor = 'var(--coral-pale)'; aText = 'var(--coral)';
    } else if (otherUser?.role === 'ADMIN') {
      aColor = 'var(--primary-pale)'; aText = 'var(--primary)';
    }

    // For admin viewing a thread they're not in, show messages from the
    // teacher's perspective: teacher = out (right), parent = in (left)
    const teacherInThread = thread.participants.find(p => p.role === 'TEACHER');
    const isAdminObserver = user.role === 'ADMIN' && !thread.participantIds.includes(user.userId);

    return {
      id: thread.id,
      sender: otherUser?.name || 'Unknown',
      role: otherUser?.role
        ? otherUser.role.charAt(0) + otherUser.role.slice(1).toLowerCase()
        : 'User',
      preview: thread.preview || "",
      time: thread.timeLabel,
      unread: false,
      avi,
      aColor,
      aText,
      chat: thread.chats.map((chat) => {
        let isOut;
        if (isAdminObserver) {
          // Show teacher messages on the right, parent on the left
          isOut = teacherInThread ? chat.senderId === teacherInThread.id : false;
        } else {
          isOut = chat.senderId === user.userId;
        }
        return {
          from: isOut ? "out" : "in",
          from_dir: isOut ? "out" : "in",
          text: chat.text,
          time: chat.timeLabel,
        };
      }),
    };
  });
}

async function addMessageChat(threadId, payload, user) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    const err = new Error("Message thread not found");
    err.statusCode = 404;
    throw err;
  }

  // Admin can reply to any thread; others must be a participant
  if (user.role !== 'ADMIN' && !thread.participantIds.includes(user.userId)) {
    const err = new Error("Unauthorized to message in this thread");
    err.statusCode = 403;
    throw err;
  }

  // If admin is not yet a participant, add them so their messages are tracked
  if (user.role === 'ADMIN' && !thread.participantIds.includes(user.userId)) {
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { participantIds: { push: user.userId } },
    });
  }

  const created = await prisma.messageChat.create({
    data: {
      threadId,
      senderId: user.userId,
      text: payload.text,
      timeLabel: payload.time || 'Now',
    },
  });

  await prisma.messageThread.update({
    where: { id: threadId },
    data: {
      preview: payload.text,
      timeLabel: payload.time || 'Now',
    },
  });

  return {
    id: created.id,
    threadId: created.threadId,
    from_dir: "out",
    text: created.text,
    time: created.timeLabel,
  };
}

async function createThread(user, payload) {
  const { recipientId, text, time } = payload;
  if (!recipientId) {
    const err = new Error("Recipient is required.");
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.messageThread.findFirst({
    where: {
      participantIds: {
        hasEvery: [user.userId, recipientId]
      }
    }
  });

  if (existing) {
    if (text) {
      return await addMessageChat(existing.id, payload, user);
    }
    return { threadId: existing.id };
  }

  const newThreadData = {
    participantIds: [user.userId, recipientId],
    preview: text || "New conversation",
    timeLabel: time || 'Now',
  };

  if (text) {
    newThreadData.chats = {
      create: {
        senderId: user.userId,
        text: text,
        timeLabel: time || 'Now'
      }
    };
  }

  const newThread = await prisma.messageThread.create({
    data: newThreadData
  });

  return { threadId: newThread.id };
}

module.exports = { getMessages, addMessageChat, getEligibleUsers, createThread };
