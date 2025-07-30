import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Plus, Edit, Trash2, Eye, Calendar, Clock, MessageSquare, TrendingUp, BookOpen, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

interface Post {
  _id: string;
  title: string;
  slug: string;
  author: string;
  createdAt: string;
  published: boolean;
  readTime: number;
  tags: string[];
  votes?: { upvotes: number; downvotes: number };
}

const UserDashboard: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserPosts(user.id);
    }
  }, [user]);

  const fetchUserPosts = async (clerkUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/questions/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your questions');
      }

      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setError('Failed to load your questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/questions/${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.slug !== slug));
        showFeedback('success', 'Question deleted successfully!');
      } else {
        throw new Error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showFeedback('error', 'Failed to delete question. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-gradient-to-r from-purple-400 to-pink-400',
      'bg-gradient-to-r from-blue-400 to-cyan-400',
      'bg-gradient-to-r from-green-400 to-emerald-400',
      'bg-gradient-to-r from-orange-400 to-red-400',
      'bg-gradient-to-r from-indigo-400 to-purple-400',
      'bg-gradient-to-r from-pink-400 to-rose-400',
    ];
    return colors[tag.length % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>My Questions | StackIt</title>
        <meta name="description" content="Manage your programming questions on StackIt" />
      </Helmet>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border-2 ${
          feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {feedback.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              <h1 className="text-4xl font-extrabold mb-2">My Questions</h1>
            </div>
            <p className="text-xl text-gray-600">
              Welcome back, <span className="font-semibold text-purple-600">{user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
            </p>
          </div>
          
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Ask New Question
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-3 rounded-2xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-800">{posts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-3 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-800">
                {posts.filter(post => post.published).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-3 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-800">
                {posts.filter(post => !post.published).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-400 to-indigo-400 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-800">
                {posts.reduce((total, post) => total + (post.votes?.upvotes || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Your Questions</h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-12 max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No questions yet</h3>
              <p className="text-gray-500 mb-6">Start sharing your knowledge and asking questions!</p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Ask Your First Question
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Vote Stats */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-xl px-3 py-2 text-center shadow-md">
                          <div className="text-lg font-bold">{post.votes?.upvotes || 0}</div>
                          <div className="text-xs font-medium">votes</div>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-purple-600 transition-colors">
                          {post.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags?.map((tag, index) => (
                            <span 
                              key={index} 
                              className={`${getTagColor(tag)} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.createdAt)}
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            {post.readTime} min read
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {post.published && (
                      <Link
                        to={`/post/${post.slug}`}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-2xl hover:shadow-lg transition-all"
                        title="View Question"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    )}
                    
                    <Link
                      to={`/edit/${post.slug}`}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-2xl hover:shadow-lg transition-all"
                      title="Edit Question"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(post.slug)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-2xl hover:shadow-lg transition-all"
                      title="Delete Question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;