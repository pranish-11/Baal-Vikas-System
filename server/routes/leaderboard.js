import { Router } from 'express';
import mongoose from 'mongoose';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import Student from '../models/Student.js';
import { getIO } from '../socket.js';

const router = Router();

function periodRange(period) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (period === 'week') {
    const d = now.getDay();
    const diff = now.getDate() - d + (d === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

router.get('/', async (req, res) => {
  try {
    const period = req.query.period || 'today';
    const { start, end } = periodRange(period);
    const schoolFilter = req.user.schoolId
      ? { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) }
      : {};

    const students = await Student.find(schoolFilter).lean();
    const studentIds = students.map((s) => s._id);

    const entries = await LeaderboardEntry.find({
      studentId: { $in: studentIds },
      date: { $gte: start, $lte: end },
    }).lean();

    const pointsByStudent = {};
    for (const e of entries) {
      const sid = e.studentId.toString();
      pointsByStudent[sid] = (pointsByStudent[sid] || 0) + (e.points || 0);
    }

    const withPoints = students.map((s) => ({
      ...s,
      periodPoints: pointsByStudent[s._id.toString()] ?? 0,
    }));

    withPoints.sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));

    res.json(withPoints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/award', async (req, res) => {
  try {
    const { studentId, points, source, reason, notifyParent } = req.body;
    if (!studentId || points == null) {
      return res.status(400).json({ message: 'studentId and points required' });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (
      req.user.schoolId &&
      student.schoolId.toString() !== req.user.schoolId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const entry = await LeaderboardEntry.create({
      studentId,
      points: Number(points),
      source: source || 'Teacher Award',
      reason: reason || '',
      notifyParent: Boolean(notifyParent),
    });
    student.points = (student.points || 0) + Number(points);
    await student.save();
    await recalcRanks(req.user.schoolId);
    
    // Emit real-time event to the specific school room and the parent room
    const io = getIO();
    io.to(`school_${student.schoolId}`).emit('points_updated', { studentId, points: Number(points) });
    if (student.parentId) {
      io.to(`user_${student.parentId}`).emit('points_notification', {
        studentId,
        studentName: student.firstName,
        points: Number(points),
        reason: reason || ''
      });
    }

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/history/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Not found' });
    if (
      req.user.schoolId &&
      student.schoolId.toString() !== req.user.schoolId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const entries = await LeaderboardEntry.find({ studentId: req.params.studentId }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function recalcRanks(schoolId) {
  const filter = schoolId
    ? { schoolId: new mongoose.Types.ObjectId(schoolId) }
    : {};
  const list = await Student.find(filter).sort({ points: -1 });
  let r = 1;
  for (const s of list) {
    s.rank = r++;
    await s.save();
  }
}

export default router;
