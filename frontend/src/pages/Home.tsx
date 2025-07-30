import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, ChevronDown, PlusCircle, MessageSquare, User, 
  Loader2, TrendingUp, Clock, Zap, ThumbsUp, ThumbsDown, 
  CheckCircle, AlertCircle, Eye, Calendar
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  _id: string;
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  createdAt: string;
  tags: string[];
  image?: string | null;
  votes?: { upvotes: number; downvotes: number };
  clerkUserId: string;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

const FILTERS = [
  { label: 'Latest', value: 'latest', icon: Clock },
  { label: 'Trending', value: 'trending', icon: TrendingUp },
  { label: 'Unanswered', value: 'unanswered', icon: Zap },
  { label: 'Oldest', value: 'oldest', icon: Clock },
];

const Home: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerCounts, setAnswerCounts] = useState<{[key:string]:number}>({});
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('latest');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [votingStates, setVotingStates] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  // Custom CSS variables
  const cssVars = {
    '--text': '#02110f',
    '--background': '#f9fefe',
    '--primary': '#29e2cc',
    '--secondary': '#8d7fee',
    '--accent': '#ae4ee7',
  } as React.CSSProperties;

  useEffect(() => {
    fetchQuestions(currentPage, filter);
  }, [currentPage, filter]);

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

  const getUserAvatar = (clerkUserId: string, authorName: string, size: 'sm' | 'md' = 'sm') => {
    const profile = userProfiles.get(clerkUserId);
    const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
    
    if (profile?.imageUrl) {
      return (
        <img
          src={profile.imageUrl}
          alt={authorName}
          className={`${sizeClass} rounded-full object-cover`}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold`}>
        {authorName.charAt(0).toUpperCase()}
      </div>
    );
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

  const fetchQuestions = async (page: number, sortBy: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5001/api/questions?page=${page}&limit=10&sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data.posts);
      setPagination(data.pagination);
      
      // Fetch user profiles for all question authors
      const uniqueUserIds = [...new Set(data.posts.map((q: Question) => q.clerkUserId))];
      await Promise.all(uniqueUserIds.map(userId => fetchUserProfile(userId)));
      
      // Fetch answer counts for all questions
      const counts: {[key:string]:number} = {};
      await Promise.all(data.posts.map(async (q: any) => {
        try {
          const res = await fetch(`http://localhost:5001/api/answers/question/${q._id}`);
          if (res.ok) {
            const answers = await res.json();
            counts[q._id] = answers.length;
          } else {
            counts[q._id] = 0;
          }
        } catch (err) {
          counts[q._id] = 0;
        }
      }));
      setAnswerCounts(counts);
    } catch (error) {
      setError('Failed to load questions. Please try again.');
      setQuestions([]);
      setPagination(null);
      setAnswerCounts({});
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId: string, type: 'up' | 'down') => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to vote.');
      return;
    }

    // Prevent multiple simultaneous votes
    if (votingStates[questionId]) return;

    setVotingStates(prev => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch(`http://localhost:5001/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          vote: type === 'up' ? 1 : -1,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Vote failed');
      }

      const updatedQuestion = await response.json();
      
      // Update the question in state with the response from server
      setQuestions(prev => prev.map(q => {
        if (q._id === questionId) {
          return {
            ...q,
            votes: updatedQuestion.votes || updatedQuestion.question?.votes || {
              upvotes: (q.votes?.upvotes || 0) + (type === 'up' ? 1 : 0),
              downvotes: (q.votes?.downvotes || 0) + (type === 'down' ? 1 : 0)
            }
          };
        }
        return q;
      }));
      
      showFeedback('success', `${type === 'up' ? 'Upvoted' : 'Downvoted'} successfully!`);
    } catch (error: any) {
      console.error('Vote error:', error);
      showFeedback('error', error.message || 'Failed to vote. Please try again.');
    } finally {
      setVotingStates(prev => ({ ...prev, [questionId]: false }));
    }
  };

  let filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (filter === 'unanswered') {
    filteredQuestions = filteredQuestions.filter(q => answerCounts[q._id] === 0);
  }

  return (
    <div className="min-h-screen bg-gray-50" style={cssVars}>
      <Helmet>
        <title>StackIt | Home</title>
      </Helmet>

      {/* Feedback Toast */}
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
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            StackIt
          </h1>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Ask, answer, and discover programming questions in our developer community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all font-medium"
            >
              <PlusCircle size={18} /> Ask Question
            </button>
            {!isSignedIn && (
              <button
                onClick={() => navigate('/sign-in')}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl shadow-lg hover:bg-purple-600 hover:shadow-xl transition-all font-medium"
              >
                <User size={18} /> Join Community
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search - Compact */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => {
              const IconComponent = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-all text-sm ${
                    filter === f.value 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <IconComponent size={14} />
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Questions List - Compact */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading questions...</p>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto border border-gray-100">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No questions found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Be the first to ask a question!'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/create')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-all"
                  >
                    Ask First Question
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredQuestions.map(q => (
              <motion.div 
                key={q._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 p-4 hover:bg-gray-50 transition-all group"
              >
                <div className="flex gap-4">
                  {/* Vote Stats - Compact */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleVote(q._id, 'up')}
                        disabled={votingStates[q._id] || !isSignedIn}
                        className={`p-1 hover:bg-green-100 rounded text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          votingStates[q._id] ? 'animate-pulse' : ''
                        }`}
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {(q.votes?.upvotes ?? 0) - (q.votes?.downvotes ?? 0)}
                        </div>
                        <div className="text-xs text-gray-500">votes</div>
                      </div>
                      <button
                        onClick={() => handleVote(q._id, 'down')}
                        disabled={votingStates[q._id] || !isSignedIn}
                        className={`p-1 hover:bg-red-100 rounded text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          votingStates[q._id] ? 'animate-pulse' : ''
                        }`}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Answer Count */}
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{answerCounts[q._id] ?? 0}</div>
                      <div className="text-xs text-gray-500">answers</div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1">
                    <Link 
                      to={`/post/${q.slug}`} 
                      className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors mb-2 block group-hover:text-blue-600"
                    >
                      {q.title}
                    </Link>
                    
                    {/* Tags - Compact */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {q.tags.slice(0, 3).map((tag, i) => (
                        <span 
                          key={i} 
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {q.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{q.tags.length - 3} more</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {q.excerpt}
                    </p>
                    
                    {/* Meta Info - Compact */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {getUserAvatar(q.clerkUserId, q.author, 'sm')}
                        <span className="font-medium">{q.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTimeAgo(q.createdAt)}</span>
                      </div>
                      {answerCounts[q._id] === 0 && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                          Unanswered
                        </span>
                      )}
                      {!isSignedIn && (
                        <span className="text-gray-400 text-xs">
                          (Sign in to vote)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Image - Compact */}
                  {q.image && (
                    <div className="w-16 h-16 flex-shrink-0">
                      <img 
                        src={q.image} 
                        alt={q.title} 
                        className="w-full h-full object-cover rounded border shadow-sm" 
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination - Compact */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg border font-medium transition-all text-sm ${
                      currentPage === pageNum 
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
