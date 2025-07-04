import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../layouts/AdminLayout';

const AdminNotifications = () => {
  const { user } = useAuth();
  
  // Try to use notification context (may not be available in some cases)
  let decreaseUnreadCount, updateUnreadCount, fetchUnreadCount;
  try {
    const context = useNotificationContext();
    decreaseUnreadCount = context.decreaseUnreadCount;
    updateUnreadCount = context.updateUnreadCount;
    fetchUnreadCount = context.fetchUnreadCount;
  } catch (error) {
    // Context not available, use fallback functions
    decreaseUnreadCount = () => console.log('Notification context not available');
    updateUnreadCount = () => console.log('Notification context not available');
    fetchUnreadCount = () => console.log('Notification context not available');
  }
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, restaurant_new

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
    markAllAsReadOnPageEnter();
  }, []);

  const markAllAsReadOnPageEnter = async () => {
    try {
      // รอให้ notifications load ก่อน
      setTimeout(async () => {
        console.log('🔔 Marking all notifications as read (entered notifications page)');
        
        // Mark all unread notifications as read
        await api.post('/notifications/mark-all-read/');
        
        // Reset unread count ใน sidebar ทันที
        updateUnreadCount(0);
        
        // อัปเดต local state
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            is_read: true, 
            read_at: new Date().toISOString() 
          }))
        );
        
        console.log('✅ All notifications marked as read (page entry)');
      }, 500);
    } catch (error) {
      console.error('❌ Error marking notifications as read on page enter:', error);
      // ถ้า API fail อย่างน้อย reset UI
      updateUnreadCount(0);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notifications/');
      setNotifications(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/mark-read/`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      // อัปเดต unread count ใน sidebar
      decreaseUnreadCount();
      
      console.log(`✅ Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      
      // นับจำนวน unread notifications ก่อน mark all as read
      const unreadCount = notifications.filter(notif => !notif.is_read).length;
      
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      // ตั้ง unread count เป็น 0 ใน sidebar
      updateUnreadCount(0);
      
      console.log(`✅ Marked all ${unreadCount} notifications as read`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') {
      return notifications.filter(notif => !notif.is_read);
    } else if (filter === 'restaurant_new') {
      return notifications.filter(notif => notif.type === 'new_restaurant_registration');
    }
    return notifications;
  };

  const getUserDetailsFromNotification = (message) => {
    // Extract username and email from notification message
    const usernameMatch = message.match(/ผู้ใช้ "([^"]+)"/);
    const emailMatch = message.match(/\(([^)]+)\)/);
    
    return {
      username: usernameMatch ? usernameMatch[1] : '',
      email: emailMatch ? emailMatch[1] : ''
    };
  };

  const findUserByEmail = (email) => {
    return users.find(user => user.email === email);
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

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notif => !notif.is_read).length;
  const newRestaurantCount = notifications.filter(notif => notif.type === 'new_restaurant_registration' && !notif.is_read).length;

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
          <h1 className="text-3xl font-bold text-secondary-800">การแจ้งเตือนแอดมิน</h1>
          {unreadCount > 0 && (
            <p className="text-secondary-600 mt-1">
              มีการแจ้งเตือนใหม่ {unreadCount} รายการ
              {newRestaurantCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  ร้านใหม่ {newRestaurantCount} รายการ
                </span>
              )}
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
            onClick={() => setFilter('restaurant_new')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'restaurant_new'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            🏪 ร้านอาหารใหม่ ({notifications.filter(n => n.type === 'new_restaurant_registration').length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const userDetails = getUserDetailsFromNotification(notification.message);
            const user = findUserByEmail(userDetails.email);
            
            return (
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

                        {/* Special actions for restaurant registration notifications */}
                        {notification.type === 'new_restaurant_registration' && user && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-secondary-800 mb-2">ข้อมูลผู้สมัคร:</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">ชื่อผู้ใช้:</span> {user.username}
                              </div>
                              <div>
                                <span className="font-medium">อีเมล:</span> {user.email}
                              </div>
                              <div>
                                <span className="font-medium">เบอร์โทร:</span> {user.phone_number || 'ไม่ระบุ'}
                              </div>
                              <div>
                                <span className="font-medium">ที่อยู่:</span> {user.address || 'ไม่ระบุ'}
                              </div>
                              <div>
                                <span className="font-medium">สถานะ:</span> 
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.is_active ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">บทบาท:</span> 
                                <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {user.role === 'general_restaurant' ? 'ร้านทั่วไป' : user.role}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-3 mt-4">
                              <Link
                                to={`/admin/users`}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                จัดการผู้ใช้
                              </Link>
                              <Link
                                to={`/admin/restaurants`}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                              >
                                สร้างร้านอาหาร
                              </Link>
                              {user.role === 'general_restaurant' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.post(`/users/${user.id}/upgrade-to-special/`);
                                      alert('อัปเกรดเป็นร้านพิเศษสำเร็จ');
                                      fetchUsers();
                                    } catch (error) {
                                      alert('เกิดข้อผิดพลาด: ' + error.response?.data?.error || error.message);
                                    }
                                  }}
                                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                >
                                  อัปเกรดเป็นร้านพิเศษ
                                </button>
                              )}
                            </div>
                          </div>
                        )}
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
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">🔔</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {filter === 'unread' ? 'ไม่มีการแจ้งเตือนใหม่' :
             filter === 'restaurant_new' ? 'ไม่มีร้านอาหารใหม่' :
             'ไม่มีการแจ้งเตือน'}
          </h2>
          <p className="text-secondary-500">
            {filter === 'unread' ? 'การแจ้งเตือนใหม่จะปรากฏที่นี่' :
             filter === 'restaurant_new' ? 'การแจ้งเตือนร้านอาหารใหม่จะปรากฏที่นี่' :
             'การแจ้งเตือนต่างๆ จะปรากฏที่นี่เมื่อมีข้อมูลใหม่'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications; 