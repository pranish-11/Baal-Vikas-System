import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: String,
  location: String,
  principalName: String,
  contactEmail: String,
  phone: String,
  address: String,
  numberOfRooms: Number,
  notes: String,
  status: { type: String, default: 'active' },
});

export default mongoose.model('School', schoolSchema);
