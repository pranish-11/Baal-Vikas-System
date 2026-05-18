import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export default mongoose.model('Message', messageSchema);
