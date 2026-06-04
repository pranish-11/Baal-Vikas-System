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
  const threads = await prisma.messageThread.findMany({
    where: { participantIds: { has: user.userId } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: true,
      chats: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return threads.map((thread) => {
    let otherUser = thread.participants.find(p => p.id !== user.userId) || thread.participants[0];

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

    const participantNames = {};
    const participantRoles = {};
    const participantAvis = {};
    for (const p of thread.participants) {
      participantNames[p.id] = p.name;
      participantRoles[p.id] = p.role;
      participantAvis[p.id] = p.name.substring(0, 2).toUpperCase();
    }

    return {
      id: thread.id,
      participants: thread.participantIds,
      participantNames,
      participantRoles,
      participantAvis,
      senderId: otherUser?.id || null,
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
        const isOut = chat.senderId === user.userId;
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

  // Sender must be a participant
  if (!thread.participantIds.includes(user.userId)) {
    const err = new Error("Unauthorized to message in this thread");
    err.statusCode = 403;
    throw err;
  }

  // Recipient must be a participant in the thread
  const { recipientId } = payload;
  if (!recipientId || !thread.participantIds.includes(recipientId)) {
    const err = new Error("Valid recipientId is required and must be a thread participant");
    err.statusCode = 400;
    throw err;
  }

  const created = await prisma.messageChat.create({
    data: {
      threadId,
      senderId: user.userId,
      recipientId,
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
        recipientId,
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
