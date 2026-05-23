const express = require("express");
const { list, getById } = require("../controllers/studentController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getById);
module.exports = router;
