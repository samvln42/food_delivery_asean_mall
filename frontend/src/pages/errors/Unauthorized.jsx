import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Unauthorized = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-red-500 mb-4">403</div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Unauthorized
          </h1>
          <p className="text-secondary-600">
            Sorry, you are not authorized to access this page
          </p>
          {user && (
            <p className="text-sm text-secondary-500 mt-2">
              You are logged in as: <span className="font-medium">{user.role}</span>
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary inline-block"
          >
            Back to home
          </Link>
          <br />
          {user ? (
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="btn-secondary inline-block"
            >
              Login
            </Link>
          )}
        </div>
        
        <div className="mt-12 text-sm text-secondary-500">
          <p>If you think this is an error, please <Link to="/contact" className="text-primary-600 hover:underline">contact us</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 