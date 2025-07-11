import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import websocketService from '../../services/websocket';
import { toast } from '../../hooks/useNotification';
import { notificationService } from '../../services/api';
import { useNotificationContext } from '../../layouts/AdminLayout';

const AdminNotificationBridge = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  // optional context
  let decreaseUnreadCount, updateUnreadCount;
  try {
    const notificationContext = useNotificationContext();
    decreaseUnreadCount = notificationContext.decreaseUnreadCount;
    updateUnreadCount = notificationContext.updateUnreadCount;
  } catch (e) {
    decreaseUnreadCount = () => {};
    updateUnreadCount = () => {};
  }
  const [orderAlerts, setOrderAlerts] = useState([]); // list ของออเดอร์ใหม่ที่ต้องโชว์ด้านขวา

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      // Connect only if not yet connected or closed
      if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
        console.log('🔗 AdminNotificationBridge attempting WebSocket connection for admin');
        websocketService.connect(token);
      } else {
        console.log('✅ AdminNotificationBridge WebSocket already connected, state:', websocketService.ws.readyState);
      }

      const handleNewOrder = (data) => {
        console.log('🔔 AdminNotificationBridge received new_order:', data);
        
        // (ตัด toast ออก เพื่อลดจำนวนแจ้งเตือนซ้ำซ้อน)

        // เพิ่มออเดอร์ใหม่เข้า list ด้านขวา
        const newAlert = {
          order_id: data.payload?.order_id || data.order_id,
          customer_name: data.payload?.customer_name || data.customer_name || 'Unknown Customer',
          exiting: false,
        };
        setOrderAlerts(prev => [...prev, newAlert]);

        // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
        console.log('🔄 Dispatching notification_update event from handleNewOrder');
        window.dispatchEvent(new Event('notification_update'));

        // auto dismiss after 5000ms (เพิ่มเวลาเป็น 5 วินาที)
        setTimeout(() => handleClose(newAlert.order_id), 5000);

        // Play alert sound if available
        try {
          const audio = new Audio('/new_order.mp3');
          audio.play().catch(() => {
            console.log('🔇 Could not play notification sound (file not found or browser policy)');
          });
        } catch (err) {
          console.error('ไม่สามารถเล่นเสียงแจ้งเตือน:', err);
        }
      };

      websocketService.on('new_order', handleNewOrder);
      console.log('✅ AdminNotificationBridge: Registered new_order listener');

      // Cleanup when deps change
      return () => {
        websocketService.off('new_order', handleNewOrder);
        console.log('🧹 AdminNotificationBridge: Cleaned up new_order listener');
      };
    }
  }, [user?.role, token]);

  // Modal alert UI
  const handleClose = (orderId) => {
    setOrderAlerts(prev => prev.map(a => a.order_id === orderId ? { ...a, exiting: true } : a));
    // remove after animation duration (500ms)
    setTimeout(() => {
      setOrderAlerts(prev => prev.filter(o => o.order_id !== orderId));
    }, 500);
  };

  const handleViewOrder = async (orderId) => {
    try {
      // หาการแจ้งเตือนที่เกี่ยวกับออเดอร์นี้
      const resp = await notificationService.getAll({ is_read: 'false', ordering: '-created_at', limit: 20 });
      const notifs = resp.data.results || resp.data;
      const target = notifs.find(n => n.related_order === orderId);
      if (target) {
        await notificationService.markAsRead(target.notification_id);
        decreaseUnreadCount();
      }
    } catch (err) {
      console.error('markAsRead via API failed:', err);
    }

    setOrderAlerts(prev => prev.filter(o => o.order_id !== orderId));
    // แจ้งให้ Dashboard รีเฟรชรายการ
    console.log('🔄 Dispatching notification_update event from handleViewOrder');
    window.dispatchEvent(new Event('notification_update'));
    navigate('/admin/orders');
  };

  // Function to test notification (development only)
  const testNotification = () => {
    const testData = {
      order_id: Date.now(),
      customer_name: 'Test Customer',
      payload: {
        order_id: Date.now(),
        customer_name: 'Test Customer'
      }
    };
    
    console.log('🧪 Testing AdminNotificationBridge with mock data:', testData);
    
    const newAlert = {
      order_id: testData.order_id,
      customer_name: testData.customer_name,
      exiting: false,
    };
    setOrderAlerts(prev => [...prev, newAlert]);
    
    // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
    console.log('🔄 Dispatching notification_update event from testNotification');
    window.dispatchEvent(new Event('notification_update'));
    
    // เพิ่ม unread count ใน sidebar (สำหรับการทดสอบ)
    if (updateUnreadCount) {
      updateUnreadCount(prev => prev + 1);
      console.log('📊 Test: Incremented unread count');
    } else {
      console.log('📊 Test: No notification context available');
    }
    
    // auto dismiss after 5000ms
    setTimeout(() => handleClose(newAlert.order_id), 5000);
  };

  // Function to reset unread count (development only)
  const resetUnreadCount = () => {
    console.log('🔄 Resetting unread count to 0');
    if (updateUnreadCount) {
      updateUnreadCount(0);
      console.log('📊 Test: Reset unread count to 0');
    } else {
      console.log('📊 Test: No notification context available');
    }
  };

  return (
    <>
      {/* Development Test Buttons removed for production */}
      
      {orderAlerts.length > 0 && (
        <div className="fixed top-24 right-4 z-50 flex flex-col gap-4 max-w-xs">
          {orderAlerts.map(alert => (
            <div key={alert.order_id} className={`bg-white shadow-lg rounded-lg p-4 transform transition-all duration-500 ${alert.exiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
              <h3 className="font-semibold mb-2">📦 ออเดอร์ใหม่!</h3>
              <p className="text-sm mb-3">#{alert.order_id} จาก {alert.customer_name}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleViewOrder(alert.order_id)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm">
                  ดูออเดอร์
                </button>
                <button
                  onClick={() => handleClose(alert.order_id)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminNotificationBridge; 