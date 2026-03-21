import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();


  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but accessing auth pages (login/register)
  if (!requireAuth && isAuthenticated) {
    const from = location.state?.from?.pathname || getDashboardRoute(user?.role);
    return <Navigate to={from} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    // If user is authenticated but doesn't have permission, redirect to their dashboard
    if (user && user.role) {
      const dashboardRoute = getDashboardRoute(user.role);
      // Only redirect to unauthorized if trying to access a route that doesn't match their role
      // For example: restaurant user trying to access /admin should go to /restaurant, not /unauthorized
      return <Navigate to={dashboardRoute} replace />;
    }
    // If no user, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Helper function to get dashboard route based on user role
const getDashboardRoute = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'special_restaurant':
    case 'general_restaurant':
      return '/restaurant';
    case 'customer':
    default:
      return '/';
  }
};

export default ProtectedRoute; 