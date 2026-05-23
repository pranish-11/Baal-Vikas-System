import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['head_admin', 'admin', 'school_admin', 'teacher', 'parent'] },
  avatarInitials: String,
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
});

export default mongoose.model('User', userSchema);
