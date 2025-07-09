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
  let decreaseUnreadCount;
  try {
    decreaseUnreadCount = useNotificationContext().decreaseUnreadCount;
  } catch (e) {
    decreaseUnreadCount = () => {};
  }
  const [orderAlerts, setOrderAlerts] = useState([]); // list ของออเดอร์ใหม่ที่ต้องโชว์ด้านขวา

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      // Connect only if not yet connected or closed
      if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
        websocketService.connect(token);
      }

      const handleNewOrder = (data) => {
        // (ตัด toast ออก เพื่อลดจำนวนแจ้งเตือนซ้ำซ้อน)

        // เพิ่มออเดอร์ใหม่เข้า list ด้านขวา
        const newAlert = {
          order_id: data.order_id,
          customer_name: data.customer_name,
          exiting: false,
        };
        setOrderAlerts(prev => [...prev, newAlert]);

        // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
        window.dispatchEvent(new Event('notification_update'));

        // auto dismiss after 2000ms
        setTimeout(() => handleClose(data.order_id), 2000);

        // Play alert sound if available
        try {
          const audio = new Audio('/new_order.mp3');
          audio.play().catch(() => {});
        } catch (err) {
          console.error('ไม่สามารถเล่นเสียงแจ้งเตือน:', err);
        }
      };

      websocketService.on('new_order', handleNewOrder);

      // Cleanup when deps change
      return () => {
        websocketService.off('new_order', handleNewOrder);
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
    window.dispatchEvent(new Event('notification_update'));
    navigate('/admin/orders');
  };

  return (
    <>
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