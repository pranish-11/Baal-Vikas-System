import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        schoolId: user.schoolId?.toString(),
        childId: user.childId?.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        avatarInitials: user.avatarInitials,
        schoolId: user.schoolId,
        childId: user.childId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, avatarInitials, schoolId, childId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      role: role || 'parent',
      avatarInitials: avatarInitials || name?.slice(0, 2).toUpperCase() || '??',
      schoolId: schoolId || undefined,
      childId: childId || undefined,
    });
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        schoolId: user.schoolId?.toString(),
        childId: user.childId?.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        avatarInitials: user.avatarInitials,
        schoolId: user.schoolId,
        childId: user.childId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        avatarInitials: user.avatarInitials,
        schoolId: user.schoolId,
        childId: user.childId,
      },
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
