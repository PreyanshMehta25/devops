import mongoose from 'mongoose';
const NotificationSchema = new mongoose.Schema({
  clerkUserId: String, // recipient
  title: String,
  message: String,
  questionId: String,
  answerId: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Notifications', NotificationSchema);
