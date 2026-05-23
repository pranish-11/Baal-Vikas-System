const express = require("express");
const { list, markRead, markAllRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, list);
router.patch("/:id/read", requireAuth, markRead);
router.patch("/read-all", requireAuth, markAllRead);
module.exports = router;
