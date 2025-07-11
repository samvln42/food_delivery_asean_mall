import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import { notificationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocket';
import AdminNotificationBridge from '../components/admin/AdminNotificationBridge';

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
  
  // Debug logging for unreadCount changes
  useEffect(() => {
    console.log('📊 UnreadCount state changed to:', unreadCount);
  }, [unreadCount]);

  // Fetch unread notifications count function
  const fetchUnreadCount = useCallback(async () => {
    console.log('🔍 Fetching unread count for admin...');
    try {
      const response = await notificationService.getUnreadCount();
      const count = response.data.unread_count || 0;
      setUnreadCount(count);
      console.log('📊 Unread count API response:', response.data);
      console.log('📊 Final unread count set to:', count);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      // Fallback: count manually from unread notifications
      try {
        console.log('🔄 Trying fallback method...');
        const notifResponse = await notificationService.getAll({ is_read: 'false' });
        console.log('📊 Fallback API response:', notifResponse.data);
        const unreadNotifs = (notifResponse.data.results || notifResponse.data).filter(n => !n.is_read);
        console.log('📊 Filtered unread notifications:', unreadNotifs);
        setUnreadCount(unreadNotifs.length);
        console.log('📊 Fallback unread count:', unreadNotifs.length);
      } catch (fallbackError) {
        console.error('❌ Fallback count also failed:', fallbackError);
      }
    }
  }, []);

  // Fetch unread notifications count for admin
  useEffect(() => {
    console.log('🔍 AdminLayout useEffect triggered:', { 
      userRole: user?.role, 
      hasToken: !!token,
      userName: user?.username 
    });
    if (user?.role === 'admin' && token) {
      console.log('✅ Admin user with token detected, fetching unread count...');
      // เรียกดึงข้อมูล unread count ตอนโหลดหน้า
      fetchUnreadCount();

      // ฟังก์ชันเมื่อได้รับออเดอร์ใหม่ → อัปเดตตัวเลข unread เฉย ๆ (toast & sound ทำโดย AdminNotificationBridge)
      const handleNewOrder = (data) => {
        console.log('🔔 AdminLayout: Received new_order event, incrementing unread count', data);
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('🔔 AdminLayout: Incrementing unread count from', prev, 'to', newCount);
          return newCount;
        });
      };

      // ลงทะเบียน listener สำหรับ notification_update event
      const handleNotificationUpdate = () => {
        console.log('🔄 AdminLayout: Received notification_update event, refreshing unread count');
        fetchUnreadCount();
      };

      // ลงทะเบียน listener (ไม่ต้องเชื่อมต่อ WebSocket ที่นี่ เพราะเชื่อมจาก AdminNotificationBridge แล้ว)
      websocketService.on('new_order', handleNewOrder);
      window.addEventListener('notification_update', handleNotificationUpdate);
      console.log('✅ AdminLayout: Registered event listeners for new_order and notification_update');

      // 🔄 เพิ่ม polling mechanism เป็น fallback สำหรับการอัพเดท unread count
      // ในกรณีที่ WebSocket ยังไม่ได้ deploy
      const pollingInterval = setInterval(() => {
        console.log('🔄 Polling unread count automatically...');
        fetchUnreadCount();
      }, 30000); // ทุก 30 วินาที
      console.log('⏰ AdminLayout: Set up polling interval (30 seconds)');

      // cleanup เมื่อ component unmount หรือ token เปลี่ยน
      return () => {
        websocketService.off('new_order', handleNewOrder);
        window.removeEventListener('notification_update', handleNotificationUpdate);
        clearInterval(pollingInterval);
        console.log('🧹 AdminLayout: Cleaned up all listeners and polling interval');
      };
    }
  }, [user?.role, token, fetchUnreadCount]);



  // Function to update unread count (for use by children components)
  const updateUnreadCount = (newCount) => {
    if (typeof newCount === 'function') {
      setUnreadCount(prev => {
        const result = newCount(prev);
        console.log('🔄 Updated unread count from', prev, 'to:', result);
        return result;
      });
    } else {
      setUnreadCount(newCount);
      console.log('🔄 Updated unread count to:', newCount);
    }
  };

  // Function to decrease unread count by 1
  const decreaseUnreadCount = () => {
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('➖ Decreased unread count from', prev, 'to:', newCount);
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
      <AdminNotificationBridge />
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
                  <span className={`text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                    unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
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
        
        {/* Development Test Button removed */}
      </div>
    </NotificationContext.Provider>
  );
};

export default AdminLayout; 