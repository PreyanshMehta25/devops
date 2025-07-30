import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Shield, Home, User, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="space-y-4">
          {user?.publicMetadata?.role === 'admin' ? (
            <p className="text-sm text-gray-500">
              You are logged in as an admin user.
            </p>
          ) : user ? (
            <p className="text-sm text-gray-500">
              You are logged in as a regular user.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Please sign in to access protected content.
            </p>
          )}

          <div className="flex flex-col space-y-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Link>

            {user && (
              <Link
                to={user?.publicMetadata?.role === 'admin' ? '/admin' : '/user'}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            )}

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 