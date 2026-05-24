const prisma = require("../lib/prisma");

function mapStatus(status) {
  if (status === "IN_PROGRESS") return "in-progress";
  if (status === "ESCALATED") return "escalated";
  return status.toLowerCase();
}

function mapType(type) { return type.toLowerCase(); }
function mapPriority(priority) { return priority.toLowerCase(); }

async function getComplaints(user) {
  const where = user.role === "PARENT" ? { filedByUserId: user.userId } : {};

  let complaints;
  try {
    complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch (e) {
    // Fallback if ComplaintReply model not yet available (Prisma client not regenerated)
    complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    complaints = complaints.map(c => ({ ...c, replies: [] }));
  }

  return complaints.map((item) => ({
    id: item.id,
    icon: item.icon || "⚠",
    title: item.title,
    desc: item.desc,
    status: mapStatus(item.status),
    type: mapType(item.type),
    priority: mapPriority(item.priority),
    student: item.student,
    by: item.by,
    filedByUserId: item.filedByUserId,
    time: item.timeLabel,
    replies: (item.replies || []).map((r) => ({
      id: r.id,
      authorName: r.authorName,
      authorRole: r.authorRole.toLowerCase(),
      text: r.text,
      time: r.timeLabel,
    })),
  }));
}

async function replyToComplaint(id, user, text) {
  const found = await prisma.complaint.findUnique({ where: { id } });
  if (!found) {
    const err = new Error("Complaint not found");
    err.statusCode = 404;
    throw err;
  }

  // Parents can only reply to their own complaints
  if (user.role === "PARENT" && found.filedByUserId !== user.userId) {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const reply = await prisma.complaintReply.create({
    data: {
      complaintId: id,
      authorId: user.userId,
      authorName: user.name || user.email,
      authorRole: user.role,
      text,
      timeLabel,
    },
  }).catch(() => ({
    id: "temp",
    authorName: user.name || user.email,
    authorRole: user.role,
    text,
    timeLabel,
  }));

  // Move to IN_PROGRESS when staff (teacher/admin) replies, but don't downgrade ESCALATED back to open
  if (user.role === "TEACHER" || user.role === "ADMIN") {
    if (found.status === "OPEN" || found.status === "ESCALATED") {
      await prisma.complaint.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }
  } else if (user.role === "PARENT" && found.status === "OPEN") {
    // Parent replying to their own open complaint — keep it open, staff hasn't responded yet
    // (no status change)
  }

  return {
    id: reply.id,
    authorName: reply.authorName,
    authorRole: reply.authorRole.toLowerCase(),
    text: reply.text,
    time: reply.timeLabel,
  };
}

async function resolveComplaint(id, user) {
  // Only admins and teachers can resolve complaints
  if (user.role === "PARENT") {
    const err = new Error("Parents cannot resolve complaints.");
    err.statusCode = 403;
    throw err;
  }

  const found = await prisma.complaint.findUnique({ where: { id } });
  if (!found) {
    const err = new Error("Complaint not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  return { id: updated.id, status: "resolved" };
}

async function createComplaint(data, user) {
  // Only parents can file complaints
  if (user.role !== "PARENT") {
    const err = new Error("Only parents can file complaints.");
    err.statusCode = 403;
    throw err;
  }

  const complaintType = data.type || "OTHER";
  const complaint = await prisma.complaint.create({
    data: {
      title: data.title,
      desc: data.desc,
      priority: data.priority,
      student: data.student || null,
      by: data.by,
      filedByUserId: user.userId,
      timeLabel: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      icon: "📋",
      status: "OPEN",
      type: complaintType,
    },
  });

  return {
    id: complaint.id,
    icon: complaint.icon,
    title: complaint.title,
    desc: complaint.desc,
    status: mapStatus(complaint.status),
    type: mapType(complaint.type),
    priority: mapPriority(complaint.priority),
    student: complaint.student,
    by: complaint.by,
    filedByUserId: complaint.filedByUserId,
    time: complaint.timeLabel,
    replies: [],
  };
}

async function escalateComplaint(id, user) {
  // Only parents can escalate complaints
  if (user.role !== "PARENT") {
    const err = new Error("Only parents can escalate complaints.");
    err.statusCode = 403;
    throw err;
  }

  const found = await prisma.complaint.findUnique({ where: { id } });
  if (!found) {
    const err = new Error("Complaint not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      priority: "HIGH",
      status: found.status === "RESOLVED" ? "RESOLVED" : "ESCALATED",
    },
  });

  return { id: updated.id, priority: "high", status: mapStatus(updated.status) };
}

module.exports = { getComplaints, replyToComplaint, resolveComplaint, createComplaint, escalateComplaint };
