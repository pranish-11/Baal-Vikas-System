const { z } = require("zod");

const complaintParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id must be a valid MongoDB ObjectId"),
});

const createComplaintSchema = z.object({
  title: z.string().min(1),
  desc: z.string().min(1),
  priority: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(["LOW", "MEDIUM", "HIGH"])),
  student: z.string().optional(),
  by: z.string().min(1),
  type: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(["BEHAVIOR", "SAFETY", "OTHER"]))
    .optional(),
});

module.exports = { complaintParamSchema, createComplaintSchema };
