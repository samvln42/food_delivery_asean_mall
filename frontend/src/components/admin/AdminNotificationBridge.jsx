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
        websocketService.connect(token);
      }

      // เพิ่มการตรวจสอบ WebSocket connection ทุก 3 วินาที
      const connectionCheckInterval = setInterval(() => {
        if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
          websocketService.connect(token);
        }
      }, 3000);

      // เพิ่มการตรวจสอบ WebSocket connection ทุก 2 วินาที (สำหรับการตรวจสอบที่ถี่ขึ้น)
      const quickCheckInterval = setInterval(() => {
        if (websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN) {
          // ส่ง ping เพื่อตรวจสอบว่า connection ยังทำงานอยู่
          try {
            websocketService.send('ping', { timestamp: Date.now() });
          } catch (error) {
            websocketService.connect(token);
          }
        }
      }, 2000);

      const handleNewOrder = (data) => {
        // เพิ่มออเดอร์ใหม่เข้า list ด้านขวา
        const newAlert = {
          order_id: data.order_id,
          customer_name: data.customer_name || 'Unknown Customer',
          exiting: false,
          is_guest: false,
        };
        setOrderAlerts(prev => [...prev, newAlert]);

        // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
        window.dispatchEvent(new Event('notification_update'));

        // auto dismiss after 5000ms (เพิ่มเวลาเป็น 5 วินาที)
        setTimeout(() => handleClose(newAlert.order_id), 5000);

        // Play alert sound if available
        try {
          const audio = new Audio('/new_order.mp3');
          audio.volume = 0.5; // ลดเสียงลงครึ่งหนึ่ง
          audio.play().catch(() => {
            // Could not play notification sound
          });
        } catch (err) {
          // ไม่สามารถเล่นเสียงแจ้งเตือน
        }

        // Vibration feedback (if supported)
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      };

      const handleNewGuestOrder = (data) => {
        // เพิ่ม guest order ใหม่เข้า list ด้านขวา
        const newAlert = {
          order_id: data.order_id,
          temporary_id: data.temporary_id,
          customer_name: data.customer_name || 'Guest Customer',
          exiting: false,
          is_guest: true,
        };
        setOrderAlerts(prev => [...prev, newAlert]);

        // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
        window.dispatchEvent(new Event('notification_update'));

        // auto dismiss after 5000ms (เพิ่มเวลาเป็น 5 วินาที)
        setTimeout(() => handleClose(newAlert.order_id), 5000);

        // Play alert sound if available
        try {
          const audio = new Audio('/new_order.mp3');
          audio.volume = 0.5; // ลดเสียงลงครึ่งหนึ่ง
          audio.play().catch(() => {
            // Could not play notification sound
          });
        } catch (err) {
          // ไม่สามารถเล่นเสียงแจ้งเตือน
        }

        // Vibration feedback (if supported)
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      };

      websocketService.on('new_order', handleNewOrder);
      websocketService.on('new_guest_order', handleNewGuestOrder);

      // Cleanup when deps change
      return () => {
        clearInterval(connectionCheckInterval);
        clearInterval(quickCheckInterval);
        websocketService.off('new_order', handleNewOrder);
        websocketService.off('new_guest_order', handleNewGuestOrder);
      };
    }
  }, [user?.role, token]);

  // เพิ่ม useEffect สำหรับตรวจสอบ WebSocket connection เมื่อเปลี่ยนหน้า
  useEffect(() => {
    if (user?.role === 'admin' && token) {
      // ตรวจสอบ WebSocket connection ทุกครั้งที่ component mount (เปลี่ยนหน้า)
      const checkConnection = () => {
        if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
          websocketService.connect(token);
        }
      };

      // ตรวจสอบทันที
      checkConnection();

      // ตรวจสอบอีกครั้งหลังจาก 1 วินาที (ให้เวลา WebSocket reconnect)
      const timeoutId1 = setTimeout(checkConnection, 1000);
      
      // ตรวจสอบอีกครั้งหลังจาก 3 วินาที
      const timeoutId2 = setTimeout(checkConnection, 3000);

      // เพิ่ม event listener สำหรับ page visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          setTimeout(checkConnection, 500);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // เพิ่ม event listener สำหรับ window focus
      const handleWindowFocus = () => {
        setTimeout(checkConnection, 300);
      };

      window.addEventListener('focus', handleWindowFocus);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
      };
    }
  }, [user?.role, token]);

  // เพิ่ม global event listener สำหรับตรวจสอบ WebSocket connection
  useEffect(() => {
    if (user?.role === 'admin' && token) {
      const handleRouteChange = () => {
        setTimeout(() => {
          if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
            websocketService.connect(token);
          }
        }, 500);
      };

      // ใช้ popstate event เพื่อตรวจจับการเปลี่ยนหน้า
      window.addEventListener('popstate', handleRouteChange);
      
      // เพิ่ม event listener สำหรับ pushstate (เมื่อใช้ navigate)
      const handlePushState = () => {
        setTimeout(() => {
          if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
            websocketService.connect(token);
          }
        }, 300);
      };

      // Override pushState เพื่อตรวจจับการเปลี่ยนหน้า
      const originalPushState = history.pushState;
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        handlePushState();
      };

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
        history.pushState = originalPushState;
      };
    }
  }, [user?.role, token]);

  // Modal alert UI
  const handleClose = (orderId) => {
    setOrderAlerts(prev => prev.map(a => a.order_id === orderId ? { ...a, exiting: true } : a));
    // remove after animation duration (300ms)
    setTimeout(() => {
      setOrderAlerts(prev => prev.filter(o => o.order_id !== orderId));
    }, 300);
  };

  const handleViewOrder = async (orderId, isGuest = false, temporaryId = null) => {
    try {
      if (isGuest) {
        // สำหรับ guest orders นำทางไปยังหน้า guest orders
        navigate('/admin/guest-orders', {
          state: { highlightOrderId: orderId, temporaryId: temporaryId }
        });
      } else {
      // หาการแจ้งเตือนที่เกี่ยวกับออเดอร์นี้
      const resp = await notificationService.getAll({ is_read: 'false', ordering: '-created_at', limit: 20 });
      const notifs = resp.data.results || resp.data;
      const target = notifs.find(n => n.related_order === orderId);
      if (target) {
        await notificationService.markAsRead(target.notification_id);
        decreaseUnreadCount();
          
          // นำทางไปยังหน้าที่เหมาะสมตามประเภทการแจ้งเตือน
          if (target.type === 'order_update') {
            navigate('/admin/orders', {
              state: { highlightOrderId: orderId }
            });
          } else if (target.type === 'guest_order_update') {
            navigate('/admin/guest-orders', {
              state: { highlightOrderId: orderId }
            });
          } else {
            // ถ้าไม่ใช่ order notification ให้ไปหน้า orders ทั่วไป
            navigate('/admin/orders');
          }
        } else {
          // ถ้าไม่พบ notification ให้ไปหน้า orders ทั่วไป
          navigate('/admin/orders');
        }
      }
    } catch (err) {
      // ถ้าเกิด error ให้ไปหน้า orders ทั่วไป
      navigate('/admin/orders');
    }

    setOrderAlerts(prev => prev.filter(o => o.order_id !== orderId));
    // แจ้งให้ Dashboard รีเฟรชรายการ
    window.dispatchEvent(new Event('notification_update'));
  };

  return (
    <>
      {/* Development Test Buttons removed for production */}
      
      {orderAlerts.length > 0 && (
        <div className="fixed top-24 right-4 z-50 flex flex-col gap-4 max-w-xs">
          {orderAlerts.map(alert => (
            <div 
              key={alert.order_id} 
              className={`bg-white shadow-xl border border-gray-200 rounded-lg p-4 transform transition-all duration-300 ease-out ${
                alert.exiting 
                  ? 'translate-x-full opacity-0 scale-95' 
                  : 'translate-x-0 opacity-100 scale-100'
              }`}
              style={{
                animation: alert.exiting ? 'none' : 'slideInRight 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    {alert.is_guest ? (
                      <span className="text-red-600 text-xl">👤</span>
                    ) : (
                      <span className="text-red-600 text-xl">📦</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 text-base">
                    {alert.is_guest ? 'ออเดอร์ใหม่ (Guest)!' : 'ออเดอร์ใหม่!'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    #{alert.order_id} {alert.is_guest && alert.temporary_id && `(${alert.temporary_id})`} จาก {alert.customer_name}
                  </p>
              <div className="flex justify-end gap-2">
                <button
                      onClick={() => handleViewOrder(alert.order_id, alert.is_guest, alert.temporary_id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105">
                  ดูออเดอร์
                </button>
                <button
                  onClick={() => handleClose(alert.order_id)}
                      className="bg-gray-400 hover:bg-gray-500 text-white w-8 h-8 rounded flex items-center justify-center transition-all duration-200 hover:shadow-md hover:scale-105">
                  ✕
                </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          0% {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          60% {
            transform: translateX(-8%) scale(1.05);
            opacity: 0.9;
          }
          80% {
            transform: translateX(2%) scale(1.02);
            opacity: 0.95;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AdminNotificationBridge; 