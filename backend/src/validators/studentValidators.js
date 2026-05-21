const { z } = require("zod");

const studentParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id must be a valid MongoDB ObjectId"),
});

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.number().int().min(1).optional(),
  className: z.string().min(1),
  schoolId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  enrollmentDate: z.string().optional(),
  medicalNotes: z.string().optional()
});

const awardPointsSchema = z.object({
  points: z.number().int().min(1),
  source: z.string().optional(),
  description: z.string().optional(),
  notifyParent: z.boolean().optional()
});

module.exports = { studentParamSchema, createStudentSchema, awardPointsSchema };
