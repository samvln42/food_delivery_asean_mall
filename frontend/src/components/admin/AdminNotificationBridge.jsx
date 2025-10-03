import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import websocketService from "../../services/websocket";
import { toast } from "../../hooks/useNotification";
import { notificationService } from "../../services/api";
import { useNotificationContext } from "../../layouts/AdminLayout";
import { useLanguage } from "../../contexts/LanguageContext";

const AdminNotificationBridge = () => {
  const { user, token } = useAuth();
  const { translate } = useLanguage();
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
  const audioContextRef = useRef(null);

  const playBeep = async () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return; // ไม่รองรับ Web Audio
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (_) {}
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.24);
    } catch (_) {
      // เงียบถ้าบราวเซอร์บล็อค
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && token) {
      // Connect only if not yet connected or closed
      if (
        !websocketService.ws ||
        websocketService.ws.readyState === WebSocket.CLOSED
      ) {
        websocketService.connect(token);
      }

      // เพิ่มการตรวจสอบ WebSocket connection ทุก 3 วินาที
      const connectionCheckInterval = setInterval(() => {
        if (
          !websocketService.ws ||
          websocketService.ws.readyState === WebSocket.CLOSED
        ) {
          websocketService.connect(token);
        }
      }, 3000);

      // เพิ่มการตรวจสอบ WebSocket connection ทุก 2 วินาที (สำหรับการตรวจสอบที่ถี่ขึ้น)
      const quickCheckInterval = setInterval(() => {
        if (
          websocketService.ws &&
          websocketService.ws.readyState === WebSocket.OPEN
        ) {
          // ส่ง ping เพื่อตรวจสอบว่า connection ยังทำงานอยู่
          try {
            websocketService.send("ping", { timestamp: Date.now() });
          } catch (error) {
            websocketService.connect(token);
          }
        }
      }, 2000);

      const handleNewOrder = (data) => {
        console.log("🔔 AdminNotificationBridge - New order received:", data);

        // เพิ่มออเดอร์ใหม่เข้า list ด้านขวา
        const newAlert = {
          order_id: data.order_id,
          customer_name: data.customer_name || "Unknown Customer",
          exiting: false,
          is_guest: false,
        };
        setOrderAlerts((prev) => [...prev, newAlert]);

        // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
        window.dispatchEvent(new Event("notification_update"));

        // auto dismiss after 5000ms (เพิ่มเวลาเป็น 5 วินาที)
        setTimeout(() => handleClose(newAlert.order_id), 5000);

        // Play alert sound if available
        try {
          const audio = new Audio("/new_order.mp3");
          audio.volume = 0.5; // ลดเสียงลงครึ่งหนึ่ง
          audio.play().catch(() => {
            // ถ้าเล่นไฟล์ไม่ได้ ให้ fallback เป็น beep
            playBeep();
          });
        } catch (err) {
          // ไม่สามารถเล่นเสียงแจ้งเตือนไฟล์ ให้ fallback เป็น beep
          playBeep();
        }

        // Vibration feedback (if supported)
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      };

      const handleNewGuestOrder = (data) => {
        console.log(
          "🔔 AdminNotificationBridge - New guest order received:",
          data
        );

        // เพิ่ม guest order ใหม่เข้า list ด้านขวา
        const newAlert = {
          order_id: data.order_id,
          temporary_id: data.temporary_id,
          customer_name: data.customer_name || "Guest Customer",
          exiting: false,
          is_guest: true,
        };
        setOrderAlerts((prev) => [...prev, newAlert]);

        // แจ้ง component อื่น ๆ ว่ามี notification ใหม่
        window.dispatchEvent(new Event("notification_update"));

        // auto dismiss after 5000ms (เพิ่มเวลาเป็น 5 วินาที)
        setTimeout(() => handleClose(newAlert.order_id), 5000);

        // Play alert sound if available
        try {
          const audio = new Audio("/new_order.mp3");
          audio.volume = 0.5; // ลดเสียงลงครึ่งหนึ่ง
          audio.play().catch(() => {
            // ถ้าเล่นไฟล์ไม่ได้ ให้ fallback เป็น beep
            playBeep();
          });
        } catch (err) {
          // ไม่สามารถเล่นเสียงแจ้งเตือนไฟล์ ให้ fallback เป็น beep
          playBeep();
        }

        // Vibration feedback (if supported)
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      };

      websocketService.on("new_order", handleNewOrder);
      websocketService.on("new_guest_order", handleNewGuestOrder);

      // Cleanup when deps change
      return () => {
        clearInterval(connectionCheckInterval);
        clearInterval(quickCheckInterval);
        websocketService.off("new_order", handleNewOrder);
        websocketService.off("new_guest_order", handleNewGuestOrder);
      };
    }
  }, [user?.role, token]);

  // เพิ่ม useEffect สำหรับตรวจสอบ WebSocket connection เมื่อเปลี่ยนหน้า
  useEffect(() => {
    if (user?.role === "admin" && token) {
      // ตรวจสอบ WebSocket connection ทุกครั้งที่ component mount (เปลี่ยนหน้า)
      const checkConnection = () => {
        if (
          !websocketService.ws ||
          websocketService.ws.readyState === WebSocket.CLOSED
        ) {
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

      document.addEventListener("visibilitychange", handleVisibilityChange);

      // เพิ่ม event listener สำหรับ window focus
      const handleWindowFocus = () => {
        setTimeout(checkConnection, 300);
      };

      window.addEventListener("focus", handleWindowFocus);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("focus", handleWindowFocus);
      };
    }
  }, [user?.role, token]);

  // เพิ่ม global event listener สำหรับตรวจสอบ WebSocket connection
  useEffect(() => {
    if (user?.role === "admin" && token) {
      const handleRouteChange = () => {
        setTimeout(() => {
          if (
            !websocketService.ws ||
            websocketService.ws.readyState === WebSocket.CLOSED
          ) {
            websocketService.connect(token);
          }
        }, 500);
      };

      // ใช้ popstate event เพื่อตรวจจับการเปลี่ยนหน้า
      window.addEventListener("popstate", handleRouteChange);

      // เพิ่ม event listener สำหรับ pushstate (เมื่อใช้ navigate)
      const handlePushState = () => {
        setTimeout(() => {
          if (
            !websocketService.ws ||
            websocketService.ws.readyState === WebSocket.CLOSED
          ) {
            websocketService.connect(token);
          }
        }, 300);
      };

      // Override pushState เพื่อตรวจจับการเปลี่ยนหน้า
      const originalPushState = history.pushState;
      history.pushState = function (...args) {
        originalPushState.apply(history, args);
        handlePushState();
      };

      return () => {
        window.removeEventListener("popstate", handleRouteChange);
        history.pushState = originalPushState;
      };
    }
  }, [user?.role, token]);

  // Modal alert UI
  const handleClose = (orderId) => {
    setOrderAlerts((prev) =>
      prev.map((a) => (a.order_id === orderId ? { ...a, exiting: true } : a))
    );
    // remove after animation duration (300ms)
    setTimeout(() => {
      setOrderAlerts((prev) => prev.filter((o) => o.order_id !== orderId));
    }, 300);
  };

  const handleViewOrder = (
    orderId,
    isGuest = false,
    temporaryId = null
  ) => {
    // แค่นำทางไปหน้านั้นๆ โดยไม่ต้อง mark notification as read
    if (isGuest) {
      // สำหรับ guest orders นำทางไปยังหน้า guest orders
      navigate("/admin/guest-orders", {
        state: { highlightOrderId: orderId, temporaryId: temporaryId },
      });
    } else {
      // สำหรับ regular orders นำทางไปยังหน้า orders
      navigate("/admin/orders", {
        state: { highlightOrderId: orderId },
      });
    }

    // ปิด popup alert
    setOrderAlerts((prev) => prev.filter((o) => o.order_id !== orderId));
  };

  return (
    <>
      {orderAlerts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
          {orderAlerts.map((alert) => (
            <div
              key={alert.order_id}
              className={`bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 rounded-2xl p-5 transform transition-all duration-500 ease-out ${
                alert.exiting
                  ? "translate-x-full opacity-0 scale-95"
                  : "translate-x-0 opacity-100 scale-100"
              }`}
              style={{
                animation: alert.exiting
                  ? "none"
                  : "slideInRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Header with icon and close button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    {alert.is_guest ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {alert.is_guest ? translate('notification.new_guest_order') : translate('notification.new_order')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date().toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleClose(alert.order_id)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order details */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">#</span>
                    </div>
                    <div>
                      <p className="font-bold text-blue-600 text-lg">{alert.order_id}</p>
                      {alert.is_guest && alert.temporary_id && (
                        <p className="text-xs text-gray-500">({alert.temporary_id})</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{translate('notification.from')}</p>
                    <p className="font-semibold text-gray-800">{alert.customer_name}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewOrder(alert.order_id, alert.is_guest, alert.temporary_id)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {translate('notification.view_order')}
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
