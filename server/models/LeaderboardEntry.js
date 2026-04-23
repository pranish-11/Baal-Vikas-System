import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  points: Number,
  source: {
    type: String,
    enum: ['Teacher Award', 'AI Detection', 'Peer Nomination', 'Parent Report'],
  },
  reason: String,
  notifyParent: Boolean,
  date: { type: Date, default: Date.now },
});

export default mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
