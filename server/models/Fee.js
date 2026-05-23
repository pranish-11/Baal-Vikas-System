import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  month: { type: String, required: true }, // e.g., '2026-05'
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['paid', 'unpaid', 'pending'], default: 'unpaid' },
  paidAt: { type: Date }
}, { timestamps: true });

feeSchema.index({ studentId: 1, month: 1 }, { unique: true });

export default mongoose.model('Fee', feeSchema);
