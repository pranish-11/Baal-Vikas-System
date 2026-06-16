const { getComplaints, replyToComplaint, resolveComplaint, createComplaint, escalateComplaint } = require("../services/complaintService");
const { notifyAdmins } = require("../services/notificationService");
const { getIO } = require("../socket");

async function listComplaints(req, res, next) {
  try {
    const items = await getComplaints(req.user);
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function replyToComplaintById(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Reply text is required." });
    }
    const reply = await replyToComplaint(req.params.id, req.user, text.trim());
    const io = getIO();
    if (io) io.emit("complaints_updated");
    res.status(201).json({ reply });
  } catch (error) {
    next(error);
  }
}

async function resolveComplaintById(req, res, next) {
  try {
    const item = await resolveComplaint(req.params.id, req.user);
    const io = getIO();
    if (io) io.emit("complaints_updated");
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function escalateComplaintById(req, res, next) {
  try {
    const item = await escalateComplaint(req.params.id, req.user);
    const io = getIO();
    if (io) io.emit("complaints_updated");
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function createNewComplaint(req, res, next) {
  try {
    const item = await createComplaint(req.body, req.user);
    const io = getIO();
    if (io) io.emit("complaints_updated");
    notifyAdmins(
      "New Complaint Filed",
      `${req.user.name || "Someone"} filed a complaint: ${item.title}`,
      "complaint",
      "/complaints"
    ).catch(() => {});
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

module.exports = { listComplaints, replyToComplaintById, resolveComplaintById, escalateComplaintById, createNewComplaint };
