import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  clerkUserId: {
    type: String,
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questions',
    required: true
  },
  votes: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
  },
  voters: [{
    clerkUserId: { type: String },
    vote: { type: Number } // 1 for upvote, -1 for downvote
  }],
  accepted: {
    type: Boolean,
    default: false
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answers',
    default: null // For replies to answers
  }
}, {
  timestamps: true
});

export default mongoose.model('Answers', AnswerSchema);