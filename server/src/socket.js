const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join a room for the user (identified by userId)
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
      }
    });

    // Broadcast new message to recipient in real-time
    socket.on("send_message", (data) => {
      const { recipientId, threadId, message } = data;
      if (recipientId) {
        io.to(recipientId).emit("new_message", {
          threadId,
          message,
          from: socket.userId || null,
        });
      }
    });

    // Update userId association after auth
    socket.on("identify", (userId) => {
      if (userId) {
        socket.userId = userId;
        socket.join(userId);
        console.log(`Socket ${socket.id} identified as user ${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { setupSocket };
