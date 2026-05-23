import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import User from '../models/User.js';

const router = Router();

function schoolFilter(req) {
  const sid = req.user.schoolId;
  if (!sid) return {};
  return { schoolId: new mongoose.Types.ObjectId(sid) };
}

router.get('/', async (req, res) => {
  try {
    const students = await Student.find(schoolFilter(req)).sort({ rank: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const {
      firstName,
      lastName,
      age,
      classroom,
      parentName,
      parentEmail,
      enrollmentDate,
      medicalNotes,
    } = req.body;
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School context required' });
    }
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    const count = await Student.countDocuments({ schoolId });
    let parentId;
    if (parentEmail) {
      let parent = await User.findOne({ email: parentEmail.toLowerCase().trim() });
      if (!parent) {
        const hashed = await bcrypt.hash('password123', 10);
        parent = await User.create({
          name: parentName || 'Parent',
          email: parentEmail.toLowerCase().trim(),
          password: hashed,
          role: 'parent',
          avatarInitials: (parentName || 'P')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          schoolId,
        });
      }
      parentId = parent._id;
    }
    const bp = 50;
    const barColor =
      bp >= 70 ? 'var(--primary)' : bp >= 45 ? 'var(--sky)' : 'var(--coral)';
    const student = await Student.create({
      firstName,
      lastName,
      initials,
      age: Number(age),
      classroom,
      schoolId,
      parentId,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
      medicalNotes: medicalNotes || '',
      behaviorPercent: bp,
      points: 0,
      rank: count + 1,
      avatarBg: '#E8F5F1',
      avatarColor: '#2E7D6B',
      barColor,
    });
    if (parentId) {
      await User.findByIdAndUpdate(parentId, { childId: student._id });
    }
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Not found' });
    }
    if (req.user.role === 'parent' && req.user.childId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (
      req.user.role !== 'parent' &&
      req.user.schoolId &&
      student.schoolId.toString() !== req.user.schoolId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Not found' });
    }
    if (req.user.schoolId && student.schoolId.toString() !== req.user.schoolId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'parent' && req.user.childId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const allowed = [
      'firstName',
      'lastName',
      'initials',
      'age',
      'classroom',
      'enrollmentDate',
      'medicalNotes',
      'behaviorPercent',
      'points',
      'rank',
      'avatarBg',
      'avatarColor',
      'barColor',
      'parentId',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) student[key] = req.body[key];
    }
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/assign-parent', async (req, res) => {
  try {
    if (['admin', 'head_admin', 'school_admin'].indexOf(req.user.role) === -1) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Not found' });
    if (req.user.schoolId && student.schoolId.toString() !== req.user.schoolId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { parentName, parentEmail } = req.body;
    if (!parentEmail) return res.status(400).json({ message: 'Email required' });
    
    let parent = await User.findOne({ email: parentEmail.toLowerCase().trim() });
    if (!parent) {
      const hashed = await bcrypt.hash('password123', 10);
      parent = await User.create({
        name: parentName || 'Parent',
        email: parentEmail.toLowerCase().trim(),
        password: hashed,
        role: 'parent',
        avatarInitials: (parentName || 'P')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        schoolId: student.schoolId,
        childId: student._id
      });
    } else {
      parent.childId = student._id;
      await parent.save();
    }
    student.parentId = parent._id;
    await student.save();
    res.json({ student, parent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (['admin', 'head_admin', 'school_admin'].indexOf(req.user.role) === -1) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Not found' });
    if (req.user.schoolId && student.schoolId.toString() !== req.user.schoolId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
