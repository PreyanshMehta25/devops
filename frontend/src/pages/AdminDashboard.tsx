import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Plus, Edit, Trash2, Eye, Calendar, Clock } from 'lucide-react';

interface Post {
  _id: string;
  title: string;
  slug: string;
  author: string;
  createdAt: string;
  published: boolean;
  readTime: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminPosts();
  }, []);

  const fetchAdminPosts = async () => {
    try {
      const response = await fetch('https://internship-zm4p.onrender.com/api/posts/admin');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching admin posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`https://internship-zm4p.onrender.com/api/posts/${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.slug !== slug));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Admin Dashboard</h1>
            <p className="text-primary-600 mt-2">
              Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          
          <Link
            to="/create"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Total Posts</h3>
            <p className="text-3xl font-bold text-accent-600">{posts.length}</p>
          </div>
        </div>
        
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Published</h3>
            <p className="text-3xl font-bold text-success-600">
              {posts.filter(post => post.published).length}
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Drafts</h3>
            <p className="text-3xl font-bold text-warning-600">
              {posts.filter(post => !post.published).length}
            </p>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-primary-900">All Posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary-500 text-lg mb-4">No posts created yet</p>
            <Link
              to="/create"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary-200">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Read Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary-200">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-primary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-primary-900 max-w-xs truncate">
                          {post.title}
                        </div>
                        <div className="text-sm text-primary-500">/{post.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.published
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-primary-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(post.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-primary-500">
                        <Clock className="h-4 w-4 mr-2" />
                        {post.readTime} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {post.published && (
                          <Link
                            to={`/post/${post.slug}`}
                            className="text-accent-600 hover:text-accent-700 p-1 transition-colors"
                            title="View Post"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        
                        <Link
                          to={`/edit/${post.slug}`}
                          className="text-primary-600 hover:text-primary-700 p-1 transition-colors"
                          title="Edit Post"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="text-error-600 hover:text-error-700 p-1 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;