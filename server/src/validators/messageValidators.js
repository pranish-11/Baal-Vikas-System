const { z } = require("zod");

const postChatSchema = z.object({
  from_dir: z.enum(["in", "out"]).optional().default("out"),
  text: z.string().trim().min(1, "text is required"),
  time: z.string().trim().optional().default("Now"),
});

const messageParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id must be a valid MongoDB ObjectId"),
});

module.exports = { postChatSchema, messageParamSchema };
