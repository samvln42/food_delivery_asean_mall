import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import { notificationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Create context for notification count
const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

const AdminLayout = ({ children }) => {
  const { user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count for admin
  useEffect(() => {
    if (user?.role === 'admin' && token) {
      fetchUnreadCount();
      
      // Poll for unread count every minute
      const interval = setInterval(fetchUnreadCount, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user?.role, token]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
      console.log('📊 Unread count in sidebar:', response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Fallback: count manually from unread notifications
      try {
        const notifResponse = await notificationService.getAll({ is_read: 'false' });
        const unreadNotifs = (notifResponse.data.results || notifResponse.data).filter(n => !n.is_read);
        setUnreadCount(unreadNotifs.length);
      } catch (fallbackError) {
        console.error('Fallback count also failed:', fallbackError);
      }
    }
  };

  // Function to update unread count (for use by children components)
  const updateUnreadCount = (newCount) => {
    setUnreadCount(newCount);
    console.log('🔄 Updated unread count to:', newCount);
  };

  // Function to decrease unread count by 1
  const decreaseUnreadCount = () => {
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('➖ Decreased unread count to:', newCount);
      return newCount;
    });
  };

  // Context value
  const notificationContextValue = {
    unreadCount,
    updateUnreadCount,
    decreaseUnreadCount,
    fetchUnreadCount
  };

  return (
    <NotificationContext.Provider value={notificationContextValue}>
      <div className="min-h-screen bg-secondary-50">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <Header />
        </div>
        
        <div className="flex pt-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-20 left-4 z-30 p-2 rounded-md bg-white shadow-lg text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-10 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Fixed Sidebar */}
          <aside className={`fixed left-0 top-16 w-64 h-screen bg-white shadow-lg z-20 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <nav className="p-4">
              <div className="space-y-2">
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  📊 แดชบอร์ด
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  👥 จัดการผู้ใช้
                </Link>
                <Link
                  to="/admin/restaurants"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  🏪 จัดการร้าน
                </Link>
                <Link
                  to="/admin/orders"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  📦 คำสั่งซื้อ
                </Link>
                <Link
                  to="/admin/categories"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  📂 หมวดหมู่
                </Link>
                <Link
                  to="/admin/notifications"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-between px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  <span>🔔 การแจ้งเตือน</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/analytics"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  📈 รายงานสถิติ
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  ⚙️ ตั้งค่าระบบ
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            <div className="p-4 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

export default AdminLayout; 