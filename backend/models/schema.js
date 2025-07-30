import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  author: {
    type: String,
    required: true
  },
  published: {
    type: Boolean,
    default: true
  },
  draft: { type: Boolean, default: false },
  tags: [{
    type: String,
    trim: true
  }],
  readTime: {
    type: Number,
    default: 1
  },clerkUserId: {
    type: String,
    required: true
  },
  image: {
    data: Buffer,
    contentType: String
  },
  votes: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
  },
  voters: [{
    clerkUserId: { type: String },
    vote: { type: Number } // 1 for upvote, -1 for downvote
  }]
}, {
  timestamps: true
});

// const BlogSchema = new mongoose.Schema({
//   clerkUserId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   posts : [PostSchema]
//   })

// Index for better query performance
QuestionSchema.index({ slug: 1 });
QuestionSchema.index({ published: 1, createdAt: -1 });

export default mongoose.model('Questions', QuestionSchema);