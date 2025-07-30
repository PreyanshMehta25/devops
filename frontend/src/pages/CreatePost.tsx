import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ArrowLeft, Save, Eye, Upload, X, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet';

const CreatePost: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const clerkUserId = user?.id;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: true,
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showFeedback('error', 'Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to create a question');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      showFeedback('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    const form = new FormData();
    form.append('title', formData.title.trim());
    form.append('content', formData.content);
    form.append('author', user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User');
    form.append('published', String(formData.published));
    form.append('tags', JSON.stringify(formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
    form.append('clerkUserId', clerkUserId || '');

    if (imageFile) {
      form.append('image', imageFile);
    }

    try {
      const response = await fetch('http://localhost:5001/api/questions', {
        method: 'POST',
        body: form
      });

      if (response.ok) {
        const data = await response.json();
        showFeedback('success', 'Question created successfully!');
        setTimeout(() => {
          navigate(`/post/${data.slug}`);
        }, 1500);
      } else {
        const error = await response.json();
        showFeedback('error', error.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      showFeedback('error', 'Failed to create question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background',
    'link', 'image', 'blockquote', 'code-block', 'align'
  ];

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

  const previewTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

  return (
    <>
      <Helmet>
        <title>Ask New Question | StackIt</title>
        <meta name="description" content="Ask a new programming question on StackIt. Share your knowledge and get help from the community." />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8">
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Questions
          </Link>
          
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              <h1 className="text-5xl font-extrabold mb-4">Ask a Question</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Share your programming challenges and get help from our amazing community of developers.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Title */}
            <div className="mb-8">
              <label htmlFor="title" className="block text-lg font-semibold text-gray-800 mb-3">
                Question Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all text-lg"
                placeholder="What's your programming question?"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Be specific and descriptive to get better answers
              </p>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <label htmlFor="tags" className="block text-lg font-semibold text-gray-800 mb-3">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all text-lg"
                placeholder="react, javascript, web-development (comma-separated)"
              />
              {previewTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {previewTags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`${getTagColor(tag)} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Add relevant tags to help others find your question
              </p>
            </div>

            {/* Content */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Question Details *
              </label>
              <div className="bg-white rounded-2xl border-2 border-gray-200 focus-within:ring-4 focus-within:ring-purple-200 focus-within:border-purple-400 transition-all">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Describe your problem in detail. Include code examples, error messages, and what you've tried so far..."
                  style={{ minHeight: '400px' }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Use the rich text editor to format your question with code blocks, lists, and more
              </p>
            </div>

            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Add Image (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors">
                {!imagePreview ? (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Choose Image
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-w-full max-h-64 rounded-2xl shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Published Toggle */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="published" className="text-lg font-semibold text-gray-800">
                  Publish immediately
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2 ml-8">
                Uncheck to save as draft and publish later
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <Link
                to="/"
                className="px-6 py-3 text-gray-600 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold"
              >
                Cancel
              </Link>
              
              <div className="flex gap-4">
                
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {loading ? 'Creating...' : 'Ask Question'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreatePost;

