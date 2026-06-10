const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can manage users" });
    }
    const users = await prisma.user.findMany({
      where: { role: { in: ["TEACHER", "PARENT"] } },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can delete users" });
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "ADMIN") {
      return res.status(403).json({ error: "Cannot delete admin accounts" });
    }
    if (user.id === req.user.userId) {
      return res.status(403).json({ error: "Cannot delete your own account" });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `${user.name} (${user.role.toLowerCase()}) removed` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
