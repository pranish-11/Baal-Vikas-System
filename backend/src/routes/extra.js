const express = require("express");
const { createObservation, updateBehaviorPoints, listContacts, createTeacher } = require("../controllers/extraController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/observations", requireAuth, createObservation);
router.patch("/students/:id/behavior", requireAuth, updateBehaviorPoints);
router.get("/contacts", requireAuth, listContacts);
router.post("/users/teacher", requireAuth, createTeacher);

module.exports = router;
