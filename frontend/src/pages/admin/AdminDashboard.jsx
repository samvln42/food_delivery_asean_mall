import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, notificationService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../layouts/AdminLayout';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  
  // Try to use notification context (may not be available in some cases)
  let decreaseUnreadCount;
  try {
    const context = useNotificationContext();
    decreaseUnreadCount = context.decreaseUnreadCount;
  } catch (error) {
    // Context not available, create dummy function
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
    if (!user?.id || !token || user.role !== 'admin') {
      console.log('⚠️ User not admin or not authenticated, stopping notification polling');
      return;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('th-TH').format(number || 0);
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
    return date.toLocaleDateString('th-TH');
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
      
      console.log(`✅ Marked notification ${notificationId} as read and removed from display`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">แดชบอร์ดแอดมิน</h1>
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/notifications"
            className="relative bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            onClick={() => {
              // Reset unread count เมื่อคลิกปุ่ม notifications
              setUnreadCount(0);
              console.log('🔗 Clicked notifications button - reset unread count');
            }}
          >
            <span>🔔</span>
            การแจ้งเตือน
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button 
            onClick={() => {
              fetchDashboardData();
              fetchNotifications();
            }}
            className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Notification Update Badge */}
      {notificationUpdateBadge && (
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
      )}

      {/* Recent Notifications Widget */}
      {notifications.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-secondary-700">การแจ้งเตือนล่าสุด</h2>
            <Link 
              to="/admin/notifications" 
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              onClick={() => {
                // Reset unread count เมื่อคลิกไปหน้า notifications
                setUnreadCount(0);
                console.log('🔗 Clicked "View All" - reset unread count');
              }}
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              {notifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.notification_id}
                  className="flex items-start space-x-3 p-3 rounded-lg transition-all hover:bg-secondary-50 cursor-pointer bg-primary-50 border-l-4 border-primary-500"
                  onClick={() => markAsRead(notification.notification_id)}
                >
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-secondary-900">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-secondary-600 truncate">
                      {notification.message}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.type)}`}>
                        {notification.type === 'new_restaurant_registration' ? 'ร้านอาหารใหม่' :
                         notification.type === 'system' ? 'ระบบ' :
                         notification.type === 'upgrade' ? 'อัปเกรด' :
                         notification.type === 'downgrade' ? 'ดาวน์เกรด' : 'อื่นๆ'}
                      </span>
                      <span className="text-xs text-secondary-500">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
            {notifications.length > 3 && (
              <div className="mt-4 text-center">
                <Link 
                  to="/admin/notifications" 
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                  onClick={() => {
                    // Reset unread count เมื่อคลิกไปหน้า notifications
                    setUnreadCount(0);
                    console.log('🔗 Clicked "View All Notifications" - reset unread count');
                  }}
                >
                  ดูการแจ้งเตือนทั้งหมด ({notifications.length} รายการ)
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-700 mb-4">สถิติวันนี้</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">คำสั่งซื้อวันนี้</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatNumber(dashboardData.today.orders)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">💰</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">รายได้วันนี้</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatCurrency(dashboardData.today.revenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-purple-500 mr-4">👤</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">ผู้ใช้ใหม่วันนี้</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatNumber(dashboardData.today.new_users)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-700 mb-4">ภาพรวมระบบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">ผู้ใช้ทั้งหมด</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatNumber(dashboardData.overview.total_users)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">🏪</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">ร้านอาหาร</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatNumber(dashboardData.overview.total_restaurants)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-yellow-500 mr-4">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">คำสั่งซื้อทั้งหมด</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatNumber(dashboardData.overview.total_orders)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-orange-500 mr-4">⚡</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">คำสั่งซื้อที่กำลังดำเนินการ</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatNumber(dashboardData.overview.active_orders)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl text-red-500 mr-4">💎</div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-700">รายได้รวม</h3>
                <p className="text-2xl font-bold text-secondary-800">{formatCurrency(dashboardData.overview.total_revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Products */}
      {dashboardData.popular_products && dashboardData.popular_products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">เมนูยอดนิยม</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">อันดับ</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">ชื่อเมนู</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">จำนวนครั้งที่สั่ง</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.popular_products.map((product, index) => (
                    <tr key={product.product__product_id} className="border-b hover:bg-secondary-50">
                      <td className="py-3 px-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-secondary-800">
                        {product.product__product_name}
                      </td>
                      <td className="py-3 px-4 text-secondary-600">
                        {formatNumber(product.order_count)} ครั้ง
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">การจัดการผู้ใช้</h2>
          <p className="text-secondary-600 mb-4">จัดการบัญชีผู้ใช้ ร้านอาหาร และสิทธิ์การเข้าถึง</p>
          <Link 
            to="/admin/users" 
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            จัดการผู้ใช้
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">การจัดการร้านอาหาร</h2>
          <p className="text-secondary-600 mb-4">อนุมัติร้านอาหารใหม่ และจัดการสถานะร้านอาหาร</p>
          <Link 
            to="/admin/restaurants" 
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            จัดการร้านอาหาร
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">จัดการคำสั่งซื้อ</h2>
          <p className="text-secondary-600 mb-4">ตรวจสอบและจัดการคำสั่งซื้อทั้งหมดในระบบ</p>
          <Link 
            to="/admin/orders" 
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            ดูคำสั่งซื้อ
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">จัดการหมวดหมู่</h2>
          <p className="text-secondary-600 mb-4">เพิ่ม แก้ไข และจัดการหมวดหมู่อาหาร</p>
          <Link 
            to="/admin/categories" 
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            จัดการหมวดหมู่
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 