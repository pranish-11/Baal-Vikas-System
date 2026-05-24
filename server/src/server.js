require("dotenv").config();
const http = require("http");
const app = require("./app");
const { setupSocket } = require("./socket");

const PORT = Number(process.env.PORT || 8011);
const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, "127.0.0.1", { reuseAddr: true }, () => {
  console.log(`Axion backend running at http://127.0.0.1:${PORT}`);
});
