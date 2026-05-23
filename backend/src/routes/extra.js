const express = require("express");
const { createObservation, updateBehaviorPoints, listContacts } = require("../controllers/extraController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/observations", requireAuth, createObservation);
router.patch("/students/:id/behavior", requireAuth, updateBehaviorPoints);
router.get("/contacts", requireAuth, listContacts);
module.exports = router;
