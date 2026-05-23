const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    const { status } = req.query;
    const where = {};

    if (role === "PARENT") where.parentId = userId;
    if (status) where.status = status;

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(fees);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const fee = await prisma.fee.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        parent: { select: { name: true, email: true } },
      },
    });
    if (!fee) return res.status(404).json({ error: "Fee not found" });
    return res.json(fee);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById };
