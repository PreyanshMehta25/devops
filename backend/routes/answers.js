import express from 'express';
import Answers from '../models/answer.js'; // Your AnswerSchema model
import Questions from '../models/schema.js';     // Your QuestionSchema model
import Notification from '../models/notification.js';
const router = express.Router();

// POST /answers
router.post('/', async (req, res) => {
  try {
    const { content, author, clerkUserId, question, parent = null } = req.body;
    const answer = new Answers({ content, author, clerkUserId, question, parent });
    await answer.save();

    // Fetch the full question document to get owner info
    const questionDoc = await Questions.findById(question);
    if (
      questionDoc &&
      questionDoc.clerkUserId &&
      questionDoc.clerkUserId !== clerkUserId // Don't notify yourself
    ) {
      await Notification.create({
        clerkUserId: questionDoc.clerkUserId,
        title: 'New reply to your question',
        message: `${author} replied to your question "${questionDoc.title}".`,
        questionId: questionDoc._id,
        answerId: answer._id,
      });
    }

    res.status(201).json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// GET /answers/question/:questionId
router.get('/question/:questionId', async (req, res) => {
  try {
    const answers = await Answers.find({ question: req.params.questionId });
    
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /answers/:id
router.get('/:id', async (req, res) => {
  try {
    const answer = await Answers.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /answers/:id
router.put('/:id', async (req, res) => {
  try {
    const answer = await Answers.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.post('/:id/reply', async (req, res) => {
  try {
    const { content, author, clerkUserId, question } = req.body;
    const parent = req.params.id;

    // Optional: Validate parent answer exists
    const parentAnswer = await Answers.findById(parent);
    if (!parentAnswer) {
      return res.status(404).json({ error: 'Parent answer not found' });
    }

    const reply = new Answers({ content, author, clerkUserId, question, parent });
    await reply.save();
    res.status(201).json(reply);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// DELETE /answers/:id
router.delete('/:id', async (req, res) => {
  try {
    const answer = await Answers.findByIdAndDelete(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /answers/:id/vote
router.post('/:id/vote', async (req, res) => {
  try {
    const { clerkUserId, vote } = req.body; // vote: 1 for upvote, -1 for downvote
    const answer = await Answers.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    const existingVote = answer.voters.find(v => v.clerkUserId === clerkUserId);
    if (existingVote) {
      // Prevent duplicate voting or update the vote
      if (existingVote.vote === vote) {
        return res.status(400).json({ error: 'Already voted' });
      }
      // Update vote
      if (existingVote.vote === 1) answer.votes.upvotes--;
      if (existingVote.vote === -1) answer.votes.downvotes--;
      existingVote.vote = vote;
    } else {
      answer.voters.push({ clerkUserId, vote });
    }
    if (vote === 1) answer.votes.upvotes++;
    if (vote === -1) answer.votes.downvotes++;

    await answer.save();
    res.json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// PATCH /answers/:id/accept
router.patch('/:id/accept', async (req, res) => {
  try {
    const answerId = req.params.id;
    const userClerkId = req.body.clerkUserId; // Or get from auth middleware/session

    // Find the answer
    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Find the related question
    const question = await Questions.findById(answer.question);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Only the question owner can accept an answer
    if (question.clerkUserId !== userClerkId) {
      return res.status(403).json({ error: 'Only the question owner can accept an answer.' });
    }

    // Optionally, unaccept any previously accepted answer for this question
    await Answers.updateMany(
      { question: question._id, accepted: true },
      { $set: { accepted: false } }
    );

    // Set this answer as accepted
    answer.accepted = true;
    await answer.save();

    res.json({ message: 'Answer marked as accepted', answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /answers/thread/:parentId
router.get('/thread/:parentId', async (req, res) => {
  try {
    const parentId = req.params.parentId;

    // Fetch all answers in the same question as the parent answer
    const parentAnswer = await Answers.findById(parentId);
    if (!parentAnswer) {
      return res.status(404).json({ error: 'Parent answer not found' });
    }

    // Get all answers for the same question
    const allAnswers = await Answers.find({ question: parentAnswer.question }).lean();

    // Build a map of answers by their _id for easy lookup
    const answerMap = {};
    allAnswers.forEach(ans => { answerMap[ans._id.toString()] = { ...ans, replies: [] }; });

    // Build the threaded tree
    allAnswers.forEach(ans => {
      if (ans.parent && answerMap[ans.parent.toString()]) {
        answerMap[ans.parent.toString()].replies.push(answerMap[ans._id.toString()]);
      }
    });

    // Recursively collect the thread starting from the parent answer
    const thread = answerMap[parentId];

    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;