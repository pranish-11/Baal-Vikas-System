import { Router } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

const router = Router();

router.get('/conversations', async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.id);
    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
    })
      .sort({ timestamp: -1 })
      .populate('senderId', 'name avatarInitials role')
      .populate('receiverId', 'name avatarInitials role');

    const partnerMap = new Map();
    for (const m of messages) {
      const other =
        m.senderId._id.toString() === me.toString() ? m.receiverId : m.senderId;
      const oid = other._id.toString();
      if (!partnerMap.has(oid)) {
        partnerMap.set(oid, {
          user: other,
          lastMessage: m,
          unread: 0,
        });
      }
    }
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          receiverId: me,
          read: false,
        },
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 },
        },
      },
    ]);
    const unreadBySender = Object.fromEntries(
      unreadAgg.map((u) => [u._id.toString(), u.count])
    );
    const conversations = [];
    for (const [oid, data] of partnerMap) {
      conversations.push({
        partner: data.user,
        lastMessage: {
          text: data.lastMessage.text,
          timestamp: data.lastMessage.timestamp,
          sentByMe: data.lastMessage.senderId._id.toString() === me.toString(),
        },
        unreadCount: unreadBySender[oid] || 0,
      });
    }
    const totalUnread = await Message.countDocuments({
      receiverId: me,
      read: false,
    });
    res.json({ conversations, totalUnread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.id);
    const other = new mongoose.Types.ObjectId(req.params.userId);
    const thread = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    })
      .sort({ timestamp: 1 })
      .populate('senderId', 'name avatarInitials')
      .populate('receiverId', 'name avatarInitials');

    await Message.updateMany(
      { senderId: other, receiverId: me, read: false },
      { $set: { read: true } }
    );

    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { receiverId, text, attachment } = req.body;
    if (!receiverId || (!text && !attachment)) {
      return res.status(400).json({ message: 'receiverId and text/attachment required' });
    }
    const msg = await Message.create({
      senderId: req.user.id,
      receiverId,
      text: text || '',
      attachment,
      read: false,
    });
    const populated = await Message.findById(msg._id)
      .populate('senderId', 'name avatarInitials')
      .populate('receiverId', 'name avatarInitials');
      
    // Emit socket event to the receiver
    const io = getIO();
    io.to(`user_${receiverId}`).emit('new_message', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    msg.text = req.body.text;
    msg.edited = true;
    await msg.save();
    
    const populated = await Message.findById(msg._id)
      .populate('senderId', 'name avatarInitials')
      .populate('receiverId', 'name avatarInitials');
      
    const io = getIO();
    io.to(`user_${msg.receiverId.toString()}`).emit('message_updated', populated);
    
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId.toString() !== req.user.id && req.user.role !== 'head_admin' && req.user.role !== 'school_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const io = getIO();
    io.to(`user_${msg.receiverId.toString()}`).emit('message_deleted', { messageId: msg._id, conversationId: msg.senderId.toString() });
    
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
