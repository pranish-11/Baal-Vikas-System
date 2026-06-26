const { getBlob, upsertBlob, deleteBlob, listBlobs } = require("../services/dataBlobService");
const { getIO } = require("../socket");
const prisma = require("../lib/prisma");
const { notifyParent, notifyParentViaNotification, buildActivityMessage } = require("../services/notificationService");

async function listAllBlobs(req, res, next) {
  try {
    const items = await listBlobs();
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function getBlobByKey(req, res, next) {
  try {
    const data = await getBlob(req.params.key);
    if (data === null) {
      res.status(404).json({ error: "Blob not found" });
      return;
    }
    res.json({ key: req.params.key, data });
  } catch (error) {
    next(error);
  }
}

async function putBlob(req, res, next) {
  try {
    const result = await upsertBlob(req.params.key, req.body);
    res.json(result);

    try {
      const io = getIO();
      if (io && req.params.key === "axion_daily_logs") {
        io.emit("daily_logs_updated");
        // Notify parents about their child's daily log updates
        notifyParentsAboutDailyLogs(req.body, req.user?.userId).catch(() => {});
      }
    } catch (e) {
      console.warn("Socket emit failed:", e.message);
    }
  } catch (error) {
    next(error);
  }
}

async function notifyParentsAboutDailyLogs(logsData, actorId) {
  if (!logsData || !actorId) return;
  const today = new Date().toISOString().slice(0, 10);
  const MOOD_MAP = { happy: '😊 Happy', okay: '😐 Okay', tired: '😴 Tired', sad: '😢 Sad', fussy: '😣 Fussy' };
  for (const [studentId, dates] of Object.entries(logsData)) {
    const dayLog = dates[today];
    if (!dayLog) continue;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { fullName: true, parentEmail: true },
    });
    if (!student || !student.parentEmail) continue;

    const lines = [];
    if (dayLog.mood && MOOD_MAP[dayLog.mood]) lines.push(`Mood: ${MOOD_MAP[dayLog.mood]}`);
    if (dayLog.overallRating > 0) lines.push(`Rating: ${dayLog.overallRating}/5 ⭐`);
    if (dayLog.ate) lines.push(`Ate${dayLog.ateRefused ? ' (refused to eat!)' : ''}${dayLog.ateDetails ? ': ' + dayLog.ateDetails : ''}${dayLog.ateTime ? ' @ ' + dayLog.ateTime : ''}`);
    if (dayLog.snack) lines.push(`Snack${dayLog.snackRefused ? ' (refused)' : ''}${dayLog.snackDetails ? ': ' + dayLog.snackDetails : ''}${dayLog.snackTime ? ' @ ' + dayLog.snackTime : ''}`);
    if (dayLog.nap) lines.push(`Slept${dayLog.napDetails ? ': ' + dayLog.napDetails : ''}${dayLog.napTime ? ' @ ' + dayLog.napTime : ''}`);
    if (dayLog.play) lines.push(`Played${dayLog.playDetails ? ': ' + dayLog.playDetails : ''}${dayLog.playTime ? ' @ ' + dayLog.playTime : ''}`);
    if (dayLog.outdoor) lines.push(`Outdoor${dayLog.outdoorDetails ? ': ' + dayLog.outdoorDetails : ''}${dayLog.outdoorTime ? ' @ ' + dayLog.outdoorTime : ''}`);
    if (dayLog.learning) lines.push(`📚 Learning: ${dayLog.learning}`);
    if (dayLog.social) lines.push(`👥 Social: ${dayLog.social}`);
    if (dayLog.health) lines.push(`❤️ Health: ${dayLog.health}`);
    if (dayLog.note) lines.push(`📝 ${dayLog.note}`);
    if (lines.length === 0) continue;

    const msg = `📋 Today's report for ${student.fullName}:\n${lines.join('\n')}`;
    await notifyParent(studentId, msg, actorId);
    const summary = lines.slice(0, 3).join('. ');
    await notifyParentViaNotification(studentId, `Daily log updated: ${student.fullName}`, summary, "daily_log", null).catch(err => console.error("[dataBlobController] notifyParentViaNotification:", err.message));
  }
}

async function removeBlob(req, res, next) {
  try {
    const result = await deleteBlob(req.params.key);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { listAllBlobs, getBlobByKey, putBlob, removeBlob };
