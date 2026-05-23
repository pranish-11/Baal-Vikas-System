const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");
const feeRoutes = require("./routes/fees");
const notificationRoutes = require("./routes/notifications");
const noticeRoutes = require("./routes/notices");
const classroomRoutes = require("./routes/classrooms");
const messageRoutes = require("./routes/messages");
const chatRoutes = require("./routes/chat");
const complaintRoutes = require("./routes/complaints");
const extraRoutes = require("./routes/extra");

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "axion-montessori-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api", extraRoutes);

// Single error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err && (err.stack || err));
  const isProd = process.env.NODE_ENV === "production";
  res.status(err?.status || 500).json({
    error: isProd ? "Internal server error" : err?.message || "Internal server error",
    ...(isProd ? {} : { stack: err?.stack }),
  });
});

module.exports = app;