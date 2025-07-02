import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { appSettingsService } from '../../services/api';
import GoogleTranslate from './GoogleTranslate';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BellIcon,
  UserIcon,
  HeartIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appSettings, setAppSettings] = useState(null);
  const profileMenuRef = React.useRef(null);

  // Fetch app settings
  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const response = await appSettingsService.getPublic({ _t: new Date().getTime() });
        setAppSettings(response.data);
      } catch (error) {
        console.error('Error fetching app settings:', error);
      }
    };
    
    fetchAppSettings();
  }, []);

  // Close profile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Home', href: '/', current: true },
        { name: 'Restaurants', href: '/restaurants', current: false },
        { name: 'Categories', href: '/categories', current: false },
      ];
    }

    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin', current: true },
          { name: 'Users', href: '/admin/users', current: false },
          { name: 'Restaurants', href: '/admin/restaurants', current: false },
          { name: 'Orders', href: '/admin/orders', current: false },
          { name: 'Analytics', href: '/admin/analytics', current: false },
        ];

      case 'special_restaurant':
      case 'general_restaurant':
        return [
          { name: 'Dashboard', href: '/restaurant', current: true },
          { name: 'Orders', href: '/restaurant/orders', current: false },
          { name: 'Menu', href: '/restaurant/menu', current: false },
          { name: 'Reviews', href: '/restaurant/reviews', current: false },
          { name: 'Analytics', href: '/restaurant/analytics', current: false },
        ];

      case 'customer':
      default:
        return [
          { name: 'Home', href: '/', current: true },
          { name: 'Products', href: '/products', current: false },
          { name: 'Restaurants', href: '/restaurants', current: false },
          { name: 'Categories', href: '/categories', current: false },
          { name: 'Orders', href: '/orders', current: false },
        ];
    }
  };

  const getProfileMenuItems = () => {
    const baseItems = [
      { name: 'Profile', href: '/profile', icon: UserIcon },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ];

    if (user?.role === 'customer') {
      return [
        ...baseItems,
        { name: 'Favorites', href: '/favorites', icon: HeartIcon },
        { name: 'Addresses', href: '/addresses', icon: UserIcon },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  const profileMenuItems = getProfileMenuItems();

  return (
    <header className="bg-white shadow-lg border-b border-secondary-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                {/* Logo */}
                {appSettings?.logo_url ? (
                  <img
                    src={appSettings.logo_url}
                    alt={appSettings.app_name || 'FoodDelivery'}
                    className="h-10 w-auto"
                  />
                ) : (
                  <span className="text-2xl">🍕</span>
                )}
                {/* App Name */}
                <span className="text-2xl font-bold text-primary-600">
                  {appSettings?.app_name || 'FoodDelivery'}
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 transition duration-150 ease-in-out"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          {user?.role === 'customer' && (
            <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full lg:max-w-xs">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg leading-5 bg-white placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search for restaurant or food..."
                    />
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Right side buttons */}
          <div className="flex items-center space-x-2">
            {/* Google Translate */}
            <GoogleTranslate />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Customer specific icons */}
                {user?.role === 'customer' && (
                  <>
                    <Link
                      to="/cart"
                      className="p-2 text-secondary-500 hover:text-secondary-700 relative"
                    >
                      <ShoppingCartIcon className="h-6 w-6" />
                      {/* Cart badge */}
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {itemCount > 99 ? '99+' : itemCount}
                        </span>
                      )}
                    </Link>
                    
                    {/* <Link
                      to="/notifications"
                      className="p-2 text-secondary-500 hover:text-secondary-700 relative"
                    >
                      <BellIcon className="h-6 w-6" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        3
                      </span>
                    </Link> */}
                  </>
                )}

                {/* Profile Menu */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-sm text-secondary-700 hover:text-secondary-900 focus:outline-none"
                  >
                    <img
                      className="h-8 w-8 rounded-full bg-secondary-300"
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=ef4444&color=fff`}
                      alt={user?.username}
                    />
                    <span className="hidden md:block font-medium">{user?.username}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[60] ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-2 border-b border-secondary-200">
                        <p className="text-sm font-medium text-secondary-900">{user?.username}</p>
                        <p className="text-sm text-secondary-500">{user?.email}</p>
                      </div>
                      
                      {profileMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      ))}
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-secondary-700 hover:text-secondary-900 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="ml-4 sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 hover:border-secondary-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header; 