const { z } = require("zod");

const createSchoolSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  principalName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  classrooms: z.number().int().min(0).optional(),
  teachers: z.number().int().min(0).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

const updateSchoolSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  principalName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  classrooms: z.number().int().min(0).optional(),
  teachers: z.number().int().min(0).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

module.exports = { createSchoolSchema, updateSchoolSchema };
