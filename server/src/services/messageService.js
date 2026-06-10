const prisma = require("../lib/prisma");

async function getEligibleUsers(user) {
  let roles = [];
  if (user.role === 'PARENT') roles = ['TEACHER', 'ADMIN'];
  else if (user.role === 'TEACHER') roles = ['PARENT', 'ADMIN'];
  else if (user.role === 'ADMIN') roles = ['TEACHER', 'PARENT'];

  const users = await prisma.user.findMany({
    where: { 
      role: { in: roles },
      id: { not: user.userId }
    },
    select: { id: true, name: true, role: true, email: true }
  });
  return users;
}

async function getMessages(user) {
  // Build all possible IDs for the current user
  const userEmailId = (user.email || '').replace(/[^a-z0-9]/gi, '_');
  const searchIds = [user.userId];
  if (userEmailId && userEmailId !== user.userId) searchIds.push(userEmailId);
  // Also resolve the user's real MongoDB ObjectId from email (handles demo tokens
  // where user.userId is a hardcoded fake that won't match DB-stored ObjectIds)
  let resolvedUserId = user.userId;
  if (user.email) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
      if (dbUser) {
        resolvedUserId = dbUser.id;
        if (!searchIds.includes(dbUser.id)) searchIds.push(dbUser.id);
      }
    } catch {}
  }

  const whereClause = searchIds.length === 1
    ? { participantIds: { has: searchIds[0] } }
    : { OR: searchIds.map(id => ({ participantIds: { has: id } })) };

  const threads = await prisma.messageThread.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
  });

  // Fetch chats for all threads separately (no explicit relation in schema)
  const threadIds = threads.map(t => t.id);
  const allChats = await prisma.messageChat.findMany({
    where: { threadId: { in: threadIds } },
    orderBy: { createdAt: "asc" },
  });
  const chatsByThread = {};
  for (const chat of allChats) {
    if (!chatsByThread[chat.threadId]) chatsByThread[chat.threadId] = [];
    chatsByThread[chat.threadId].push(chat);
  }

  // Collect all user IDs from threads
  const allUserIds = [...new Set(threads.flatMap(t => t.participantIds || []))];
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, name: true, role: true, email: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return threads.map((thread) => {
    const otherId = thread.participantIds.find(id => id !== resolvedUserId) || thread.participantIds[0];
    const otherUser = userMap[otherId] || { id: otherId, name: otherId, role: 'USER' };

    const avi = otherUser.name?.substring(0, 2).toUpperCase() || 'U';

    let aColor = 'var(--surface2)';
    let aText = 'var(--text2)';
    if (otherUser.role === 'TEACHER') {
      aColor = 'var(--sky-pale)'; aText = 'var(--sky)';
    } else if (otherUser.role === 'PARENT') {
      aColor = 'var(--coral-pale)'; aText = 'var(--coral)';
    } else if (otherUser.role === 'ADMIN') {
      aColor = 'var(--primary-pale)'; aText = 'var(--primary)';
    }

    // Build participant maps for frontend
    const participantNames = {};
    const participantRoles = {};
    const participantEmails = {};
    const participantAvis = {};
    for (const uid of thread.participantIds) {
      const u = userMap[uid];
      if (u) {
        participantNames[uid] = u.name;
        participantRoles[uid] = u.role;
        participantEmails[uid] = u.email || '';
        participantAvis[uid] = u.name.substring(0, 2).toUpperCase();
      }
    }

    // Include the user's email-based ID in response participantIds so the frontend
    // (which may use email-based IDs for matching via mockLogin) can find this thread
    const responseParticipantIds = [...thread.participantIds];
    if (userEmailId && !responseParticipantIds.includes(userEmailId)) {
      responseParticipantIds.push(userEmailId);
    }
    // Tell the frontend which IDs in participantIds belong to the current user,
    // so getContact can reliably find the other participant
    const myKnownIds = [...new Set([user.userId, resolvedUserId, userEmailId].filter(Boolean))];

    return {
      id: thread.id,
      myKnownIds,
      participantIds: responseParticipantIds,
      participantNames,
      participantRoles,
      participantEmails,
      participantAvis,
      senderId: otherId,
      sender: otherUser.name || 'Unknown',
      role: otherUser.role
        ? otherUser.role.charAt(0) + otherUser.role.slice(1).toLowerCase()
        : 'User',
      preview: thread.preview || "",
      time: thread.timeLabel,
      unread: false,
      avi,
      aColor,
      aText,
      chat: (chatsByThread[thread.id] || []).map((chat) => {
        const isOut = chat.senderId === resolvedUserId || chat.senderId === user.userId;
        return {
          chatId: chat.id,
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

  // Resolve sender to real MongoDB ObjectId (handles demo tokens)
  let resolvedSenderId = user.userId;
  if (user.email) {
    try {
      const senderUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
      if (senderUser) resolvedSenderId = senderUser.id;
    } catch {}
  }

  // Check by MongoDB ObjectId or email-based ID (backward compat with existing threads)
  const userEmailId = (user.email || '').replace(/[^a-z0-9]/gi, '_');
  const isParticipant = thread.participantIds.includes(resolvedSenderId) ||
    thread.participantIds.includes(user.userId) ||
    (userEmailId && userEmailId !== user.userId && thread.participantIds.includes(userEmailId));

  // Must be a participant to message in this thread
  if (!isParticipant) {
    const err = new Error("Unauthorized to message in this thread");
    err.statusCode = 403;
    throw err;
  }

  let finalParticipantIds = thread.participantIds;

  const created = await prisma.messageChat.create({
    data: {
      threadId,
      senderId: resolvedSenderId,
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
    participantIds: finalParticipantIds,
    senderId: resolvedSenderId,
  };
}

async function createThread(user, payload) {
  const { recipientId, recipientEmail, text, time } = payload;
  if (!recipientId) {
    const err = new Error("Recipient is required.");
    err.statusCode = 400;
    throw err;
  }

  // Resolve the sender to their real MongoDB ObjectId (handles demo tokens)
  let resolvedSenderId = user.userId;
  if (user.email) {
    try {
      const senderUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
      if (senderUser) resolvedSenderId = senderUser.id;
    } catch {}
  }

  // Resolve the recipient to their MongoDB ObjectId so participantIds are consistent
  let resolvedRecipientId = recipientId;
  if (recipientEmail) {
    const recipientUser = await prisma.user.findUnique({ where: { email: recipientEmail } });
    if (recipientUser) resolvedRecipientId = recipientUser.id;
  }

  const existing = await prisma.messageThread.findFirst({
    where: {
      participantIds: {
        hasEvery: [resolvedSenderId, resolvedRecipientId]
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
    participantIds: [resolvedSenderId, resolvedRecipientId],
    preview: text || "New conversation",
    timeLabel: time || 'Now',
  };

  if (text) {
    newThreadData.chats = {
      create: {
        senderId: resolvedSenderId,
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
