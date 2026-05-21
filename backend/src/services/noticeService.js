const prisma = require("../lib/prisma");

async function getNotices(user) {
  // Parents see notices targeted at ALL or PARENT
  // Teachers see notices targeted at ALL or TEACHER
  // Admins see everything
  let where = {};
  if (user.role === "PARENT") {
    where = { targetRole: { in: ["ALL", "PARENT"] } };
  } else if (user.role === "TEACHER") {
    where = { targetRole: { in: ["ALL", "TEACHER"] } };
  }

  const notices = await prisma.notice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notices.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    authorName: n.authorName,
    authorRole: n.authorRole.toLowerCase(),
    targetRole: n.targetRole,
    createdAt: n.createdAt.toISOString(),
  }));
}

async function createNotice(data, user) {
  if (user.role === "PARENT") {
    const err = new Error("Parents cannot broadcast notices.");
    err.statusCode = 403;
    throw err;
  }

  if (!data.title || !data.body) {
    const err = new Error("title and body are required.");
    err.statusCode = 400;
    throw err;
  }

  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      body: data.body,
      authorId: user.userId,
      authorName: user.name || user.email,
      authorRole: user.role,
      targetRole: data.targetRole || "ALL",
    },
  });

  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    authorName: notice.authorName,
    authorRole: notice.authorRole.toLowerCase(),
    targetRole: notice.targetRole,
    createdAt: notice.createdAt.toISOString(),
  };
}

async function deleteNotice(id, user) {
  if (user.role !== "ADMIN") {
    const err = new Error("Only admins can delete notices.");
    err.statusCode = 403;
    throw err;
  }
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Notice not found");
    err.statusCode = 404;
    throw err;
  }
  await prisma.notice.delete({ where: { id } });
}

module.exports = { getNotices, createNotice, deleteNotice };
