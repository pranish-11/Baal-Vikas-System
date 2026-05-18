import { Router } from 'express';
import School from '../models/School.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const schools = await School.find().sort({ name: 1 });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const school = await School.create(req.body);
    res.status(201).json(school);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!school) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
