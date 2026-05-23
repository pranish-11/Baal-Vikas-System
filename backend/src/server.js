require("dotenv").config();
const app = require("./app");
const attachSocket = require("./socket");

const PORT = Number(process.env.PORT) || 8011;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Axion API listening on http://127.0.0.1:${PORT} (LAN: use your PC IP on port ${PORT})`
  );
});

// Attach Socket.io
const io = attachSocket(server);
app.set("io", io);
console.log("Socket.io attached — real-time messaging ready");

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use. Another server (or nodemon) is still running.\n` +
        `  PowerShell: Get-NetTCPConnection -LocalPort ${PORT} | Select OwningProcess\n` +
        `  Then: Stop-Process -Id <PID> -Force\n` +
        `  Or run: powershell -File scripts/kill-port-8011.ps1\n`
    );
  } else {
    console.error("Server failed to start:", err);
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});
