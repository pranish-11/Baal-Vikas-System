const express = require("express");
const { list, create } = require("../controllers/noticeController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
module.exports = router;
