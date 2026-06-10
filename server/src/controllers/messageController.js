const { addMessageChat, getMessages, getEligibleUsers, createThread } = require("../services/messageService");
const { getIO } = require("../socket");

async function listMessages(req, res, next) {
  try {
    const items = await getMessages(req.user);
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function createChatMessage(req, res, next) {
  try {
    const id = req.params.id;
    const item = await addMessageChat(id, req.body, req.user);
    res.status(201).json({ item });

    // Emit socket event to all participants in real-time
    try {
      const io = getIO();
      if (io && item.participantIds) {
        for (const pid of item.participantIds) {
          if (pid !== item.senderId) {
            io.to(pid).emit("new_message", {
              threadId: id,
              chatId: item.id,
              message: {
                text: req.body.text,
                time: req.body.time || "Now",
                from: item.senderId,
                from_dir: "in",
                authorEmail: req.body.authorEmail || req.user.email || "",
              },
              from: item.senderId,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Socket emit failed:", e.message);
    }
  } catch (error) {
    next(error);
  }
}

async function listEligibleUsers(req, res, next) {
  try {
    const users = await getEligibleUsers(req.user);
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

async function createNewThread(req, res, next) {
  try {
    const result = await createThread(req.user, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { listMessages, createChatMessage, listEligibleUsers, createNewThread };
