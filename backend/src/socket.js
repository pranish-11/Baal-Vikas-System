const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

module.exports = function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { sub: userId, role, name } = socket.user;
    console.log(`Socket connected: ${name} (${role}) [${userId}]`);

    // Join personal room
    socket.join(`user:${userId}`);
    // Join role room for broadcasts
    socket.join(`role:${role}`);

    // Handle typing indicators
    socket.on("typing_start", ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit("typing", { userId, name, isTyping: true });
    });

    socket.on("typing_stop", ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit("typing", { userId, name, isTyping: false });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${name} [${userId}]`);
    });
  });

  return io;
};
