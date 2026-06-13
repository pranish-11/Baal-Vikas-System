const express = require("express");
const { listMessages, createChatMessage, listEligibleUsers, createNewThread, markRead, markAllRead } = require("../controllers/messageController");
const { validate } = require("../middleware/validate");
const { postChatSchema, messageParamSchema } = require("../validators/messageValidators");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/users", listEligibleUsers);
router.post("/new", createNewThread);
router.post("/read-all", markAllRead);

router.get("/", listMessages);
router.post("/:id/chat", validate(messageParamSchema, "params"), validate(postChatSchema), createChatMessage);
router.patch("/:id/read", markRead);

router.delete("/:id", async (req, res, next) => {
  try {
    const thread = await prisma.messageThread.findUnique({ where: { id: req.params.id } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    await prisma.messageThread.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

async function findChatByThreadAndIdx(threadId, chatIdx) {
  // Accept either MongoDB ObjectId or numeric array index
  if (/^[0-9]+$/.test(chatIdx)) {
    const chats = await prisma.messageChat.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      skip: parseInt(chatIdx),
      take: 1,
    });
    return chats[0] || null;
  }
  return prisma.messageChat.findUnique({ where: { id: chatIdx } });
}

router.delete("/:id/chat/:chatIdx", async (req, res, next) => {
  try {
    const chat = await findChatByThreadAndIdx(req.params.id, req.params.chatIdx);
    if (!chat) return res.status(404).json({ error: "Message not found" });
    await prisma.messageChat.delete({ where: { id: chat.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/chat/:chatIdx", async (req, res, next) => {
  try {
    const chat = await findChatByThreadAndIdx(req.params.id, req.params.chatIdx);
    if (!chat) return res.status(404).json({ error: "Message not found" });
    const updated = await prisma.messageChat.update({
      where: { id: chat.id },
      data: { text: req.body.text },
    });
    res.json({ item: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
