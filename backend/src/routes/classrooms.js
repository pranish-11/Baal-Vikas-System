const express = require("express");
const { list, getById, assignTeacher } = require("../controllers/classroomController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getById);
router.patch("/:id/assign-teacher", requireAuth, assignTeacher);
module.exports = router;
