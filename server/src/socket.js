const { Server } = require("socket.io");
const prisma = require("./lib/prisma");

let io = null;

function setupSocket(server) {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
      }
    });

    socket.on("send_message", (data) => {
      const { recipientIds, threadId, message, senderId } = data;
      const ids = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
      for (const id of ids) {
        if (id !== senderId) {
          io.to(id).emit("new_message", {
            threadId,
            message,
            from: socket.userId || null,
          });
        }
      }
    });

    socket.on("identify", async (userId, email) => {
      let resolvedId = userId;
      if (email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
          if (dbUser) resolvedId = dbUser.id;
        } catch {}
      }
      if (resolvedId) {
        socket.userId = resolvedId;
        socket.join(resolvedId);
        console.log(`Socket ${socket.id} identified as user ${resolvedId}${resolvedId !== userId ? ' (resolved from ' + userId + ')' : ''}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
