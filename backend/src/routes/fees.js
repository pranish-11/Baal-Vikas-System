const express = require("express");
const {
  listFees,
  listFeesByStudent,
  createNewFee,
  recordFeePayment,
  payFeeOnline,
  sendFeeReminder,
  deleteFeeRecord,
  feeSummary,
} = require("../controllers/feeController");
const { validate } = require("../middleware/validate");
const {
  feeParamSchema,
  createFeeSchema,
  recordPaymentSchema,
  sendReminderSchema,
} = require("../validators/feeValidators");

const router = express.Router();

// GET /api/fees — list all fees (admin/teacher) or own child's fees (parent)
router.get("/", listFees);

// GET /api/fees/summary — aggregate stats (admin/teacher only)
router.get("/summary", feeSummary);

// GET /api/fees/student/:studentId — fees for a specific student
router.get("/student/:studentId", listFeesByStudent);

// POST /api/fees — create a new fee record (admin/teacher only)
router.post("/", validate(createFeeSchema, "body"), createNewFee);

// PATCH /api/fees/:id/pay — admin/teacher records an offline payment
router.patch("/:id/pay", validate(feeParamSchema, "params"), validate(recordPaymentSchema, "body"), recordFeePayment);

// POST /api/fees/:id/pay-online — parent (or staff) pays the full balance online
router.post("/:id/pay-online", validate(feeParamSchema, "params"), payFeeOnline);

// POST /api/fees/:id/remind — send a payment reminder to the parent
router.post("/:id/remind", validate(feeParamSchema, "params"), validate(sendReminderSchema, "body"), sendFeeReminder);

// DELETE /api/fees/:id — delete a fee record (admin only)
router.delete("/:id", validate(feeParamSchema, "params"), deleteFeeRecord);

module.exports = router;
