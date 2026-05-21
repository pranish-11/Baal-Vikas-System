const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "axion-super-secret-key-123";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Missing token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
}

module.exports = authMiddleware;
