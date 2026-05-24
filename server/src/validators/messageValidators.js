const { z } = require("zod");

const postChatSchema = z.object({
  from_dir: z.enum(["in", "out"]),
  text: z.string().trim().min(1, "text is required"),
  time: z.string().trim().min(1, "time is required"),
});

const messageParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id must be a valid MongoDB ObjectId"),
});

module.exports = { postChatSchema, messageParamSchema };
