const express = require("express");
const { listCameras, getAnalysis, analyzeFrame } = require("../controllers/cctvController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/classrooms", requireAuth, listCameras);
router.get("/analysis/:classroomId", requireAuth, getAnalysis);
router.post("/analyze/:classroomId", requireAuth, analyzeFrame);

module.exports = router;
