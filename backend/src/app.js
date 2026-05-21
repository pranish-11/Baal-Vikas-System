const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const apiRouter = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});

app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP so inline scripts and media devices work
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(limiter);

const path = require("path");
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "../../axion-montessori-prototype (1).html"));
});

app.use(apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
