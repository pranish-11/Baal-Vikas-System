const {
  getFees,
  getFeesByStudent,
  createFee,
  recordPayment,
  payOnline,
  sendReminder,
  deleteFee,
  getFeeSummary,
} = require("../services/feeService");

async function listFees(req, res, next) {
  try {
    const items = await getFees(req.user);
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function listFeesByStudent(req, res, next) {
  try {
    const items = await getFeesByStudent(req.params.studentId, req.user);
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function createNewFee(req, res, next) {
  try {
    const item = await createFee(req.body, req.user);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

async function recordFeePayment(req, res, next) {
  try {
    const item = await recordPayment(req.params.id, req.body, req.user);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function payFeeOnline(req, res, next) {
  try {
    const item = await payOnline(req.params.id, req.user);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function sendFeeReminder(req, res, next) {
  try {
    const result = await sendReminder(req.params.id, req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteFeeRecord(req, res, next) {
  try {
    await deleteFee(req.params.id, req.user);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function feeSummary(req, res, next) {
  try {
    const summary = await getFeeSummary(req.user);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFees,
  listFeesByStudent,
  createNewFee,
  recordFeePayment,
  payFeeOnline,
  sendFeeReminder,
  deleteFeeRecord,
  feeSummary,
};
