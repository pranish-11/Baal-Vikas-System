import mongoose from 'mongoose';

const detectionEventSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  type: { type: String, enum: ['positive', 'warning', 'info'] },
  title: String,
  description: String,
  confidence: Number,
  pointsAwarded: Number,
  autoApproved: Boolean,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('DetectionEvent', detectionEventSchema);
