const { addMessageChat, getMessages, getEligibleUsers, createThread } = require("../services/messageService");

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
