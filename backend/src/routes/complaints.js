const express = require("express");
const { list, create, update } = require("../controllers/complaintController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.patch("/:id", requireAuth, update);
module.exports = router;
