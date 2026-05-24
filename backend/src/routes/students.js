const express = require("express");
const { list, getById, create, assignClassroom } = require("../controllers/studentController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.get("/:id", requireAuth, getById);
router.patch("/:id/classroom", requireAuth, assignClassroom);
module.exports = router;
