const express = require("express");
const { login, register, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", requireAuth, me);

module.exports = router;
