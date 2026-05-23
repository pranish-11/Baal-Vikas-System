import { Router } from 'express';
import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    if (['admin', 'head_admin', 'school_admin'].indexOf(req.user.role) === -1) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const filter = {};
    if (req.user.schoolId) {
      filter.schoolId = new mongoose.Types.ObjectId(req.user.schoolId);
    }
    const fees = await Fee.find(filter).populate('studentId', 'firstName lastName classroom');
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    if (['admin', 'head_admin', 'school_admin'].indexOf(req.user.role) === -1) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { month, amount } = req.body;
    if (!month || !amount) {
      return res.status(400).json({ message: 'month and amount required' });
    }
    
    const filter = {};
    if (req.user.schoolId) filter.schoolId = new mongoose.Types.ObjectId(req.user.schoolId);
    
    const students = await Student.find(filter);
    const newFees = [];
    
    for (const s of students) {
      try {
        const fee = await Fee.create({
          studentId: s._id,
          schoolId: s.schoolId,
          month,
          amount,
          status: 'unpaid'
        });
        newFees.push(fee);
      } catch (err) {
        // Ignore duplicate key errors for same month
      }
    }
    res.json({ success: true, count: newFees.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/pay', async (req, res) => {
  try {
    if (['admin', 'head_admin', 'school_admin'].indexOf(req.user.role) === -1) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Not found' });
    if (req.user.schoolId && fee.schoolId?.toString() !== req.user.schoolId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    fee.status = fee.status === 'paid' ? 'unpaid' : 'paid';
    if (fee.status === 'paid') fee.paidAt = new Date();
    else fee.paidAt = null;
    
    await fee.save();
    
    const populated = await Fee.findById(fee._id).populate('studentId', 'firstName lastName classroom');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
