import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import PostPage from './pages/PostPage';
import AdminDashboard from './pages/AdminDashboard';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import UserDashboard from './pages/UserDashBoard';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Protected create/edit routes (accessible to both admin and users) */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/edit/:slug"
            element={
              <ProtectedRoute>
                <EditPost />
              </ProtectedRoute>
            }
          />
          
          {/* Protected user routes */}
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect old admin routes to new structure */}
          <Route path="/admin/create" element={<Navigate to="/create" replace />} />
          <Route path="/admin/edit/:slug" element={<Navigate to="/edit/:slug" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;