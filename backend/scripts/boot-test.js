require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

try {
  require("../src/app");
  console.log("OK: app loaded");
  console.log("PORT", process.env.PORT);
  console.log("JWT_SECRET set", Boolean(process.env.JWT_SECRET));
} catch (err) {
  console.error("BOOT_FAIL:", err.message);
  console.error(err.stack);
  process.exit(1);
}
