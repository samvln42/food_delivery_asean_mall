import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";
import websocketService from "../../services/websocket";
import { formatPrice } from "../../utils/formatPrice";
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';

// Order Status Tracker Component
const OrderStatusTracker = ({ currentStatus, orderDate, translate }) => {
  const { currentLanguage } = useLanguage();
  const localeMap = {
    en: "en-US",
    th: "th-TH",
    ko: "ko-KR",
  };

  const statusSteps = [
    {
      key: "pending",
      label: translate("order.status.pending"),
      icon: "🕐",
      description: translate("order.status.pending_desc"),
    },
    {
      key: "paid",
      label: translate("order.status.paid"),
      icon: "💳",
      description: translate("order.status.paid_desc"),
    },
    {
      key: "preparing",
      label: translate("order.status.preparing"),
      icon: "👨‍🍳",
      description: translate("order.status.preparing_desc"),
    },
    {
      key: "ready_for_pickup",
      label: translate("order.status.ready_for_pickup"),
      icon: "📦",
      description: translate("order.status.ready_for_pickup_desc"),
    },
    {
      key: "delivering",
      label: translate("order.status.delivering"),
      icon: "🚗",
      description: translate("order.status.delivering_desc"),
    },
    {
      key: "completed",
      label: translate("order.status.completed"),
      icon: "✅",
      description: translate("order.status.completed_desc"),
    },
  ];

  // กำหนดลำดับสถานะ
  const statusOrder = [
    "pending",
    "paid",
    "preparing",
    "ready_for_pickup",
    "delivering",
    "completed",
  ];
  const currentStepIndex = statusOrder.indexOf(currentStatus);

  // ถ้าสถานะเป็น cancelled แสดงแยกต่างหาก
  if (currentStatus === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            ❌
          </div>
          <div className="ml-3">
            <p className="text-red-800 font-semibold">
              {translate("order.status.cancelled")}
            </p>
            <p className="text-red-600 text-sm">
              {translate("order.status.cancelled_desc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 mb-4">
      <h4 className="text-md font-semibold text-secondary-700 mb-4">
        {translate("order.status")}
      </h4>

      <div className="relative">
        {/* Progress Line (ขีดสีเขียวยาวๆ) แสดงเสมอ */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-secondary-200 z-0">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-in-out shadow-sm"
            style={{
              width:
                currentStepIndex >= 0
                  ? `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`
                  : "0%",
            }}
          />
        </div>

        {/* Status Steps */}
        <div className="relative z-10 flex justify-between">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center flex-1 sm:flex-none sm:min-w-[56px] sm:max-w-[72px]"
              >
                {/* Step Circle */}
                <div
                  className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center text-base font-bold
                    transition-all duration-300 ease-in-out
                    ${
                      isCompleted
                        ? "bg-green-500 text-white scale-110 shadow-lg"
                        : "bg-secondary-200 text-secondary-500"
                    }
                    ${
                      isCurrent
                        ? "ring-4 ring-green-200 ring-opacity-50 shadow-xl"
                        : ""
                    }
                  `}
                  title={step.label}
                >
                  <span>{step.icon}</span>
                  {isCompleted && (
                    <span className="absolute -right-1 -bottom-1 bg-white rounded-full text-green-500 text-xs w-4 h-4 flex items-center justify-center border border-green-500">
                      ✓
                    </span>
                  )}
                  {isCurrent && (
                    <div
                      className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25"
                      style={{ animationDuration: "1.2s" }}
                    />
                  )}
                </div>
                {/* Step Label + Description เฉพาะ desktop/tablet */}
                <div className="hidden sm:block mt-1 text-center px-0.5">
                  <p
                    className={`text-xs leading-tight mt-1 ${
                      isCompleted ? "text-green-500" : "text-secondary-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated Time & Next Step */}
        {currentStatus !== "completed" && currentStatus !== "cancelled" && (
          <div className="mt-4 space-y-2">
            {/* Estimated Time */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">⏱️</span>
                  <span className="text-blue-700 text-sm font-medium">
                    {translate("order.estimated_time")}{" "}
                    {currentStatus === "pending"
                      ? `5 ${translate("order.minutes")}`
                      : currentStatus === "paid"
                      ? `10 ${translate("order.minutes")}`
                      : currentStatus === "preparing"
                      ? `15-20 ${translate("order.minutes")}`
                      : currentStatus === "ready_for_pickup"
                      ? `5 ${translate("order.minutes")}`
                      : currentStatus === "delivering"
                      ? `10-15 ${translate("order.minutes")}`
                      : translate("order.status.completed")}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600 ml-2">
                    {translate("order.tracking")}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Step Preview */}
            {currentStepIndex < statusSteps.length - 1 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">📋</span>
                  <span className="text-gray-700 text-sm">
                    {translate("order.next_step")}{" "}
                    <span className="font-medium">
                      {statusSteps[currentStepIndex + 1]?.label}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed Status */}
        {currentStatus === "completed" && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center">
              <span className="text-green-500 mr-2">🎉</span>
              <span className="text-green-700 text-sm font-medium">
                {translate("order.completed_message")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GuestOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { translate, currentLanguage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateNotification, setStatusUpdateNotification] =
    useState(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [cleanupNotification, setCleanupNotification] = useState(null);

  // เพิ่ม state สำหรับ WebSocket connection
  const [isWebSocketConnecting, setIsWebSocketConnecting] = useState(false);
  const [webSocketError, setWebSocketError] = useState(null);

  const temporaryIdFromUrl = searchParams.get("temporary_id");
  
  // ทำความสะอาด temporary_id (ลบ :1 หรือ port number ที่อาจติดมา)
  const sanitizeTemporaryId = (id) => {
    if (!id) return null;
    // ลบ :number ที่อาจติดท้ายมาจาก URL parsing error
    const cleaned = id.split(':')[0];
    return cleaned;
  };
  
  // ดึง temporary_id จาก URL เท่านั้น (ถ้ามี)
  // ไม่ดึงจาก localStorage เพื่อให้แสดงทุก orders พร้อมกัน
  const temporaryId = sanitizeTemporaryId(temporaryIdFromUrl);

  // ลบ temporary_id ออกจาก URL (replace state เพื่อไม่เพิ่ม history)
  const clearTemporaryIdFromUrl = useCallback(() => {
    try {
      if (searchParams.has("temporary_id")) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("temporary_id");
        setSearchParams(newParams, { replace: true });
      }
    } catch (e) {
      // fallback ปลอดภัย หาก setSearchParams ใช้ไม่ได้ในบางบริบท
      const url = new URL(window.location.href);
      url.searchParams.delete("temporary_id");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams, setSearchParams]);
  

  // WebSocket connection และ polling สำหรับ guest orders
  useEffect(() => {
    // ทดสอบ WebSocket connection ก่อน
    const testWebSocketConnection = () => {
      // ป้องกันการเรียก WebSocket connection ซ้ำ
      if (isWebSocketConnecting) return;

      setIsWebSocketConnecting(true);
      setWebSocketError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://').replace(/\/api\/?$/, '/ws/guest-orders/');

      const testWs = new WebSocket(wsUrl);
      
      // Timeout สำหรับ connection
      const connectionTimeout = setTimeout(() => {
        if (testWs.readyState === WebSocket.CONNECTING) {
          testWs.close();
          setIsWebSocketConnecting(false);
          setWebSocketError(new Error('WebSocket connection timeout'));
        }
      }, 5000);

      testWs.onopen = () => {
        clearTimeout(connectionTimeout);
        setIsWebSocketConnecting(false);
        testWs.close();
      };

      testWs.onerror = (error) => {
        clearTimeout(connectionTimeout);
        setIsWebSocketConnecting(false);
        setWebSocketError(error);
      };

      testWs.onclose = (event) => {
        clearTimeout(connectionTimeout);
        setIsWebSocketConnecting(false);
      };
        
    };
    
    // ทดสอบ connection ก่อน
    testWebSocketConnection();
    
    // ถ้ามี temporaryId ใน URL → subscribe แค่อันเดียว
    if (temporaryId) {
      const currentTemporaryId = websocketService.guestTemporaryId;
      const isConnected = websocketService.isGuestConnected();
      
      // ถ้า temporary_id เปลี่ยน หรือ WebSocket ไม่เชื่อมต่อ ให้เชื่อมต่อใหม่
      if (currentTemporaryId !== temporaryId || !isConnected) {
        // ปิด connection เก่า (ถ้ามี)
        websocketService.disconnectGuest();
        
        // ตั้งค่า temporary_id ใน WebSocket service ก่อน (สำคัญ!)
        websocketService.setGuestTemporaryId(temporaryId);
        
        // เชื่อมต่อใหม่ (setGuestTemporaryId จะจัดการการเชื่อมต่อและ subscribe อัตโนมัติ)
        websocketService.connectGuest();
      }
    } else {
      // ถ้าไม่มี temporaryId ใน URL → subscribe ทุก temporary_id จาก localStorage
      try {
        const guestOrdersData = localStorage.getItem("guest_orders");
        if (guestOrdersData) {
          const guestOrders = JSON.parse(guestOrdersData);
          const temporaryIds = guestOrders
            .map(order => sanitizeTemporaryId(order.temporary_id))
            .filter(id => id && id.startsWith('GUEST-'));
          
          if (temporaryIds.length > 0) {
            const isConnected = websocketService.isGuestConnected();
            
            // เชื่อมต่อ WebSocket ถ้ายังไม่ได้เชื่อมต่อ
            if (!isConnected) {
              websocketService.connectGuest();
            }
            
            // Subscribe ทุก temporary_id หลังจาก WebSocket เชื่อมต่อแล้ว
            setTimeout(() => {
              if (websocketService.isGuestConnected()) {
                websocketService.subscribeToMultipleGuestOrders(temporaryIds);
              } else {
                // ถ้ายังไม่เชื่อมต่อ ให้ลองอีกครั้ง
                setTimeout(() => {
                  if (websocketService.isGuestConnected()) {
                    websocketService.subscribeToMultipleGuestOrders(temporaryIds);
                  }
                }, 1000);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error setting up WebSocket for multiple orders:", error);
      }
    }

    // Initial fetch
    fetchOrders();

    // Cleanup
    return () => {
      // ไม่ต้องปิด WebSocket ทุกครั้ง เพราะอาจมี temporary_id อื่นใช้อยู่
      // websocketService.disconnectGuest();
    };
  }, [temporaryId]); // ขึ้นกับ temporary_id เท่านั้น

  // เพิ่มการแสดงข้อผิดพลาดของ WebSocket
  useEffect(() => {
    if (webSocketError) {
      // แสดงการแจ้งเตือน
      setStatusUpdateNotification({
        orderId: temporaryId,
        statusLabel: 'WebSocket Error',
        type: 'error'
      });

      // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
      setTimeout(() => {
        setStatusUpdateNotification(null);
      }, 5000);
    }
  }, [webSocketError, temporaryId]);


  // แยก useEffect สำหรับ polling (ไม่ขึ้นกับ WebSocket)
  useEffect(() => {
    // ถ้ามี temporaryId ใน URL → ใช้ WebSocket หรือ polling สำหรับ order นั้น
    // ถ้าไม่มี temporaryId ใน URL → ใช้ polling สำหรับทุก orders จาก localStorage
    
    // Check WebSocket connection status (เฉพาะเมื่อมี temporaryId)
    if (temporaryId) {
      const isWebSocketConnected = websocketService.isGuestConnected();
      
      if (isWebSocketConnected) {
        setPollingActive(false);
        // ทำความสะอาด localStorage ก่อน fetch
        cleanupLocalStorage();
        fetchOrders(); // Initial fetch only
        return;
      }

      // Use polling as fallback when WebSocket is not available
      setPollingActive(true);

      // ทำความสะอาด localStorage ก่อน fetch
      cleanupLocalStorage();
      
      // Initial fetch
      fetchOrders();

      // Set up polling interval (ทุก 10 วินาที) - เหมือนกับ Orders.jsx
      const pollingInterval = setInterval(() => {
        // Check again if WebSocket became available
        const isConnected = websocketService.isGuestConnected();
        
        if (isConnected) {
          setPollingActive(false);
          clearInterval(pollingInterval);
          return;
        }
        fetchOrdersQuietly(); // Fetch without loading states
      }, 10000);

      return () => {
        // Cleanup polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        setPollingActive(false);
      };
    } else {
      // ถ้าไม่มี temporaryId ใน URL → ใช้ polling สำหรับทุก orders จาก localStorage
      setPollingActive(true);
      
      // ทำความสะอาด localStorage ก่อน fetch
      cleanupLocalStorage();
      
      // Initial fetch
      fetchOrders();

      // Set up polling interval (ทุก 10 วินาที) สำหรับทุก orders
      const pollingInterval = setInterval(() => {
        fetchOrdersQuietly(); // Fetch without loading states
      }, 10000);

      return () => {
        // Cleanup polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        setPollingActive(false);
      };
    }
  }, [temporaryId]); // ขึ้นกับ temporary_id เท่านั้น

  // แยก useEffect สำหรับ WebSocket event listeners
  useEffect(() => {
    // Set translate function for WebSocket service
    websocketService.setTranslateFunction(translate);

    // Listen for order status updates
    const handleOrderStatusUpdate = (data) => {

      const newStatus = data.payload?.new_status || data.new_status;
      const temporaryId =
        data.payload?.temporary_id ||
        data.temporary_id ||
        data.payload?.order_id ||
        data.order_id;

      // ตรวจสอบสถานะใหม่
      if (newStatus === "completed" || newStatus === "cancelled") {
        // ลบ temporary_id ออกจาก localStorage เมื่อออเดอร์เสร็จสิ้นหรือยกเลิก
        removeCompletedOrderFromLocalStorage(temporaryId);

        // อัปเดตรายการออเดอร์ในหน้าจอ
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.temporary_id !== temporaryId)
        );

        // ลบ temporary_id ออกจาก URL หากตรงกับที่แสดงอยู่
        if (temporaryIdFromUrl && String(temporaryIdFromUrl) === String(temporaryId)) {
          clearTemporaryIdFromUrl();
        }
      } else {
        // Refresh orders list สำหรับสถานะอื่นๆ
        fetchOrdersQuietly();
      }

      // ไม่แสดง popup แจ้งเตือนอัปเดตสถานะฝั่งลูกค้า (รายการออเดอร์ยังอัปเดตตามปกติ)
    };

    websocketService.on("guest_order_status_update", handleOrderStatusUpdate);
    websocketService.on("order_status_update", handleOrderStatusUpdate);

    return () => {
      websocketService.off(
        "guest_order_status_update",
        handleOrderStatusUpdate
      );
      websocketService.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [translate, clearTemporaryIdFromUrl, temporaryIdFromUrl]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (temporaryId) {
        // Fetch specific guest order using track endpoint
        const trackUrl = API_ENDPOINTS.GUEST_ORDERS.TRACK(temporaryId);
        
        try {
          response = await api.get(trackUrl);
          const trackedOrder = response.data;
          if (trackedOrder.order_details) {
            trackedOrder.order_details.forEach((item, index) => {
              // Process order details
            });
          }

          // หากคำสั่งเสร็จสิ้นหรือยกเลิก ให้ลบ temporary_id ออกจาก URL และ localStorage
          if (
            trackedOrder?.current_status === "completed" ||
            trackedOrder?.current_status === "cancelled"
          ) {
            removeCompletedOrderFromLocalStorage(trackedOrder.temporary_id);
            if (temporaryIdFromUrl && String(temporaryIdFromUrl) === String(trackedOrder.temporary_id)) {
              clearTemporaryIdFromUrl();
            }
            setOrders([]);
          } else {
            setOrders([trackedOrder]);
          }
        } catch (error) {
          // ถ้าเป็น 404 หรือ 410 แสดงว่าออเดอร์ไม่มีอยู่แล้ว หรือหมดอายุ
          if (error.response?.status === 404 || error.response?.status === 410) {
            // ลบออกจาก localStorage และ URL
            removeCompletedOrderFromLocalStorage(temporaryId);
            if (temporaryIdFromUrl && String(temporaryIdFromUrl) === String(temporaryId)) {
              clearTemporaryIdFromUrl();
            }
            setOrders([]);
            setError(`Order ${temporaryId} not found or has expired`);
            return; // หยุดการทำงานต่อ
          } else {
            // สำหรับ error อื่นๆ ให้แสดงข้อความ error
            throw error;
          }
        }
      } else {
        // Fetch all guest orders from localStorage (เก็บแค่ temporary_id) และดึงข้อมูลจาก API แบบ parallel
        const guestOrdersData = localStorage.getItem("guest_orders");
        if (guestOrdersData) {
          const guestOrders = JSON.parse(guestOrdersData);

          if (guestOrders.length === 0) {
            setOrders([]);
            return;
          }

          // ดึงข้อมูลจาก API สำหรับทุก temporary_id แบบ parallel (พร้อมกัน)
          const fetchPromises = guestOrders.map(async (guestOrder) => {
            try {
              const cleanTempId = sanitizeTemporaryId(guestOrder.temporary_id);
              const orderResponse = await api.get(
                `/guest-orders/track/?temporary_id=${cleanTempId}`
              );
              return {
                success: true,
                data: orderResponse.data,
                temporaryId: guestOrder.temporary_id,
              };
            } catch (error) {
              return {
                success: false,
                error: error,
                temporaryId: guestOrder.temporary_id,
              };
            }
          });

          // รอให้ทุก Promise เสร็จ (parallel)
          const results = await Promise.all(fetchPromises);

          // ประมวลผลผลลัพธ์
          const detailedOrders = [];
          const validTemporaryIds = [];
          const removedTemporaryIds = [];

          results.forEach((result) => {
            if (result.success) {
              const orderData = result.data;

              // ตรวจสอบสถานะออเดอร์
              if (
                orderData.current_status === "completed" ||
                orderData.current_status === "cancelled"
              ) {
                // ลบ temporary_id ออกจาก localStorage เมื่อออเดอร์เสร็จสิ้นหรือยกเลิก
                removedTemporaryIds.push(result.temporaryId);
                return; // ข้ามไป ไม่เพิ่มในรายการ
              }

              detailedOrders.push(orderData);
              validTemporaryIds.push(result.temporaryId);
            } else {
              // จัดการ error
              const error = result.error;
              if (
                error.response?.status === 404 ||
                error.response?.status === 410
              ) {
                // ลบออกจาก localStorage เมื่อออเดอร์ไม่มีอยู่แล้วหรือหมดอายุ
                removedTemporaryIds.push(result.temporaryId);
              } else if (result.temporaryId.includes(':')) {
                // ถ้าเป็น temporary_id ที่มี format ผิด ให้ลบออก
                removedTemporaryIds.push(result.temporaryId);
              }
            }
          });

          // ลบ temporary_id ที่เสร็จสิ้นหรือมีปัญหา
          removedTemporaryIds.forEach((tempId) => {
            removeCompletedOrderFromLocalStorage(tempId);
          });

          // อัปเดต localStorage ให้มีเฉพาะ temporary_id ที่ยังมีอยู่ในฐานข้อมูล
          const updatedGuestOrders = guestOrders.filter((order) =>
            validTemporaryIds.includes(order.temporary_id)
          );

          // ถ้ามี orders ที่ถูกลบออก ให้แสดงการแจ้งเตือน
          if (updatedGuestOrders.length !== guestOrders.length) {
            const removedCount = guestOrders.length - updatedGuestOrders.length;
            localStorage.setItem(
              "guest_orders",
              JSON.stringify(updatedGuestOrders)
            );

            // แสดงการแจ้งเตือน
            setCleanupNotification({
              message: translate("order.cleanup_not_found_message", {
                count: removedCount,
              }),
              type: "warning",
            });

            // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
            setTimeout(() => {
              setCleanupNotification(null);
            }, 5000);
          } else {
            localStorage.setItem(
              "guest_orders",
              JSON.stringify(updatedGuestOrders)
            );
          }

          setOrders(detailedOrders);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [temporaryId]); // ลบ translate ออกจาก dependencies

  // Fetch orders without loading states (สำหรับ polling)
  const fetchOrdersQuietly = useCallback(async () => {
    try {
      if (temporaryId) {
        let newOrder;
        try {
          const response = await api.get(
            `/guest-orders/track/?temporary_id=${temporaryId}`
          );
          newOrder = response.data;

          // หากคำสั่งเสร็จสิ้นหรือยกเลิก ให้ลบ temporary_id ออกจาก URL และ localStorage แล้วเคลียร์รายการ
          if (
            newOrder?.current_status === "completed" ||
            newOrder?.current_status === "cancelled"
          ) {
            removeCompletedOrderFromLocalStorage(newOrder.temporary_id);
            if (temporaryIdFromUrl && String(temporaryIdFromUrl) === String(newOrder.temporary_id)) {
              clearTemporaryIdFromUrl();
            }
            setOrders([]);
            return;
          }
        } catch (error) {
          // ถ้าเป็น 404 หรือ 410 แสดงว่าออเดอร์ไม่มีอยู่แล้ว
          if (error.response?.status === 404 || error.response?.status === 410) {
            removeCompletedOrderFromLocalStorage(temporaryId);
            if (temporaryIdFromUrl && String(temporaryIdFromUrl) === String(temporaryId)) {
              clearTemporaryIdFromUrl();
            }
            setOrders([]);
            return;
          }
          // สำหรับ error อื่นๆ ให้ skip quietly
          return;
        }

        // Compare with current orders to detect changes (ใช้ได้เฉพาะเมื่อ newOrder มีค่า)
        if (newOrder) {
          setOrders((prevOrders) => {
            if (prevOrders.length === 0) {
              return [newOrder];
            }

            const oldOrder = prevOrders[0];
            if (oldOrder && oldOrder.current_status !== newOrder.current_status) {
            // Show notification for status changes (Only if WebSocket is not connected)
            if (
              !websocketService.guestWs ||
              websocketService.guestWs.readyState !== WebSocket.OPEN
            ) {
              const statusInfo = getStatusDisplay(newOrder.current_status);

              // Show notification
              setStatusUpdateNotification({
                orderId: newOrder.temporary_id,
                statusLabel: statusInfo.text,
                oldStatus: oldOrder.current_status,
                newStatus: newOrder.current_status,
              });

              // Auto-hide notification after 5 seconds
              setTimeout(() => {
                setStatusUpdateNotification(null);
              }, 5000);
            }
          }

          return [newOrder];
        });
        }
      } else {
        const guestOrdersData = localStorage.getItem("guest_orders");
        if (guestOrdersData) {
          const guestOrders = JSON.parse(guestOrdersData);

          if (guestOrders.length === 0) {
            return;
          }

          // ดึงข้อมูลจาก API สำหรับทุก temporary_id แบบ parallel (พร้อมกัน)
          const fetchPromises = guestOrders.map(async (guestOrder) => {
            try {
              const cleanTempId = sanitizeTemporaryId(guestOrder.temporary_id);
              const orderResponse = await api.get(
                `/guest-orders/track/?temporary_id=${cleanTempId}`
              );
              return {
                success: true,
                data: orderResponse.data,
                temporaryId: guestOrder.temporary_id,
              };
            } catch (error) {
              return {
                success: false,
                error: error,
                temporaryId: guestOrder.temporary_id,
              };
            }
          });

          // รอให้ทุก Promise เสร็จ (parallel)
          const results = await Promise.all(fetchPromises);

          // ประมวลผลผลลัพธ์
          const detailedOrders = [];
          const validTemporaryIds = [];
          const removedTemporaryIds = [];

          results.forEach((result) => {
            if (result.success) {
              const orderData = result.data;

              // ตรวจสอบสถานะออเดอร์
              if (
                orderData.current_status === "completed" ||
                orderData.current_status === "cancelled"
              ) {
                // ลบ temporary_id ออกจาก localStorage เมื่อออเดอร์เสร็จสิ้นหรือยกเลิก
                removedTemporaryIds.push(result.temporaryId);
                return; // ข้ามไป ไม่เพิ่มในรายการ
              }

              detailedOrders.push(orderData);
              validTemporaryIds.push(result.temporaryId);
            } else {
              // จัดการ error
              const error = result.error;
              if (
                error.response?.status === 404 ||
                error.response?.status === 410
              ) {
                // ลบออกจาก localStorage เมื่อออเดอร์ไม่มีอยู่แล้วหรือหมดอายุ
                removedTemporaryIds.push(result.temporaryId);
              } else if (result.temporaryId.includes(':')) {
                // ถ้าเป็น temporary_id ที่มี format ผิด ให้ลบออก
                removedTemporaryIds.push(result.temporaryId);
              }
            }
          });

          // ลบ temporary_id ที่เสร็จสิ้นหรือมีปัญหา
          removedTemporaryIds.forEach((tempId) => {
            removeCompletedOrderFromLocalStorage(tempId);
          });

          // อัปเดต localStorage
          const updatedGuestOrders = guestOrders.filter((order) =>
            validTemporaryIds.includes(order.temporary_id)
          );
          localStorage.setItem(
            "guest_orders",
            JSON.stringify(updatedGuestOrders)
          );

          // Compare with current orders to detect changes
          setOrders((prevOrders) => {
            // Check for status changes
            const statusChanges = [];

            detailedOrders.forEach((newOrder) => {
              const oldOrder = prevOrders.find(
                (o) => o.temporary_id === newOrder.temporary_id
              );
              if (
                oldOrder &&
                oldOrder.current_status !== newOrder.current_status
              ) {
                statusChanges.push({
                  orderId: newOrder.temporary_id,
                  oldStatus: oldOrder.current_status,
                  newStatus: newOrder.current_status,
                });
              }
            });

            // Show notifications for status changes (Only if WebSocket is not connected)
            if (statusChanges.length > 0) {
              const latestChange = statusChanges[0];
              const statusInfo = getStatusDisplay(latestChange.newStatus);

              // Only show notification if WebSocket is not connected (fallback)
              if (
                !websocketService.guestWs ||
                websocketService.guestWs.readyState !== WebSocket.OPEN
              ) {
                // Show notification
                setStatusUpdateNotification({
                  orderId: latestChange.orderId,
                  statusLabel: statusInfo.text,
                  oldStatus: latestChange.oldStatus,
                  newStatus: latestChange.newStatus,
                });

                // Auto-hide notification after 5 seconds
                setTimeout(() => {
                  setStatusUpdateNotification(null);
                }, 5000);
              }
            }

            return detailedOrders;
          });
        }
      }
    } catch (error) {
      // Don't show error UI for polling failures
    }
  }, [temporaryId, clearTemporaryIdFromUrl, temporaryIdFromUrl]);

  // ฟังก์ชันสำหรับลบ guest orders ที่หมดอายุออกจาก localStorage
  const cleanupExpiredOrders = useCallback(() => {
    try {
      const guestOrdersData = localStorage.getItem("guest_orders");
      if (guestOrdersData) {
        const guestOrders = JSON.parse(guestOrdersData);
        const now = new Date();

        // กรองเอาเฉพาะ orders ที่ยังไม่หมดอายุ (30 วัน)
        // เก็บแค่ temporary_id และ order_date เท่านั้น
        const validOrders = guestOrders.filter((order) => {
          if (!order.temporary_id) return false;
          if (!order.order_date) return false;

          const orderDate = new Date(order.order_date);
          const expiryDate = new Date(
            orderDate.getTime() + 30 * 24 * 60 * 60 * 1000
          ); // 30 วัน

          return now < expiryDate;
        });

        // อัปเดต localStorage ถ้ามี orders ที่หมดอายุ
        if (validOrders.length !== guestOrders.length) {
          const removedCount = guestOrders.length - validOrders.length;
          localStorage.setItem("guest_orders", JSON.stringify(validOrders));

          // แสดงการแจ้งเตือน
          setCleanupNotification({
            message: translate("order.cleanup_expired_message", {
              count: removedCount,
            }),
            type: "info",
          });

          // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
          setTimeout(() => {
            setCleanupNotification(null);
          }, 5000);
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }, []); // ลบ translate ออกจาก dependencies

  // ฟังก์ชันสำหรับทำความสะอาด localStorage โดยการลบ temporary_id ที่มี format ผิด
  const cleanupLocalStorage = useCallback(() => {
    try {
      const guestOrdersData = localStorage.getItem("guest_orders");
      if (guestOrdersData) {
        const guestOrders = JSON.parse(guestOrdersData);
        
        // กรอง temporary_id ที่มี format ถูกต้อง (ไม่มี : หรือ characters พิเศษ)
        const cleanedOrders = guestOrders.filter(order => {
          const isValid = order.temporary_id && 
                         typeof order.temporary_id === 'string' &&
                         order.temporary_id.startsWith('GUEST-') &&
                         !order.temporary_id.includes(':') &&
                         order.temporary_id.length > 10;
          
          if (!isValid) {
            // Remove invalid temporary_id
          }
          
          return isValid;
        });

        // อัปเดต localStorage ถ้ามีการเปลี่ยนแปลง
        if (cleanedOrders.length !== guestOrders.length) {
          localStorage.setItem("guest_orders", JSON.stringify(cleanedOrders));
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }, []);

  // ฟังก์ชันสำหรับลบ temporary_id ออกจาก localStorage เมื่อออเดอร์เสร็จสิ้นหรือยกเลิก
  const removeCompletedOrderFromLocalStorage = useCallback((temporaryId) => {
    try {
      const guestOrdersData = localStorage.getItem("guest_orders");
      if (guestOrdersData) {
        const guestOrders = JSON.parse(guestOrdersData);

        // ลบ temporary_id ที่เสร็จสิ้นออกจาก localStorage
        const updatedOrders = guestOrders.filter(
          (order) => order.temporary_id !== temporaryId
        );

        if (updatedOrders.length !== guestOrders.length) {
          localStorage.setItem("guest_orders", JSON.stringify(updatedOrders));

          // แสดงการแจ้งเตือน
          setCleanupNotification({
            message: translate("order.completed_removed_message"),
            type: "success",
          });

          // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
          setTimeout(() => {
            setCleanupNotification(null);
          }, 5000);
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }, []); // ลบ translate ออกจาก dependencies

  // ฟังก์ชันสำหรับเพิ่ม guest order ลงใน localStorage (เก็บแค่ข้อมูลพื้นฐาน)
  const addGuestOrderToLocalStorage = (orderData) => {
    try {
      const guestOrdersData = localStorage.getItem("guest_orders");
      const guestOrders = guestOrdersData ? JSON.parse(guestOrdersData) : [];

      // เก็บแค่ temporary_id และ order_date เท่านั้น
      const orderInfo = {
        temporary_id: orderData.temporary_id,
        order_date: orderData.order_date || new Date().toISOString(),
      };

      // ตรวจสอบว่า temporary_id นี้มีอยู่แล้วหรือไม่
      const existingIndex = guestOrders.findIndex(
        (order) => order.temporary_id === orderData.temporary_id
      );

      if (existingIndex >= 0) {
        // อัปเดตข้อมูลที่มีอยู่
        guestOrders[existingIndex] = orderInfo;
      } else {
        // เพิ่มข้อมูลใหม่
        guestOrders.push(orderInfo);
      }

      localStorage.setItem("guest_orders", JSON.stringify(guestOrders));
    } catch (error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    // ลบ orders ที่หมดอายุก่อนดึงข้อมูล
    cleanupExpiredOrders();
    fetchOrders();
  }, [temporaryId]); // ลบ dependencies ที่ไม่จำเป็น

  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: {
        text: translate("order.status.pending"),
        color: "bg-yellow-100 text-yellow-800",
      },
      paid: {
        text: translate("order.status.paid"),
        color: "bg-blue-100 text-blue-800",
      },
      preparing: {
        text: translate("order.status.preparing"),
        color: "bg-orange-100 text-orange-800",
      },
      ready_for_pickup: {
        text: translate("order.status.ready_for_pickup"),
        color: "bg-purple-100 text-purple-800",
      },
      delivering: {
        text: translate("order.status.delivering"),
        color: "bg-indigo-100 text-indigo-800",
      },
      completed: {
        text: translate("order.status.completed"),
        color: "bg-green-100 text-green-800",
      },
      cancelled: {
        text: translate("order.status.cancelled"),
        color: "bg-red-100 text-red-800",
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        calendar: "gregory",
      });
    } catch (error) {
      return dateString;
    }
  };

  const calculateSubtotal = (orderDetails) => {
    if (!Array.isArray(orderDetails)) {
      return 0;
    }
    return orderDetails.reduce((total, detail) => {
      const subtotal = parseFloat(detail.subtotal) || 0;
      return total + subtotal;
    }, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">
            {translate("common.loading")}
          </p>
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
            onClick={fetchOrders}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            {translate("common.try_again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
            {translate("order.history")}
        </h1>
        <div className="flex items-center space-x-4">
          {/* Real-time Updates Status Indicator */}
          <div className="flex items-center space-x-2">
            {(() => {
              const isWebSocketConnected = websocketService.isGuestConnected();
              const readyState = websocketService.guestWs?.readyState;
              const readyStateText = websocketService.getReadyStateText?.(readyState) || 'UNKNOWN';
              const hasWebSocket = !!websocketService.guestWs;
              
              
              if (isWebSocketConnected) {
                return (
                  <>
                    {/* <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">
                      {translate("order.websocket_connected")}
                    </span> */}
                  </>
                );
              } else if (pollingActive) {
                return (
                  <>
                    {/* <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600 font-medium">
                      {translate("order.polling_active")}
                    </span> */}
                  </>
                );
              } else {
                return (
                  <>
                    {/* <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-600 font-medium">
                      {translate("order.no_realtime_updates")}
                    </span> */}
                  </>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Temporary ID Display */}
      {/* {temporaryId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-blue-500 mr-3">🎫</span>
            <div>
              <p className="text-blue-800 font-semibold">
                {translate("order.temporary_id")}: {temporaryId}
              </p>
              <p className="text-blue-600 text-sm">
                {translate("order.save_id_message")}
              </p>
            </div>
          </div>
        </div>
      )} */}

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = getStatusDisplay(
              order.current_status || order.status
            );
            const orderDetails = Array.isArray(order.order_details)
              ? order.order_details
              : [];
            const orderDetailsByRestaurant =
              order.order_details_by_restaurant || [];
            const isMultiRestaurant =
              order.is_multi_restaurant ||
              (order.restaurants && order.restaurants.length > 1) ||
              orderDetailsByRestaurant.length > 1;
            const restaurantCount =
              order.restaurant_count ||
              (order.restaurants && order.restaurants.length) ||
              orderDetailsByRestaurant.length;
            const subtotal = calculateSubtotal(orderDetails);

            return (
              <div
                key={order.temporary_id || order.order_id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800">
                      {translate("order.order_number", {
                        id: order.temporary_id,
                      })}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      {isMultiRestaurant ? (
                        <p className="text-sm text-secondary-600 flex items-center">
                          <span className="text-lg mr-1">🏪</span>
                          {translate("order.from_multiple_restaurants", {
                            count: restaurantCount,
                          })}
                        </p>
                      ) : (
                        <p className="text-sm text-secondary-600">
                          {order.restaurant_name}
                        </p>
                      )}
                      <span className="text-secondary-400">•</span>
                      <p className="text-sm text-secondary-500">
                        {formatDateTime(order.order_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.text}
                    </span>
                    <p className="text-lg font-semibold text-red-600 mt-1">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Multi-Restaurant Info Banner */}
                {isMultiRestaurant && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-blue-500 mr-2">🏪</span>
                      <span className="text-blue-800 text-sm font-medium">
                        {translate("order.multi_restaurant_delivery")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Order Items - แยกตามร้าน */}
                <div className="space-y-4">
                  {isMultiRestaurant && orderDetailsByRestaurant.length > 0 ? (
                    // แสดงแยกตามร้าน สำหรับ multi-restaurant orders
                    orderDetailsByRestaurant.map(
                      (restaurantGroup, groupIndex) => (
                        <div
                          key={restaurantGroup.restaurant_id || groupIndex}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          {/* Restaurant Header */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">🏪</span>
                              <div>
                                <h4 className="font-semibold text-secondary-700">
                                  {restaurantGroup.restaurant_name}
                                </h4>
                                {restaurantGroup.restaurant_address && (
                                  <p className="text-xs text-secondary-500">
                                    {restaurantGroup.restaurant_address}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-red-600">
                                {formatPrice(restaurantGroup.subtotal)}
                              </p>
                              <p className="text-xs text-secondary-500">
                                {restaurantGroup.items?.length || 0}{" "}
                                {translate("order.items")}
                              </p>
                            </div>
                          </div>

                          {/* Items in this restaurant */}
                          <div className="space-y-2">
                            {(restaurantGroup.items || []).map(
                              (item, itemIndex) => (
                                <div
                                  key={item.order_detail_id || itemIndex}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center text-sm">
                                      {item.image_display_url || item.image_url || item.product_image_url ? (
                                        <img
                                          src={item.image_display_url || item.image_url || item.product_image_url}
                                  alt={getTranslatedName(item, currentLanguage, item.product_name)}
                                          className="w-full h-full object-cover rounded-lg"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className={`w-full h-full flex items-center justify-center text-sm ${item.image_display_url || item.image_url || item.product_image_url ? 'hidden' : ''}`}>
                                        🍽️
                                      </div>
                                    </div>
                                    <div>
                              <p className="font-medium text-secondary-800">
                                {getTranslatedName(item, currentLanguage, item.product_name)}
                              </p>
                                      <p className="text-sm text-secondary-500">
                                        {formatPrice(
                                          item.price_at_order
                                        )}{" "}
                                        × {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-semibold text-secondary-700">
                                    {formatPrice(item.subtotal)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    // แสดงแบบเดิม สำหรับ single-restaurant orders
                    <div className="space-y-2">
                      {orderDetails.map((item, index) => (
                        <div
                          key={item.order_detail_id || index}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                              {item.image_display_url || item.image_url || item.product_image_url ? (
                                <img
                                  src={item.image_display_url || item.image_url || item.product_image_url}
                                  alt={getTranslatedName(item, currentLanguage, item.product_name)}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${item.image_display_url || item.image_url || item.product_image_url ? 'hidden' : ''}`}>
                                <span className="text-lg">🍽️</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800">
                                {getTranslatedName(item, currentLanguage, item.product_name)}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-secondary-500">
                                <span>
                                  {formatPrice(
                                    item.price_at_order || item.price
                                  )}
                                </span>
                                <span>×</span>
                                <span>{item.quantity}</span>
                                {item.restaurant_name && !isMultiRestaurant && (
                                  <>
                                    <span>•</span>
                                    <span>{item.restaurant_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="font-semibold text-secondary-700">
                            {formatPrice(
                              item.subtotal ||
                                (item.price_at_order || item.price) *
                                  item.quantity
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">
                        {translate("order.subtotal")}:
                      </span>
                      <span className="text-secondary-800">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">
                        {translate("order.delivery_fee")}:
                      </span>
                      <span className="text-secondary-800">
                        {formatPrice(order.delivery_fee || 0)}
                      </span>
                    </div>
                    {isMultiRestaurant && (
                      <div className="text-xs text-secondary-500 pl-4">
                        •{" "}
                        {translate("order.delivery_from_multiple", {
                          count: restaurantCount,
                        })}
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span className="text-secondary-800">
                        {translate("cart.total")}:
                      </span>
                      <span className="text-red-600">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Status Tracker */}
                <div className="mt-4 pt-4 border-t">
                  <OrderStatusTracker
                    currentStatus={order.current_status || order.status}
                    orderDate={order.order_date}
                    translate={translate}
                  />
                </div>

                {/* Delivery Address */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-secondary-700 mb-2">
                    📍 {translate("order.delivery_address")}
                  </h4>
                  <p className="text-sm text-secondary-600">
                    {order.delivery_address}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">📦</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {translate("order.no_history")}
          </h2>
          <p className="text-secondary-500 mb-6">
            {translate("order.no_history_message")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Link
              to="/restaurants"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              {translate("order.choose_restaurant")}
            </Link> */}
            <Link
              to="/products"
              className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors"
            >
              {translate("common.order_now")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestOrders;