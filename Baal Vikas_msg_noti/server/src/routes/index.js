const express = require("express");
const messagesRouter = require("./messages");
const complaintsRouter = require("./complaints");
const studentsRouter = require("./students");
const schoolsRouter = require("./schools");
const activitiesRouter = require("./activities");
const authRouter = require("./auth");
const feesRouter = require("./fees");
const dataBlobRouter = require("./dataBlob");
const authMiddleware = require("../middleware/authMiddleware");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Axion backend is running",
    endpoints: ["/health", "/health/db", "/api/messages", "/api/complaints", "/api/students", "/api/schools", "/api/activities", "/api/fees"]
  });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/health/db", async (req, res, next) => {
  try {
    await prisma.$connect();
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    err.statusCode = 500;
    next(err);
  }
});

router.use("/api/auth", authRouter);

// Protected routes
router.use("/api/messages", authMiddleware, messagesRouter);
router.use("/api/complaints", authMiddleware, complaintsRouter);
router.use("/api/students", authMiddleware, studentsRouter);
router.use("/api/schools", authMiddleware, schoolsRouter);
router.use("/api/activities", authMiddleware, activitiesRouter);
router.use("/api/fees", authMiddleware, feesRouter);
router.use("/api/data", authMiddleware, dataBlobRouter);

module.exports = router;
