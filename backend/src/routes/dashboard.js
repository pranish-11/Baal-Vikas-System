const express = require("express");
const { summary } = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/summary", requireAuth, summary);
module.exports = router;
