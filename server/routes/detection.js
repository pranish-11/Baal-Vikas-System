import { Router } from 'express';
import mongoose from 'mongoose';
import DetectionEvent from '../models/DetectionEvent.js';
import Student from '../models/Student.js';

const router = Router();

router.get('/events', async (req, res) => {
  try {
    const schoolFilter = req.user.schoolId
      ? { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) }
      : {};
    const students = await Student.find(schoolFilter).select('_id').lean();
    const ids = students.map((s) => s._id);
    const filter = { studentId: { $in: ids } };
    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    const events = await DetectionEvent.find(filter)
      .sort({ timestamp: -1 })
      .populate('studentId', 'firstName lastName initials classroom');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const schoolFilter = req.user.schoolId
      ? { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) }
      : {};
    const totalStudents = await Student.countDocuments(schoolFilter);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const studentIds = (
      await Student.find(schoolFilter).select('_id').lean()
    ).map((s) => s._id);

    const todayEvents = await DetectionEvent.find({
      studentId: { $in: studentIds },
      timestamp: { $gte: startOfDay },
    }).lean();

    const uniqueStudents = new Set(
      todayEvents.map((e) => e.studentId.toString())
    );

    const behaviorEventsToday = todayEvents.length;
    const aiPointsAwarded = todayEvents.reduce(
      (sum, e) => sum + (e.pointsAwarded || 0),
      0
    );

    res.json({
      systemStatus: 'Online',
      studentsRecognized: uniqueStudents.size,
      totalStudents,
      behaviorEventsToday,
      aiPointsAwarded,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = await DetectionEvent.create(req.body);
    const populated = await DetectionEvent.findById(event._id).populate(
      'studentId',
      'firstName lastName initials classroom'
    );
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
