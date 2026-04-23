import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  initials: String,
  age: Number,
  classroom: String,
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrollmentDate: Date,
  medicalNotes: String,
  behaviorPercent: Number,
  points: Number,
  rank: Number,
  avatarBg: String,
  avatarColor: String,
  barColor: String,
});

export default mongoose.model('Student', studentSchema);
