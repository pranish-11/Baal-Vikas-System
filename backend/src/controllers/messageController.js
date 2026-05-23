const prisma = require("../lib/prisma");
const { encrypt, decrypt } = require("../utils/encryption");

async function getConversations(req, res, next) {
  try {
    const userId = req.user.sub;

    // Get all messages where user is sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        isDeleted: false,
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Group by conversation partner
    const convMap = {};
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!partnerId) continue;
      if (!convMap[partnerId]) {
        convMap[partnerId] = {
          partnerId,
          lastMessage: null,
          unreadCount: 0,
        };
      }
      if (!convMap[partnerId].lastMessage) {
        let plainText = "";
        try { plainText = decrypt(msg.content, msg.iv); } catch { plainText = "[encrypted]"; }
        convMap[partnerId].lastMessage = {
          id: msg.id,
          preview: plainText.slice(0, 80),
          senderId: msg.senderId,
          createdAt: msg.createdAt,
        };
      }
      if (msg.senderId !== userId && !msg.readBy.includes(userId)) {
        convMap[partnerId].unreadCount++;
      }
    }

    // Get partner details
    const partnerIds = Object.keys(convMap);
    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
    const partnerMap = {};
    for (const p of partners) partnerMap[p.id] = p;

    const conversations = partnerIds
      .map((pid) => ({
        ...convMap[pid],
        partner: partnerMap[pid] || { id: pid, name: "Unknown", role: "UNKNOWN" },
      }))
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || 0;
        return new Date(bTime) - new Date(aTime);
      });

    return res.json(conversations);
  } catch (err) {
    return next(err);
  }
}

async function getThread(req, res, next) {
  try {
    const userId = req.user.sub;
    const { recipientId } = req.params;
    const { before, limit = 30 } = req.query;

    const where = {
      isDeleted: false,
      OR: [
        { senderId: userId, recipientId },
        { senderId: recipientId, recipientId: userId },
      ],
    };
    if (before) where.createdAt = { lt: new Date(before) };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });

    const decrypted = messages.map((msg) => {
      let text = "";
      try { text = decrypt(msg.content, msg.iv); } catch { text = "[decryption failed]"; }
      return {
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: text,
        createdAt: msg.createdAt,
        isRead: msg.readBy.includes(userId) || msg.senderId === userId,
        attachmentUrl: msg.attachmentUrl,
        attachmentType: msg.attachmentType,
      };
    });

    return res.json(decrypted.reverse());
  } catch (err) {
    return next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const userId = req.user.sub;
    const { recipientId, content } = req.body;
    if (!recipientId || !content) {
      return res.status(400).json({ error: "recipientId and content required" });
    }

    // Encrypt message
    const { content: encrypted, iv } = encrypt(content);

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        recipientId,
        content: encrypted,
        iv,
        readBy: [userId],
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    });

    const payload = {
      id: message.id,
      senderId: userId,
      senderName: sender?.name || "Unknown",
      recipientId,
      content, // plain text for socket
      createdAt: message.createdAt,
    };

    // Emit via socket
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${recipientId}`).emit("new_message", payload);

      // Also create notification
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: "MESSAGE",
          title: `New message from ${sender?.name}`,
          body: content.slice(0, 100),
          payload: JSON.stringify({ senderId: userId }),
        },
      });
      io.to(`user:${recipientId}`).emit("notification", {
        type: "MESSAGE",
        title: `New message from ${sender?.name}`,
        body: content.slice(0, 100),
      });
    }

    return res.status(201).json(payload);
  } catch (err) {
    return next(err);
  }
}

async function markMessageRead(req, res, next) {
  try {
    const userId = req.user.sub;
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.readBy.includes(userId)) {
      await prisma.message.update({
        where: { id: req.params.id },
        data: { readBy: { push: userId } },
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${message.senderId}`).emit("message_read", {
        messageId: req.params.id,
        readBy: userId,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    await prisma.message.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getConversations, getThread, sendMessage, markMessageRead, deleteMessage };
