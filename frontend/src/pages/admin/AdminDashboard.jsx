import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService, notificationService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../layouts/AdminLayout';
import { formatCurrency } from '../../utils/formatPrice';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  
  // Try to use notification context (may not be available in some cases)
  let decreaseUnreadCount;
  try {
    const context = useNotificationContext();
    decreaseUnreadCount = context.decreaseUnreadCount;
  } catch (error) {
    // Context not available, use fallback function
    decreaseUnreadCount = () => console.log('Notification context not available');
  }
  const [dashboardData, setDashboardData] = useState({
    today: {
      orders: 0,
      revenue: 0,
      new_users: 0,
    },
    overview: {
      total_users: 0,
      total_restaurants: 0,
      total_orders: 0,
      active_orders: 0,
      total_revenue: 0,
    },
    popular_products: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationUpdateBadge, setNotificationUpdateBadge] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  // Polling system สำหรับ real-time notifications
  useEffect(() => {
    const handleUpdate = () => fetchNotificationsQuietly();
    window.addEventListener('notification_update', handleUpdate);

    if (!user?.id || !token || user.role !== 'admin') {
      console.log('⚠️ User not admin or not authenticated, stopping notification polling');
      return () => window.removeEventListener('notification_update', handleUpdate);
    }

    console.log('🔔 Starting notification polling for admin...');
    
    // Initial fetch
    fetchNotifications();
    
    // Set up polling interval (ทุก 30 วินาที)
    const pollingInterval = setInterval(() => {
      console.log('🔔 Polling for notification updates...');
      fetchNotificationsQuietly();
    }, 30000);

    return () => {
      console.log('🛑 Stopping notification polling...');
      clearInterval(pollingInterval);
      window.removeEventListener('notification_update', handleUpdate);
    };
  }, [user?.id, token, user?.role]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getAdmin();
      setDashboardData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // ดึงเฉพาะ unread notifications เพื่อแสดงในการแจ้งเตือน
      const response = await notificationService.getAll({ 
        ordering: '-created_at',
        limit: 10,
        is_read: 'false' // กรองเฉพาะที่ยังไม่ได้อ่าน
      });
      const notificationData = response.data.results || response.data;
      
      // แสดงเฉพาะ notification ที่ยังไม่ได้อ่าน
      const unreadNotifications = notificationData.filter(notif => !notif.is_read);
      setNotifications(unreadNotifications);
      
      // ดึง unread count จาก API
      try {
        const countResponse = await notificationService.getUnreadCount();
        setUnreadCount(countResponse.data.unread_count || 0);
      } catch (countError) {
        setUnreadCount(unreadNotifications.length);
      }
      
      console.log('🔔 Fetched unread notifications:', unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch notifications without showing loading states
  const fetchNotificationsQuietly = async () => {
    try {
      // ดึงเฉพาะ unread notifications
      const response = await notificationService.getAll({ 
        ordering: '-created_at',
        limit: 10,
        is_read: 'false'
      });
      const notificationData = response.data.results || response.data;
      const unreadNotifications = notificationData.filter(notif => !notif.is_read);
      
      // Compare with current notifications to detect new ones
      setNotifications(prevNotifications => {
        const newNotifications = unreadNotifications.filter(newNotif => 
          !prevNotifications.some(prevNotif => 
            prevNotif.notification_id === newNotif.notification_id
          )
        );

        // Show notification badge for new notifications
        if (newNotifications.length > 0) {
          console.log('🔔 New unread notifications detected:', newNotifications.length);
          setNotificationUpdateBadge({
            count: newNotifications.length,
            type: newNotifications[0].type || 'system'
          });

          // Auto-hide notification badge after 10 seconds
          setTimeout(() => {
            setNotificationUpdateBadge(null);
          }, 10000);

          // Browser notification (if permission granted)
          if (window.Notification && window.Notification.permission === 'granted') {
            new window.Notification('การแจ้งเตือนใหม่!', {
              body: `มีการแจ้งเตือนใหม่ ${newNotifications.length} รายการ`,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          }
        }

        return unreadNotifications;
      });

      // อัปเดต unread count
      try {
        const countResponse = await notificationService.getUnreadCount();
        setUnreadCount(countResponse.data.unread_count || 0);
      } catch (countError) {
        setUnreadCount(unreadNotifications.length);
      }
      
    } catch (error) {
      console.error('❌ Error polling notifications:', error);
    }
  };



  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order_update': return '📦';
      case 'payment_confirm': return '💳';
      case 'review_reminder': return '⭐';
      case 'promotion': return '🎉';
      case 'system': return '🔔';
      case 'new_restaurant_registration': return '🏪';
      case 'upgrade': return '⬆️';
      case 'downgrade': return '⬇️';
      default: return '📢';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'order_update': return 'bg-blue-100 text-blue-800';
      case 'payment_confirm': return 'bg-green-100 text-green-800';
      case 'review_reminder': return 'bg-yellow-100 text-yellow-800';
      case 'promotion': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'new_restaurant_registration': return 'bg-orange-100 text-orange-800';
      case 'upgrade': return 'bg-green-100 text-green-800';
      case 'downgrade': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
    return date.toLocaleDateString('en-US');
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // ลบ notification ที่อ่านแล้วออกจากรายการ (ไม่แสดงในการแจ้งเตือน)
      setNotifications(prev => 
        prev.filter(notif => notif.notification_id !== notificationId)
      );
      
      // ลด unread count ใน dashboard
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // ลด unread count ใน sidebar ทันที
      decreaseUnreadCount();
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium text-lg">
            กำลังโหลดแดชบอร์ด...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="group bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-medium">ลองใหม่</span>
          </button>
        </div>
      </div>
    );
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.notification_id);
    if (notification.type === 'order_update') {
      // ใช้ navigate และส่งค่า order_id ไปยังหน้า AdminOrders ผ่าน location.state
      navigate('/admin/orders', {
        state: { highlightOrderId: notification.related_order || notification.order_id },
      });
    } else if (notification.type === 'guest_order_update') {
      navigate('/admin/guest-orders', {
        state: { highlightOrderId: notification.related_order || notification.order_id },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  แดชบอร์ดแอดมิน
                </h1>
                <p className="text-gray-500 text-sm font-medium">ระบบจัดการแอดมิน - ข้อมูลภาพรวม</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  fetchDashboardData();
                  fetchNotifications();
                }}
                className="group bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Notification Update Badge (ยกเว้น order_update เพราะมี modal แสดงแล้ว) */}
      {/* ลบออกเพราะมี AdminNotificationBridge แสดงแล้ว */}
      {/* {notificationUpdateBadge && notificationUpdateBadge.type !== 'order_update' && (
        <div className="fixed top-20 right-4 z-50 bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
          <span className="text-xl">{getTypeIcon(notificationUpdateBadge.type)}</span>
          <div>
            <p className="font-semibold">การแจ้งเตือนใหม่!</p>
            <p className="text-sm">มีการแจ้งเตือนใหม่ {notificationUpdateBadge.count} รายการ</p>
          </div>
          <button 
            onClick={() => setNotificationUpdateBadge(null)}
            className="text-white hover:text-gray-200 ml-2"
          >
            ✕
          </button>
        </div>
      )} */}

        {/* Enhanced Recent Notifications Widget */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 17.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">การแจ้งเตือนล่าสุด</h2>
                    <p className="text-sm text-gray-500">รายการแจ้งเตือนที่ยังไม่ได้อ่าน</p>
                  </div>
                </div>
                <Link 
                  to="/admin/notifications" 
                  className="group bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
                  onClick={() => {
                    setUnreadCount(0);
                  }}
                >
                  <span className="font-medium text-sm">ดูทั้งหมด</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div
                    key={notification.notification_id}
                    className="group relative bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)} shadow-sm`}>
                              {notification.type === 'new_restaurant_registration' ? 'ร้านอาหารใหม่' :
                               notification.type === 'system' ? 'ระบบ' :
                               notification.type === 'upgrade' ? 'อัปเกรด' :
                               notification.type === 'downgrade' ? 'ดาวน์เกรด' : 'อื่นๆ'}
                            </span>
                            <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 font-medium">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {notifications.length > 3 && (
                <div className="mt-6 text-center">
                  <Link 
                    to="/admin/notifications" 
                    className="group inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-300"
                    onClick={() => {
                      setUnreadCount(0);
                    }}
                  >
                    <span>ดูการแจ้งเตือนทั้งหมด ({notifications.length} รายการ)</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Today's Statistics */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">สถิติวันนี้</h2>
              <p className="text-sm text-gray-500">ข้อมูลประจำวันที่อัพเดทแบบเรียลไทม์</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">คำสั่งซื้อวันนี้</h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {formatNumber(dashboardData.today.orders)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">รายการ</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">รายได้วันนี้</h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatCurrency(dashboardData.today.revenue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">บาท</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">ผู้ใช้ใหม่วันนี้</h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatNumber(dashboardData.today.new_users)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">คน</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Overview Statistics */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ภาพรวมระบบ</h2>
              <p className="text-sm text-gray-500">สถิติรวมทั้งหมดในระบบ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">ผู้ใช้ทั้งหมด</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {formatNumber(dashboardData.overview.total_users)}
                </p>
              </div>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">ร้านอาหาร</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {formatNumber(dashboardData.overview.total_restaurants)}
                </p>
              </div>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">คำสั่งซื้อทั้งหมด</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {formatNumber(dashboardData.overview.total_orders)}
                </p>
              </div>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">กำลังดำเนินการ</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {formatNumber(dashboardData.overview.active_orders)}
                </p>
              </div>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">รายได้รวม</h3>
                <p className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {formatCurrency(dashboardData.overview.total_revenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Popular Products */}
        {dashboardData.popular_products && dashboardData.popular_products.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">เมนูยอดนิยม</h2>
                  <p className="text-sm text-gray-500">รายการเมนูที่ได้รับความนิยมสูงสุด</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <div className="space-y-3">
                  {dashboardData.popular_products.map((product, index) => (
                    <div key={product.product__product_id} className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-amber-600 to-yellow-700' :
                          'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-amber-600 transition-colors duration-300">
                            {product.product__product_name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">สั่งแล้ว</span>
                            <span className="font-bold text-amber-600">{formatNumber(product.order_count)}</span>
                            <span className="text-sm text-gray-500">ครั้ง</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">การจัดการด่วน</h2>
              <p className="text-sm text-gray-500">เข้าถึงฟังก์ชันการจัดการหลักได้อย่างรวดเร็ว</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">การจัดการผู้ใช้</h3>
                    <p className="text-sm text-gray-500">จัดการบัญชีและสิทธิ์</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">จัดการบัญชีผู้ใช้ ร้านอาหาร และสิทธิ์การเข้าถึงในระบบ</p>
                <Link 
                  to="/admin/users" 
                  className="group/btn inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="font-medium">จัดการผู้ใช้</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300">การจัดการร้านอาหาร</h3>
                    <p className="text-sm text-gray-500">อนุมัติและจัดการร้าน</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">อนุมัติร้านอาหารใหม่ และจัดการสถานะร้านอาหารในระบบ</p>
                <Link 
                  to="/admin/restaurants" 
                  className="group/btn inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="font-medium">จัดการร้านอาหาร</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">จัดการคำสั่งซื้อ</h3>
                    <p className="text-sm text-gray-500">ตรวจสอบและจัดการ</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">ตรวจสอบและจัดการคำสั่งซื้อทั้งหมดในระบบแบบเรียลไทม์</p>
                <Link 
                  to="/admin/orders" 
                  className="group/btn inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="font-medium">ดูคำสั่งซื้อ</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">จัดการหมวดหมู่</h3>
                    <p className="text-sm text-gray-500">จัดหมวดหมู่อาหาร</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">เพิ่ม แก้ไข และจัดการหมวดหมู่อาหารในระบบ</p>
                <Link 
                  to="/admin/categories" 
                  className="group/btn inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="font-medium">จัดการหมวดหมู่</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 