const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    const where = {};

    // Parents only see their own complaints
    if (role === "PARENT") where.filedById = userId;

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json(complaints);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    const { subject, details, priority, studentId } = req.body;

    if (!subject || !details) {
      return res.status(400).json({ error: "subject and details required" });
    }

    const complaint = await prisma.complaint.create({
      data: {
        filedById: userId,
        filedByRole: role,
        subject,
        details,
        priority: priority || "MEDIUM",
        status: "OPEN",
        studentId: studentId || null,
      },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "COMPLAINT",
          title: "New Complaint Filed",
          body: subject,
          payload: JSON.stringify({ complaintId: complaint.id }),
        },
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to("role:ADMIN").emit("notification", {
        type: "COMPLAINT",
        title: "New Complaint Filed",
        body: subject,
      });
    }

    return res.status(201).json(complaint);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { role } = req.user;
    if (role !== "ADMIN" && role !== "TEACHER") {
      return res.status(403).json({ error: "Only admin/teacher can update complaints" });
    }

    const { id } = req.params;
    const { status, reply } = req.body;

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Complaint not found" });

    const data = {};
    if (status) data.status = status; // "OPEN", "UNDER_REVIEW", "RESOLVED"
    if (status === "RESOLVED") data.resolvedAt = new Date();
    // Store reply in details (append)
    if (reply) {
      data.details = existing.details + "\n\n--- Admin/Teacher Reply ---\n" + reply;
    }

    const updated = await prisma.complaint.update({ where: { id }, data });

    // Notify the person who filed
    await prisma.notification.create({
      data: {
        userId: existing.filedById,
        type: "COMPLAINT_UPDATE",
        title: `Complaint ${status || "updated"}`,
        body: `Your complaint "${existing.subject}" has been ${status === "RESOLVED" ? "resolved ✅" : status === "UNDER_REVIEW" ? "marked as under review 🔍" : "updated"}${reply ? ". Reply: " + reply.slice(0, 80) : ""}`,
        payload: JSON.stringify({ complaintId: id }),
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${existing.filedById}`).emit("notification", {
        type: "COMPLAINT_UPDATE",
        title: `Complaint ${status || "updated"}`,
        body: `Your complaint "${existing.subject}" has been ${status === "RESOLVED" ? "resolved ✅" : "updated"}`,
      });
    }

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, update };
