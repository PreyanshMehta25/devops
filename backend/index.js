import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import quetionsRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js';
import paymentRoutes from './routes/payments.js';
import axios from 'axios';
import { ClerkExpressWithAuth, clerkClient } from '@clerk/clerk-sdk-node';
import Notification from './models/notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: 'process.env.CLIENT_ORIGIN || ' * '',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', message: 'OK' });
});

const createFallbackSummary = (content) => {
  const normalized = String(content || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return 'No summary available.';
  }

  const sentences = normalized.match(/[^.!?]+[.!?]+/g) || [normalized];
  const summary = sentences.slice(0, 3).join(' ').trim();
  return summary.length > 400 ? `${summary.slice(0, 397).trim()}...` : summary;
};

app.use('/api/questions', quetionsRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/payments', paymentRoutes);

app.post('/api/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server.' });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Summarize this text concisely, aiming for approximately one-third of the original length:\n\n${content}` }] }]
      }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary generated.';
    res.json({ summary });
  } catch (err) {
    console.error('Error in /api/summarize:', err.response?.data || err.message);
    const fallbackSummary = createFallbackSummary(req.body?.content);
    const safetyMessage = err.response?.data?.error?.message;
    if (typeof safetyMessage === 'string' && safetyMessage.toLowerCase().includes('safety')) {
      return res.json({
        summary: fallbackSummary,
        fallback: true,
        note: 'Gemini blocked the content, so a local summary was returned instead.',
      });
    }

    res.json({
      summary: fallbackSummary,
      fallback: true,
      note: 'AI summary service was unavailable, so a local summary was returned instead.',
    });
  }
});

app.get('/api/notifications', ClerkExpressWithAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;

  if (!clerkUserId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const notifications = await Notification.find({ clerkUserId }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

app.patch('/api/notifications/mark-read', ClerkExpressWithAuth(), async (req, res) => {
  const clerkUserId = req.auth.userId;
  if (!clerkUserId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    await Notification.updateMany({ clerkUserId, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

app.get('/:clerkUserId', async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const user = await clerkClient.users.getUser(clerkUserId);

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      emailAddress: user.emailAddresses[0]?.emailAddress,
    });
  } catch (error) {
    console.error(`Error fetching user ${req.params.clerkUserId}:`, error);
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'An error occurred while fetching user profile.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  connectDB();
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default app;