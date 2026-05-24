const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "axion-super-secret-key-123";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Missing token." });
  }

  const token = authHeader.split(" ")[1];

  // Accept demo-token for offline/mock login — supports role suffix
  if (token.startsWith('demo-token')) {
    const roleMap = { admin: 'ADMIN', teacher: 'TEACHER', parent: 'PARENT' };
    const parts = token.split('-');
    const roleKey = parts[parts.length - 1];
    const role = roleMap[roleKey] || 'ADMIN';
    const profiles = {
      admin: { userId: '000000000000000000000000', role: 'ADMIN', email: 'admin@axion.edu', name: 'Admin User' },
      teacher: { userId: '000000000000000000000001', role: 'TEACHER', email: 'anika@axion.edu', name: 'Ms. Anika Roy' },
      parent: { userId: '000000000000000000000002', role: 'PARENT', email: 'lena@axion.edu', name: 'Mrs. Lena Kim' },
    };
    req.user = profiles[roleKey] || profiles.admin;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
}

module.exports = authMiddleware;
