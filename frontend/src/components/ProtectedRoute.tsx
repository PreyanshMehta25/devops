import React from 'react';
import { useUser, RedirectToSignIn } from '@clerk/clerk-react';
import Unauthorized from '../pages/Unauthorized';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { isSignedIn, user, isLoaded } = useUser();
  
  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  // Check role-based access if required
  if (requiredRole === 'admin' && user?.publicMetadata?.role !== 'admin') {
    return fallback || <Unauthorized />;
  }
  
  // If no specific role required or user has the required role, render children
  return <>{children}</>;
};

export default ProtectedRoute; 