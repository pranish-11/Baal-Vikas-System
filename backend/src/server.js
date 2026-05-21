require("dotenv").config();
const app = require("./app");

const PORT = Number(process.env.PORT || 8011);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Axion backend running at http://127.0.0.1:${PORT}`);
});
