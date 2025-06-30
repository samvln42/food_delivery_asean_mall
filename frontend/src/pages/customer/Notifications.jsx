import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Mock notifications data
  const mockNotifications = [
    {
      notification_id: 1,
      title: 'ยินดีต้อนรับสู่ FoodDelivery!',
      message: 'ขอบคุณที่สมัครสมาชิกกับเรา เริ่มสั่งอาหารอร่อยๆ ได้เลย',
      type: 'system',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      related_order: null
    },
    {
      notification_id: 2,
      title: 'โปรโมชั่นพิเศษ!',
      message: 'ลดราคา 20% สำหรับคำสั่งซื้อแรก ใช้โค้ด WELCOME20',
      type: 'promotion',
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      related_order: null
    },
    {
      notification_id: 3,
      title: 'อัพเดทระบบ',
      message: 'เราได้ปรับปรุงระบบให้ดีขึ้น ขอบคุณที่ใช้บริการ',
      type: 'system',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      related_order: null
    }
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // ลองเรียก API จริงก่อน หากไม่ได้ให้ใช้ mock data
      try {
        const response = await api.get('/notifications/');
        setNotifications(response.data.results || response.data);
      } catch (apiError) {
        console.log('Using mock notifications data');
        // ใช้ mock data หาก API ไม่พร้อม
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // ลอง API จริงก่อน
      try {
        await api.post(`/notifications/${notificationId}/mark-read/`);
      } catch (apiError) {
        console.log('API not available, updating locally');
      }

      // อัพเดท state ในกรณีใดก็ตาม
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // ลอง API จริงก่อน
      try {
        await api.post('/notifications/mark-all-read/');
      } catch (apiError) {
        console.log('API not available, updating locally');
      }

      // อัพเดท state ในกรณีใดก็ตาม
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') {
      return notifications.filter(notif => !notif.is_read);
    } else if (filter === 'read') {
      return notifications.filter(notif => notif.is_read);
    }
    return notifications;
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

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">การแจ้งเตือน</h1>
          {unreadCount > 0 && (
            <p className="text-secondary-600 mt-1">
              มีการแจ้งเตือนใหม่ {unreadCount} รายการ
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            ยังไม่อ่าน ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'read'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            อ่านแล้ว ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                !notification.is_read ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${
                        !notification.is_read ? 'text-secondary-900' : 'text-secondary-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-secondary-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-3 space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {notification.type === 'order_update' ? 'คำสั่งซื้อ' :
                           notification.type === 'payment_confirm' ? 'การชำระเงิน' :
                           notification.type === 'review_reminder' ? 'รีวิว' :
                           notification.type === 'promotion' ? 'โปรโมชั่น' :
                           notification.type === 'system' ? 'ระบบ' :
                           notification.type === 'new_restaurant_registration' ? 'ร้านอาหารใหม่' :
                           notification.type === 'upgrade' ? 'อัปเกรด' :
                           notification.type === 'downgrade' ? 'ดาวน์เกรด' : 'อื่นๆ'}
                        </span>
                        <span className="text-sm text-secondary-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.is_read && (
                        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.notification_id)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          ทำเครื่องหมายว่าอ่านแล้ว
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">🔔</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {filter === 'unread' ? 'ไม่มีการแจ้งเตือนใหม่' :
             filter === 'read' ? 'ไม่มีการแจ้งเตือนที่อ่านแล้ว' :
             'ไม่มีการแจ้งเตือน'}
          </h2>
          <p className="text-secondary-500">
            {filter === 'unread' ? 'การแจ้งเตือนใหม่จะปรากฏที่นี่' :
             filter === 'read' ? 'การแจ้งเตือนที่อ่านแล้วจะปรากฏที่นี่' :
             'การแจ้งเตือนต่างๆ จะปรากฏที่นี่เมื่อมีข้อมูลใหม่'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications; 