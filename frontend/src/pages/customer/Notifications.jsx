import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read



  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/notifications/');
      setNotifications(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Unable to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/mark-read/`);
      
      // อัพเดท state
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
      await api.post('/notifications/mark-all-read/');
      
      // อัพเดท state
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
    return date.toLocaleDateString('en-US');
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
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
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-secondary-600 mt-1">
              New notifications: {unreadCount}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Mark all as read
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
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'read'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Read ({notifications.length - unreadCount})
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
                          {notification.type === 'order_update' ? 'Order' :
                           notification.type === 'payment_confirm' ? 'Payment' :
                           notification.type === 'review_reminder' ? 'Review' :
                           notification.type === 'promotion' ? 'Promotion' :
                           notification.type === 'system' ? 'System' :
                           notification.type === 'new_restaurant_registration' ? 'New restaurant' :
                           notification.type === 'upgrade' ? 'Upgrade' :
                           notification.type === 'downgrade' ? 'Downgrade' : 'Other'}
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
                          Mark as read
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
            {filter === 'unread' ? 'No new notifications' :
             filter === 'read' ? 'No read notifications' :
             'No notifications'}
          </h2>
          <p className="text-secondary-500">
            {filter === 'unread' ? 'New notifications will appear here' :
             filter === 'read' ? 'Read notifications will appear here' :
             'All notifications will appear here when there is new information'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications; 