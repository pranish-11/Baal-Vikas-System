const express = require("express");
const { listComplaints, replyToComplaintById, resolveComplaintById, escalateComplaintById, createNewComplaint } = require("../controllers/complaintController");
const { validate } = require("../middleware/validate");
const { complaintParamSchema, createComplaintSchema } = require("../validators/complaintValidators");

const router = express.Router();

router.get("/", listComplaints);
router.post("/", validate(createComplaintSchema, "body"), createNewComplaint);
router.post("/:id/reply", validate(complaintParamSchema, "params"), replyToComplaintById);
router.patch("/:id/resolve", validate(complaintParamSchema, "params"), resolveComplaintById);
router.patch("/:id/escalate", validate(complaintParamSchema, "params"), escalateComplaintById);

module.exports = router;
