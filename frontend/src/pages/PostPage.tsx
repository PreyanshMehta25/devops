import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, User, ArrowLeft, ChevronRight, ThumbsUp, ThumbsDown,
  Loader2, MessageSquare, Send, Edit, Trash2, CheckCircle,
  Reply, X, Save, AlertCircle, Heart, Star, Sparkles,
  ChevronDown, ChevronUp, Bot, Eye, EyeOff, MoreHorizontal,
  Bold, Italic, Underline, List, ListOrdered, Quote, Code
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Question {
  _id: string;
  title: string;
  content: string;
  slug: string;
  author: string;
  createdAt: string;
  tags: string[];
  image?: string;
  votes?: { upvotes: number; downvotes: number };
  clerkUserId: string;
}

interface Answer {
  _id: string;
  content: string;
  author: string;
  createdAt: string;
  votes?: { upvotes: number; downvotes: number };
  accepted?: boolean;
  clerkUserId: string;
  parent?: string;
  replies?: Answer[];
}

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());
  
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  // Custom CSS variables
  const cssVars = {
    '--text': '#02110f',
    '--background': '#f9fefe',
    '--primary': '#29e2cc',
    '--secondary': '#8d7fee',
    '--accent': '#ae4ee7',
  } as React.CSSProperties;

  // Rich text editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  useEffect(() => {
    if (slug) fetchQuestion(slug);
  }, [slug]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchUserProfile = async (clerkUserId: string) => {
    if (userProfiles.has(clerkUserId)) return userProfiles.get(clerkUserId);
    
    try {
      const res = await fetch(`http://localhost:5001/api/users/${clerkUserId}`);
      if (res.ok) {
        const profile = await res.json();
        setUserProfiles(prev => new Map(prev).set(clerkUserId, profile));
        return profile;
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
    return null;
  };

  const getUserAvatar = (clerkUserId: string, authorName: string) => {
    const profile = userProfiles.get(clerkUserId);
    if (profile?.imageUrl) {
      return (
        <img
          src={profile.imageUrl}
          alt={authorName}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
        {authorName.charAt(0).toUpperCase()}
      </div>
    );
  };

  const fetchQuestion = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/questions/${slug}`);
      if (!res.ok) throw new Error('Question not found');
      const data = await res.json();
      setQuestion(data);
      
      await fetchUserProfile(data.clerkUserId);
      fetchAnswers(data._id);
    } catch (e) {
      setError('Question not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    setAnswerLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/answers/question/${questionId}`);
      if (!res.ok) throw new Error('Failed to fetch answers');
      const data = await res.json();
      
      const uniqueUserIds = [...new Set(data.map((answer: Answer) => answer.clerkUserId))];
      await Promise.all(uniqueUserIds.map(userId => fetchUserProfile(userId)));
      
      const threaded = buildThreadedAnswers(data);
      setAnswers(threaded);
    } catch (e) {
      setAnswers([]);
    } finally {
      setAnswerLoading(false);
    }
  };

  const buildThreadedAnswers = (answers: Answer[]): Answer[] => {
    const answerMap = new Map<string, Answer>();
    const rootAnswers: Answer[] = [];

    answers.forEach(answer => {
      answerMap.set(answer._id, { ...answer, replies: [] });
    });

    answers.forEach(answer => {
      const answerWithReplies = answerMap.get(answer._id)!;
      if (answer.parent) {
        const parent = answerMap.get(answer.parent);
        if (parent) {
          parent.replies!.push(answerWithReplies);
        }
      } else {
        rootAnswers.push(answerWithReplies);
      }
    });

    return rootAnswers;
  };

  const generateAISummary = async () => {
    if (!question) return;
    
    setSummaryLoading(true);
    try {
      const content = `${question.content} ${answers.map(a => a.content).join(' ')}`;
      
      const response = await fetch('http://localhost:5001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary);
      setShowSummary(true);
    } catch (e) {
      showFeedback('error', 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleThread = (answerId: string) => {
    const newCollapsed = new Set(collapsedThreads);
    if (newCollapsed.has(answerId)) {
      newCollapsed.delete(answerId);
    } else {
      newCollapsed.add(answerId);
    }
    setCollapsedThreads(newCollapsed);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to vote.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/questions/${question?._id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          vote: type === 'up' ? 1 : -1,
        }),
      });
      if (!res.ok) throw new Error('Vote failed');
      fetchQuestion(slug!);
      showFeedback('success', 'Vote submitted!');
    } catch (e) {
      showFeedback('error', 'Failed to vote.');
    }
  };

  const handleAnswerVote = async (answerId: string, type: 'up' | 'down') => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to vote.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          vote: type === 'up' ? 1 : -1,
        }),
      });
      if (!res.ok) throw new Error('Vote failed');
      fetchAnswers(question!._id);
      showFeedback('success', 'Vote submitted!');
    } catch (e) {
      showFeedback('error', 'Failed to vote.');
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to accept answers.');
      return;
    }

    if (user.id !== question?.clerkUserId) {
      showFeedback('error', 'Only the question owner can accept an answer.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      if (!res.ok) throw new Error('Accept failed');
      fetchAnswers(question!._id);
      showFeedback('success', 'Answer accepted!');
    } catch (e) {
      showFeedback('error', 'Failed to accept answer.');
    }
  };

  const handleReplyAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to reply.');
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          author: user.firstName || user.emailAddresses[0]?.emailAddress || 'User',
          clerkUserId: user.id,
          question: question!._id,
        }),
      });
      if (!res.ok) throw new Error('Reply failed');
      setReplyingTo(null);
      setReplyContent('');
      fetchAnswers(question!._id);
      showFeedback('success', 'Reply submitted!');
    } catch (e) {
      showFeedback('error', 'Failed to reply.');
    }
  };

  const handleEditAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to edit.');
      return;
    }

    if (!editContent.trim()) return;

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('Edit failed');
      setEditingAnswer(null);
      setEditContent('');
      fetchAnswers(question!._id);
      showFeedback('success', 'Answer updated!');
    } catch (e) {
      showFeedback('error', 'Failed to edit answer.');
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to delete.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this answer?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchAnswers(question!._id);
      showFeedback('success', 'Answer deleted!');
    } catch (e) {
      showFeedback('error', 'Failed to delete answer.');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to answer.');
      return;
    }

    if (!answerContent.trim() || !question) return;

    setAnswerLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: answerContent,
          author: user.firstName || user.emailAddresses[0]?.emailAddress || 'User',
          question: question._id,
          clerkUserId: user.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      setAnswerContent('');
      fetchAnswers(question._id);
      showFeedback('success', 'Answer submitted successfully!');
    } catch (e) {
      showFeedback('error', 'Failed to submit answer.');
    } finally {
      setAnswerLoading(false);
    }
  };

  const renderAnswer = (answer: Answer, depth: number = 0) => {
    const isCollapsed = collapsedThreads.has(answer._id);
    const hasReplies = answer.replies && answer.replies.length > 0;

    return (
      <motion.div
        key={answer._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}
        style={cssVars}
      >
        <div className="bg-white border border-gray-100 p-4 mb-2 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getUserAvatar(answer.clerkUserId, answer.author)}
              <div>
                <div className="font-medium text-sm text-gray-900">{answer.author}</div>
                <div className="text-xs text-gray-500">{formatTimeAgo(answer.createdAt)}</div>
              </div>
              {answer.accepted && (
                <CheckCircle className="text-green-500" size={16} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAnswerVote(answer._id, 'up')}
                  className="p-1 hover:bg-green-100 rounded text-green-600"
                >
                  <ThumbsUp size={14} />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {(answer.votes?.upvotes ?? 0) - (answer.votes?.downvotes ?? 0)}
                </span>
                <button
                  onClick={() => handleAnswerVote(answer._id, 'down')}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <ThumbsDown size={14} />
                </button>
              </div>

              {hasReplies && (
                <button
                  onClick={() => toggleThread(answer._id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  {answer.replies!.length}
                </button>
              )}

              <div className="relative">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-2">
            {editingAnswer === answer._id ? (
              <div className="space-y-2">
                <ReactQuill
                  value={editContent}
                  onChange={setEditContent}
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditAnswer(answer._id)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingAnswer(null);
                      setEditContent('');
                    }}
                    className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-800">
                <div dangerouslySetInnerHTML={{ __html: answer.content }} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isSignedIn && (
              <button
                onClick={() => setReplyingTo(replyingTo === answer._id ? null : answer._id)}
                className="text-gray-500 hover:text-blue-600 font-medium"
              >
                Reply
              </button>
            )}

            {isSignedIn && user?.id === question?.clerkUserId && !answer.accepted && (
              <button
                onClick={() => handleAcceptAnswer(answer._id)}
                className="text-gray-500 hover:text-green-600 font-medium"
              >
                Accept
              </button>
            )}

            {isSignedIn && user?.id === answer.clerkUserId && (
              <>
                <button
                  onClick={() => {
                    setEditingAnswer(answer._id);
                    setEditContent(answer.content);
                  }}
                  className="text-gray-500 hover:text-yellow-600 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAnswer(answer._id)}
                  className="text-gray-500 hover:text-red-600 font-medium"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {replyingTo === answer._id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-gray-50 rounded"
            >
              <ReactQuill
                value={replyContent}
                onChange={setReplyContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your reply..."
                className="bg-white mb-2"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleReplyAnswer(answer._id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {hasReplies && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              {answer.replies!.map(reply => renderAnswer(reply, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={cssVars}>
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={48} />
        <p className="text-xl font-semibold text-gray-700">Loading question...</p>
      </div>
    </div>
  );

  if (error || !question) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={cssVars}>
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Question not found'}</h2>
        <Link
          to="/"
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" style={cssVars}>
      <Helmet>
        <title>{question.title} | StackIt</title>
      </Helmet>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
              feedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-4 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back to Questions
          </Link>

          {/* Question Card */}
          <div className="bg-white border border-gray-100 p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <button
                  onClick={() => handleVote('up')}
                  className="p-2 hover:bg-green-100 rounded transition-colors text-green-600"
                >
                  <ThumbsUp size={18} />
                </button>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">
                    {(question.votes?.upvotes ?? 0) - (question.votes?.downvotes ?? 0)}
                  </div>
                </div>
                <button
                  onClick={() => handleVote('down')}
                  className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
                >
                  <ThumbsDown size={18} />
                </button>
              </div>

              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-2">{question.title}</h1>
                
                <div className="flex items-center gap-3 mb-3">
                  {getUserAvatar(question.clerkUserId, question.author)}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{question.author}</div>
                    <div className="text-xs text-gray-500">{formatTimeAgo(question.createdAt)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {question.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
  className="prose prose-sm max-w-none mb-3 text-gray-800"
  dangerouslySetInnerHTML={{ __html: question.content }}
/>


                {question.image && (
                  <img
                    src={question.image}
                    alt="Question"
                    className="max-w-sm rounded border shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="mb-6">
          <div className="bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bot className="text-purple-600" size={20} />
                AI Summary
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600"
                >
                  {showSummary ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={generateAISummary}
                  disabled={summaryLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded text-sm font-medium hover:shadow-lg transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {summaryLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  {summaryLoading ? 'Summarizing...' : 'Summarize'}
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {showSummary && aiSummary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded border border-purple-200"
                >
                  <p className="text-gray-700 text-sm leading-relaxed">{aiSummary}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Answer Form - Moved Before Answers */}
        {isSignedIn && (
          <div id="answer-form" className="bg-white border border-gray-100 p-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Answer</h3>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div className="border border-gray-200 rounded">
                <ReactQuill
                  value={answerContent}
                  onChange={setAnswerContent}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Share your knowledge with rich formatting..."
                  className="bg-white"
                  style={{ minHeight: '200px' }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={answerLoading}
                  className="bg-blue-500 text-white px-6 py-2 rounded font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {answerLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {answerLoading ? 'Posting...' : 'Post Answer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sign In Prompt - Moved Before Answers */}
        {!isSignedIn && (
          <div className="text-center py-8 bg-white border border-gray-100 p-6 mb-6">
            <User className="mx-auto mb-4 text-gray-400" size={32} />
            <h3 className="font-semibold text-gray-700 mb-2">Want to answer?</h3>
            <p className="text-gray-500 text-sm mb-4">Join our community to share your knowledge.</p>
            <button
              onClick={() => navigate('/sign-in')}
              className="bg-blue-500 text-white px-4 py-2 rounded font-medium hover:bg-blue-600 transition-colors"
            >
              Sign In to Answer
            </button>
          </div>
        )}

        {/* Answers Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {answers.length} Answer{answers.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {answerLoading ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-700">Loading answers...</p>
            </div>
          ) : answers.length === 0 ? (
            <div className="text-center py-8 bg-white border border-gray-100 p-6">
              <MessageSquare className="mx-auto mb-4 text-gray-400" size={32} />
              <h3 className="font-semibold text-gray-700 mb-2">No answers yet</h3>
              <p className="text-gray-500 text-sm">Be the first to answer this question!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {answers.map(answer => renderAnswer(answer))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default PostPage;
