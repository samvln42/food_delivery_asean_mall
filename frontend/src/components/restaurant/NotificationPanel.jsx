import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';

const NotificationPanel = ({ notifications, onClose, onRemove, isVisible = true }) => {
  const [isClosing, setIsClosing] = useState(false);
  // เริ่มต้นเป็น false เพื่อป้องกัน panel แสดงเมื่อ refresh (ถ้ามี notifications อยู่แล้ว)
  const [shouldRender, setShouldRender] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const autoCloseTimerRef = useRef(null);
  const closingTimerRef = useRef(null);
  const isClosingRef = useRef(false); // ใช้ ref เพื่อป้องกัน race condition
  const hasMountedRef = useRef(false);
  const prevNotificationsLengthRef = useRef(0);

  // Reset state เมื่อ component mount ครั้งแรกเท่านั้น
  useEffect(() => {
    if (hasMountedRef.current) return; // ป้องกันการทำงานซ้ำ
    
    hasMountedRef.current = true;
    prevNotificationsLengthRef.current = notifications.length;
    
    // เมื่อ mount ครั้งแรก ให้ซ่อน panel เสมอ (เพื่อป้องกัน flash เมื่อ refresh)
    // จะแสดงเฉพาะเมื่อมี notification ใหม่เข้ามาจริงๆ (ผ่าน logic ที่ตรวจสอบ currentLength > prevLength)
    isClosingRef.current = false;
    setIsClosing(false);
    setShouldRender(false); // ซ่อน panel เมื่อ mount ครั้งแรก
    setIsInitialMount(true); // ตั้งค่าให้พร้อมสำหรับ slide-in animation เมื่อมี notification ใหม่
  }, []); // Empty dependency array - run only on mount

  // Reset closing state และแสดง panel อีกครั้งเมื่อมี notification ใหม่เข้ามา (เฉพาะ notification ที่เพิ่มใหม่)
  // จะแสดงอีกครั้งเฉพาะเมื่อมี notification ใหม่เข้ามาจริงๆ (notifications.length เพิ่มขึ้น)
  useEffect(() => {
    const prevLength = prevNotificationsLengthRef.current;
    const currentLength = notifications.length;
    
    // ถ้ามี notification เพิ่มเข้ามาจริงๆ (currentLength > prevLength)
    if (currentLength > prevLength && currentLength > 0) {
      prevNotificationsLengthRef.current = currentLength;
      
      // ถ้า panel กำลังจะปิด (แต่ยังไม่ปิด) ให้ cancel closing และแสดง panel อีกครั้งด้วย slide-in animation
      if (isClosingRef.current && !closingTimerRef.current) {
        // Cancel closing timer ถ้ามี
        if (closingTimerRef.current) {
          clearTimeout(closingTimerRef.current);
          closingTimerRef.current = null;
        }
        // Reset closing state เพื่อให้ panel แสดงอีกครั้ง
        isClosingRef.current = false;
        setIsClosing(false);
        setShouldRender(true);
        // แสดง slide-in animation เมื่อมี notification ใหม่เข้ามา
        setIsInitialMount(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsInitialMount(false);
          });
        });
      }
      // ถ้า panel ถูกปิดไปแล้ว (shouldRender = false) และมี notification ใหม่เข้ามา ให้แสดงอีกครั้งด้วย slide-in animation
      if (!shouldRender) {
        setShouldRender(true);
        isClosingRef.current = false;
        setIsClosing(false);
        // แสดง slide-in animation เมื่อมี notification ใหม่เข้ามา
        setIsInitialMount(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsInitialMount(false);
          });
        });
      } else if (!isInitialMount && !isClosing) {
        // ถ้า panel แสดงอยู่แล้วแต่มี notification ใหม่เข้ามา ให้แสดง slide-in animation อีกครั้ง
        setIsInitialMount(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsInitialMount(false);
          });
        });
      }
    } else {
      // อัปเดต prevLength ถ้า length ลดลงหรือเท่าเดิม (เพื่อ track การเปลี่ยนแปลงต่อไป)
      prevNotificationsLengthRef.current = currentLength;
    }
  }, [notifications.length, shouldRender]); // Trigger เมื่อ notifications.length เปลี่ยน

  const handleClose = () => {
    if (isClosingRef.current) return; // ป้องกันการเรียกซ้ำ
    
    // Cancel timers
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (closingTimerRef.current) {
      clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
    
    isClosingRef.current = true;
    setIsClosing(true);
    // รอ slide-out animation เสร็จก่อนปิด component
    closingTimerRef.current = setTimeout(() => {
      setShouldRender(false);
      if (onClose) onClose();
    }, 350);
  };

  // ปิด panel อัตโนมัติเมื่อ notifications หมด (ด้วย slide-out animation)
  useEffect(() => {
    if (notifications.length === 0 && !isClosingRef.current && shouldRender) {
      isClosingRef.current = true;
      setIsClosing(true);
      closingTimerRef.current = setTimeout(() => {
        setShouldRender(false);
        if (onClose) onClose();
      }, 350);
    }
    return () => {
      if (closingTimerRef.current) {
        clearTimeout(closingTimerRef.current);
        closingTimerRef.current = null;
      }
    };
  }, [notifications.length, shouldRender, onClose]);

  // Reset closing state เมื่อมี notification ใหม่เข้ามา (เฉพาะเมื่อยังไม่เริ่ม closing process)
  // ไม่ reset ถ้า closingTimerRef.current มีค่า (หมายความว่ากำลังจะปิดแล้ว)
  useEffect(() => {
    if (notifications.length > 0 && isClosing && !closingTimerRef.current) {
      // Cancel auto-close timer ถ้ามี
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      // Reset closing state
      isClosingRef.current = false;
      setIsClosing(false);
    }
  }, [notifications.length, isClosing]);

  // Auto-close panel ภายใน 3 วินาที (ด้วย slide-out animation)
  useEffect(() => {
    if (notifications.length > 0 && !isClosingRef.current && shouldRender && isVisible) {
      // Clear timer เก่า (ถ้ามี)
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      
      // ตั้ง timer ใหม่ 3 วินาที
      autoCloseTimerRef.current = setTimeout(() => {
        if (isClosingRef.current) return; // ป้องกันการเรียกซ้ำ
        
        isClosingRef.current = true;
        setIsClosing(true);
        closingTimerRef.current = setTimeout(() => {
          setShouldRender(false);
          if (onClose) onClose();
        }, 350);
      }, 3000);
    }

    // Cleanup timer เมื่อ component unmount หรือ notifications เปลี่ยน
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
  }, [notifications.length, shouldRender, isVisible, onClose]);

  // Render component ถ้ายังมี notifications หรือกำลัง closing (เพื่อให้ animation ทำงาน)
  if (!shouldRender || (notifications.length === 0 && !isClosing)) return null;

  return (
    <div 
      className={`fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] ${
        isClosing ? 'animate-slide-out-right' : isInitialMount ? 'panel-initial' : 'animate-slide-in-right'
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5" />
            <span className="font-semibold">การแจ้งเตือน</span>
            {notifications.length > 0 && (
              <span className="bg-white text-primary-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors ${
                notification.type === 'new_order' ? 'bg-blue-50' : 'bg-yellow-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl">
                      {notification.type === 'new_order' ? '🔔' : '🧾'}
                    </span>
                    <span className={`text-sm font-semibold ${
                      notification.type === 'new_order' ? 'text-blue-700' : 'text-yellow-700'
                    }`}>
                      {notification.type === 'new_order' ? 'ออเดอร์ใหม่' : 'ร้องขอเช็กบิล'}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm">{notification.message}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide animation styles */}
      <style>{`
        .panel-initial {
          transform: translateX(100%);
          opacity: 0;
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-out-right {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        .animate-slide-out-right {
          animation: slide-out-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationPanel;

