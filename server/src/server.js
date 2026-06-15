require("dotenv").config();
const http = require("http");
const app = require("./app");
const { setupSocket } = require("./socket");

const PORT = Number(process.env.PORT || 8011);
// Bind to 0.0.0.0 so the server is reachable from other machines on the network.
// On a VPS/cloud host this is required for external access.
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, HOST, { reuseAddr: true }, () => {
  console.log(`Axion backend running at http://${HOST}:${PORT}`);
});
