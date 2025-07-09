import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { appSettingsService } from '../../services/api';
import LanguageSwitcher from './LanguageSwitcher';
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
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appSettings, setAppSettings] = useState(null);
  const profileMenuRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideDropdown);
    return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
  }, []);

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
  useEffect(() => {
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
    const confirmed = window.confirm(translate('auth.confirm_logout') || 'Are you sure you want to log out?');
    if (!confirmed) return;

    await logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getMenuItems = () => {
    if (!user) {
      return [
        { name: translate('common.home'), href: '/', current: location.pathname === '/' },
        { name: translate('common.about'), href: '/about', current: location.pathname === '/about' },
        { name: translate('common.contact'), href: '/contact', current: location.pathname === '/contact' },
      ];
    }

    const baseItems = [
      { name: translate('common.home'), href: '/', current: location.pathname === '/' },
    ];

    if (user.role === 'customer') {
      return [
        ...baseItems,
        { name: translate('nav.restaurants'), href: '/restaurants', current: location.pathname === '/restaurants' },
        { name: translate('nav.categories'), href: '/categories', current: location.pathname === '/categories' },
        { name: translate('nav.all_products'), href: '/products', current: location.pathname === '/products' },
        { name: translate('nav.orders'), href: '/orders', current: location.pathname === '/orders' },
        // { name: translate('nav.favorites'), href: '/favorites', current: location.pathname === '/favorites' },
      ];
    } else if (user.role === 'admin') {
      return [
        // ...baseItems,
        { name: "Admin", href: '/admin', current: location.pathname === '/admin' },
        // { name: translate('admin.users'), href: '/admin/users', current: location.pathname === '/admin/users' },
        // { name: translate('admin.restaurants'), href: '/admin/restaurants', current: location.pathname === '/admin/restaurants' },
        // { name: translate('admin.categories'), href: '/admin/categories', current: location.pathname === '/admin/categories' },
        // { name: translate('admin.orders'), href: '/admin/orders', current: location.pathname === '/admin/orders' },
        // { name: translate('admin.settings'), href: '/admin/settings', current: location.pathname === '/admin/settings' },
      ];
    } else if (user.role === 'special_restaurant' || user.role === 'general_restaurant') {
      return [
        ...baseItems,
        { name: translate('restaurant.menu'), href: '/restaurant/products', current: location.pathname === '/restaurant/products' },
        { name: translate('restaurant.orders'), href: '/restaurant/orders', current: location.pathname === '/restaurant/orders' },
      ];
    }

    return baseItems;
  };

  const getUserMenuItems = () => {
    const items = [
      { name: translate('common.profile'), href: '/profile' },
      { name: translate('common.settings'), href: '/settings' },
    ];

    if (user?.role === 'customer') {
      items.splice(1, 0, 
        { name: translate('nav.orders'), href: '/orders' },
        // { name: translate('nav.favorites'), href: '/favorites' }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();
  const userMenuItems = getUserMenuItems();

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
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'border-primary-500 text-secondary-900'
                      : 'border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
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
                      placeholder={translate('common.search')}
                    />
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

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
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center text-sm rounded-full text-secondary-400 hover:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">{translate('common.profile')}</span>
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu">
                        <div className="px-4 py-2 text-sm text-secondary-700 border-b">
                          <div className="font-medium">{user?.username}</div>
                          <div className="text-xs text-secondary-500">{user?.email}</div>
                        </div>
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                          role="menuitem"
                        >
                          {translate('common.logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-secondary-700 hover:text-secondary-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {translate('common.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {translate('common.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="ml-4 sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="pt-4 pb-3 border-t border-secondary-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-secondary-800">{user.username}</div>
                    <div className="text-sm font-medium text-secondary-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
                  >
                    {translate('common.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-secondary-200">
                <div className="space-y-1">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {translate('common.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {translate('common.register')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header; 