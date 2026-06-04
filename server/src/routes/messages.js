const express = require("express");
const { listMessages, createChatMessage, listEligibleUsers, createNewThread } = require("../controllers/messageController");
const { validate } = require("../middleware/validate");
const { postChatSchema, createThreadSchema, messageParamSchema } = require("../validators/messageValidators");

const router = express.Router();

router.get("/users", listEligibleUsers);
router.post("/new", validate(createThreadSchema), createNewThread);

router.get("/", listMessages);
router.post("/:id/chat", validate(messageParamSchema, "params"), validate(postChatSchema), createChatMessage);

module.exports = router;
