import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading';
import { toast } from '../../hooks/useNotification';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login({
      username: formData.username,
      password: formData.password
    });

    if (result.success) {
      // ตรวจสอบว่ามี URL ที่ต้อง redirect หลังจาก login หรือไม่
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
      
      if (redirectAfterLogin) {
        // ลบ URL ที่เก็บไว้หลังจากใช้แล้ว
        localStorage.removeItem('redirectAfterLogin');
        
        // ตรวจสอบว่า user มีสิทธิ์เข้าถึง route นั้นหรือไม่
        if (isRouteAllowed(redirectAfterLogin, result.user.role)) {
          navigate(redirectAfterLogin);
        } else {
          // ถ้าไม่มีสิทธิ์ ให้ไปที่ dashboard ของ user
          const redirectPath = getDashboardRoute(result.user.role);
          navigate(redirectPath);
        }
      } else {
        // Redirect based on user role
        const redirectPath = getDashboardRoute(result.user.role);
        navigate(redirectPath);
      }
    }
  };

  // ตรวจสอบว่า user มีสิทธิ์เข้าถึง route หรือไม่
  const isRouteAllowed = (path, userRole) => {
    // Admin routes
    if (path.startsWith('/admin')) {
      return userRole === 'admin';
    }
    
    // Restaurant routes
    if (path.startsWith('/restaurant')) {
      return userRole === 'general_restaurant' || userRole === 'special_restaurant';
    }
    
    // Customer routes - ปกติ customer เข้าได้หมด
    return true;
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'special_restaurant':
      case 'general_restaurant':
        return '/restaurant';
      case 'customer':
      default:
        // ถ้าเป็น customer ให้ไปที่ homepage เสมอ ยกเว้นถ้า from เป็น public route
        if (from === '/login' || from.startsWith('/admin') || from.startsWith('/restaurant')) {
          return '/';
        }
        // ตรวจสอบว่า route ที่ customer ต้องการไปเป็น public route หรือไม่
        const customerAllowedRoutes = [
          '/', '/restaurants', '/categories', '/products', '/search', '/about', '/contact', '/help', '/terms', '/privacy',
          '/profile', '/notifications', '/cart', '/orders', '/settings'
        ];
        // ถ้า from เป็น route ที่ customer เข้าได้ ให้ไปต่อ ถ้าไม่ใช่ให้ไปหน้าแรก
        const isCustomerRoute = customerAllowedRoutes.some(route => 
          from === route || from.startsWith('/restaurants/') || from.startsWith('/categories/')
        );
        return isCustomerRoute ? from : '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <span className="text-2xl">🍕</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            Login
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700">
                Username / Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Username / Email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-secondary-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loading size="small" text="" /> : 'Login'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-secondary-50 text-secondary-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-secondary-300 rounded-lg shadow-sm bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50"
              >
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Login with Google</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 