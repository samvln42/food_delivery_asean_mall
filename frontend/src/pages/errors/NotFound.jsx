import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Page not found
          </h1>
          <p className="text-secondary-600">
            Sorry, the page you are looking for does not exist
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary inline-block"
          >
            Back to home
          </Link>
          <br />
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
        
        <div className="mt-12 text-sm text-secondary-500">
          <p>If you think this is an error, please <Link to="/contact" className="text-primary-600 hover:underline">contact us</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 