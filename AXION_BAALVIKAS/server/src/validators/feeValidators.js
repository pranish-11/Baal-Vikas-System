const { z } = require("zod");

const feeParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id must be a valid MongoDB ObjectId"),
});

const createFeeSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "studentId must be a valid MongoDB ObjectId"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  term: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"]).optional(),
  dueDate: z.string().optional(), // ISO date string
});

const recordPaymentSchema = z.object({
  amountPaid: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"]).optional(),
  note: z.string().optional(),
});

const sendReminderSchema = z.object({
  message: z.string().optional(),
});

module.exports = { feeParamSchema, createFeeSchema, recordPaymentSchema, sendReminderSchema };
