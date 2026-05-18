import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filedByType: { type: String, enum: ['teacher', 'parent'] },
  subject: String,
  description: String,
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  status: { type: String, enum: ['open', 'pending', 'resolved'], default: 'open' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Complaint', complaintSchema);
