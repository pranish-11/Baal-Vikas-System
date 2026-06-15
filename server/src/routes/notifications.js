const express = require("express");
const ctrl = require("../controllers/notificationController");

const router = express.Router();

router.get("/", ctrl.getMyNotifications);
router.post("/test", ctrl.sendTestNotification);
router.patch("/:id/read", ctrl.markRead);
router.post("/read-all", ctrl.markAllRead);
router.delete("/clear-read", ctrl.clearAllRead);
router.delete("/:id", ctrl.deleteOne);

module.exports = router;
