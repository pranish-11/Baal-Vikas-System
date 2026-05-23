import { Router } from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { getIO } from '../socket.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.user.schoolId) {
      filter.schoolId = new mongoose.Types.ObjectId(req.user.schoolId);
    }
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('filedBy', 'name avatarInitials role')
      .populate('studentId', 'firstName lastName')
      .populate('schoolId', 'name');
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function analyzeUrgency(desc) {
  if (!desc) return 'medium';
  const text = desc.toLowerCase();
  if (text.includes('urgent') || text.includes('emergency') || text.includes('hurt') || text.includes('blood') || text.includes('safety') || text.includes('bull')) return 'high';
  if (text.includes('concern') || text.includes('worry') || text.includes('issue')) return 'medium';
  return 'low';
}

router.post('/', async (req, res) => {
  try {
    const {
      filedByType,
      subject,
      description,
      priority,
      studentId,
    } = req.body;
    
    // AI Urgency Sorting
    const computedPriority = priority || analyzeUrgency(description);
    
    const complaint = await Complaint.create({
      filedBy: req.user.id,
      filedByType: filedByType || (req.user.role === 'teacher' ? 'teacher' : 'parent'),
      subject,
      description,
      priority: computedPriority,
      status: 'open',
      studentId: studentId || undefined,
      schoolId: req.user.schoolId || undefined,
    });
    const populated = await Complaint.findById(complaint._id)
      .populate('filedBy', 'name avatarInitials role')
      .populate('studentId', 'firstName lastName')
      .populate('schoolId', 'name');
      
    getIO().emit('new_complaint', populated);
      
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/resolve', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Not found' });
    }
    if (
      req.user.schoolId &&
      complaint.schoolId?.toString() !== req.user.schoolId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    complaint.status = 'resolved';
    await complaint.save();
    const populated = await Complaint.findById(complaint._id)
      .populate('filedBy', 'name avatarInitials role')
      .populate('studentId', 'firstName lastName')
      .populate('schoolId', 'name');
      
    getIO().emit('complaint_updated', populated);
      
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'pending', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Not found' });
    }
    if (
      req.user.schoolId &&
      complaint.schoolId?.toString() !== req.user.schoolId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    complaint.status = status;
    await complaint.save();
    const populated = await Complaint.findById(complaint._id)
      .populate('filedBy', 'name avatarInitials role')
      .populate('studentId', 'firstName lastName')
      .populate('schoolId', 'name');
      
    getIO().emit('complaint_updated', populated);
      
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
