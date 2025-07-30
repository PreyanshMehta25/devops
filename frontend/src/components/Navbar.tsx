import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser, SignInButton } from '@clerk/clerk-react';
import { MessageSquare, User, LogOut, PlusCircle, Menu, X, Home, Settings, BookOpen } from 'lucide-react';
import { Bell, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/notifications?clerkUserId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (e: any) {
      setNotifError(e.message || 'Error loading notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifClick = () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) fetchNotifications();
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleMarkAllRead = async () => {
  if (!user?.id) return;
  try {
    await fetch('http://localhost:5001/api/notifications/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUserId: user.id }),
    });
    // Update notifications state to mark all as read locally
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  } catch (e) {
    // Optionally show a toast or error
    alert('Failed to mark notifications as read.');
  }
};


  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent tracking-tight hover:scale-105 transition-transform"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span>StackIt</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-purple-600'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Home
            </Link>
            
            {isSignedIn && (
              <Link 
                to="/create" 
                className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-semibold transition-all duration-300 ${
                  isActive('/create') 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Ask Question
              </Link>
            )}

            {isSignedIn && (
              <Link 
                to="/user" 
                className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                  isActive('/user') 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                My Questions
              </Link>
            )}
          </div>
                  {isSignedIn && (
                  <div className="relative">
                    <button
                      onClick={handleNotifClick}
                      className="p-2 rounded-full hover:bg-purple-100 transition-colors relative"
                      title="Notifications"
                    >
                      <Bell className="w-6 h-6 text-purple-600" />
                      {notifications.some(n => !n.read) && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                    {/* Notification Drawer */}
                    {notifOpen && (
                      <div className="absolute right-0 mt-3 w-96 max-w-[95vw] bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-bold text-lg text-gray-800">Notifications</span>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 px-3 py-1 rounded transition-colors bg-purple-100 hover:bg-purple-200"
              >
                Mark all as read
              </button>
            )}
            <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifLoading ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="animate-spin w-6 h-6 text-purple-500" />
                    </div>
                  ) : notifError ? (
                    <div className="text-red-500 p-4">{notifError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="text-gray-500 p-4 text-center">No notifications yet.</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={n._id || i}
                        className={`px-4 py-3 border-b last:border-b-0 flex items-start gap-2 ${n.read ? 'bg-white' : 'bg-purple-50'}`}
                      >
                        <div>
                          <span className="font-semibold text-purple-700">{n.title || 'New Reply'}</span>
                          <div className="text-gray-700 text-sm">{n.message}</div>
                          <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}


          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                    {user?.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt={user?.firstName || 'User'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-200">
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  isActive('/') 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
                Home
              </Link>
              
              {isSignedIn && (
                <Link 
                  to="/create" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive('/create') 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}
                >
                  <PlusCircle className="w-5 h-5" />
                  Ask Question
                </Link>
              )}

              {isSignedIn && (
                <Link 
                  to="/user" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                    isActive('/user') 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  My Questions
                </Link>
              )}

              {isSignedIn ? (
                <div className="flex flex-col gap-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user?.firstName || 'User'} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200">
                  <SignInButton mode="modal">
                    <button 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      <User className="w-5 h-5" />
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;