import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";
import websocketService from "../../services/websocket";

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
  const [searchParams] = useSearchParams();
  const { translate, currentLanguage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateNotification, setStatusUpdateNotification] =
    useState(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [cleanupNotification, setCleanupNotification] = useState(null);

  const temporaryIdFromUrl = searchParams.get("temporary_id");
  
  // ดึง temporary_id จาก localStorage ถ้าไม่มีใน URL
  const getTemporaryIdFromLocalStorage = () => {
    try {
      const guestOrdersData = localStorage.getItem("guest_orders");
      if (guestOrdersData) {
        const guestOrders = JSON.parse(guestOrdersData);
        // ใช้ temporary_id แรกที่มีใน localStorage
        if (guestOrders.length > 0) {
          return guestOrders[0].temporary_id;
        }
      }
    } catch (error) {
      console.error("Error reading guest_orders from localStorage:", error);
    }
    return null;
  };

  const temporaryId = temporaryIdFromUrl || getTemporaryIdFromLocalStorage();
  
  // Debug temporary_id
  console.log('🔍 GuestOrders component - temporary_id from URL:', temporaryIdFromUrl);
  console.log('🔍 GuestOrders component - temporary_id from localStorage:', getTemporaryIdFromLocalStorage());
  console.log('🔍 GuestOrders component - final temporary_id:', temporaryId);
  console.log('🔍 GuestOrders component - searchParams:', Object.fromEntries(searchParams.entries()));

  // WebSocket connection และ polling สำหรับ guest orders
  useEffect(() => {
    console.log('🔍 WebSocket useEffect triggered with temporaryId:', temporaryId);
    console.log('🔍 WebSocket useEffect - searchParams:', Object.fromEntries(searchParams.entries()));
    
    if (!temporaryId) {
      console.log('⚠️ No temporary_id provided, skipping WebSocket connection');
      return;
    }

    console.log(`🔗 Setting up WebSocket for temporary_id: ${temporaryId}`);
    
    // ทดสอบ WebSocket connection ก่อน
    const testWebSocketConnection = () => {
      try {
        const testWs = new WebSocket('ws://localhost:8000/ws/guest-orders/');
        
        testWs.onopen = () => {
          console.log('✅ Test WebSocket connection successful');
          testWs.close();
        };
        
        testWs.onerror = (error) => {
          console.error('❌ Test WebSocket connection failed:', error);
          console.log('💡 Backend WebSocket server might not be running or accessible');
        };
        
        testWs.onclose = (event) => {
          console.log('🔌 Test WebSocket closed with code:', event.code);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING) {
            console.log('⏰ Test WebSocket connection timeout');
            testWs.close();
          }
        }, 5000);
        
      } catch (error) {
        console.error('❌ Error creating test WebSocket:', error);
      }
    };
    
    // ทดสอบ connection ก่อน
    testWebSocketConnection();
    
    // ตรวจสอบ WebSocket connection ปัจจุบัน
    const currentTemporaryId = websocketService.guestTemporaryId;
    const isConnected = websocketService.isGuestConnected();
    
    console.log('🔍 Current WebSocket state:', {
      currentTemporaryId,
      newTemporaryId: temporaryId,
      isConnected,
      readyState: websocketService.guestWs?.readyState
    });
    
    // ถ้า temporary_id เปลี่ยน หรือ WebSocket ไม่เชื่อมต่อ ให้เชื่อมต่อใหม่
    if (currentTemporaryId !== temporaryId || !isConnected) {
      console.log('🔄 Temporary ID changed or WebSocket not connected, reconnecting...');
      
      // ปิด connection เก่า (ถ้ามี)
      websocketService.disconnectGuest();
      
      // ตั้งค่า temporary_id ใน WebSocket service ก่อน (สำคัญ!)
      websocketService.setGuestTemporaryId(temporaryId);
      
      // เชื่อมต่อใหม่ (setGuestTemporaryId จะจัดการการเชื่อมต่อและ subscribe อัตโนมัติ)
      websocketService.connectGuest();
    } else {
      console.log('✅ WebSocket already connected with correct temporary_id, skipping reconnection');
    }

    // Initial fetch
    fetchOrders();

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up WebSocket connection for temporary_id:', temporaryId);
      // ไม่ต้องปิด WebSocket ทุกครั้ง เพราะอาจมี temporary_id อื่นใช้อยู่
      // websocketService.disconnectGuest();
    };
  }, [temporaryId]); // ขึ้นกับ temporary_id เท่านั้น

  // เพิ่ม useEffect สำหรับจัดการ WebSocket เมื่อไม่มี temporary_id ใน URL แต่มีใน localStorage
  useEffect(() => {
    // ถ้าไม่มี temporary_id ใน URL แต่มีใน localStorage ให้เชื่อมต่อ WebSocket
    if (!temporaryIdFromUrl && temporaryId) {
      console.log('🔗 No temporary_id in URL but found in localStorage, connecting WebSocket...');
      
      const currentTemporaryId = websocketService.guestTemporaryId;
      const isConnected = websocketService.isGuestConnected();
      
      console.log('🔍 WebSocket state for localStorage temporary_id:', {
        currentTemporaryId,
        localStorageTemporaryId: temporaryId,
        isConnected,
        readyState: websocketService.guestWs?.readyState
      });
      
      // ถ้า temporary_id เปลี่ยน หรือ WebSocket ไม่เชื่อมต่อ ให้เชื่อมต่อใหม่
      if (currentTemporaryId !== temporaryId || !isConnected) {
        console.log('🔄 Connecting WebSocket for localStorage temporary_id...');
        
        // ปิด connection เก่า (ถ้ามี)
        websocketService.disconnectGuest();
        
        // ตั้งค่า temporary_id ใน WebSocket service
        websocketService.setGuestTemporaryId(temporaryId);
        
        // เชื่อมต่อใหม่
        websocketService.connectGuest();
      } else {
        console.log('✅ WebSocket already connected with localStorage temporary_id');
      }
    }
  }, [temporaryIdFromUrl, temporaryId]); // ขึ้นกับทั้ง temporary_id จาก URL และ localStorage

  // แยก useEffect สำหรับ polling (ไม่ขึ้นกับ WebSocket)
  useEffect(() => {
    if (!temporaryId) {
      setPollingActive(false);
      return;
    }

    // Check WebSocket connection status
    const isWebSocketConnected = websocketService.isGuestConnected();
    console.log('🔍 Polling useEffect - WebSocket status:', {
      isWebSocketConnected,
      readyState: websocketService.guestWs?.readyState,
      temporaryId,
      temporaryIdFromUrl,
      hasLocalStorageTemporaryId: !!getTemporaryIdFromLocalStorage()
    });
    
    if (isWebSocketConnected) {
      console.log('✅ WebSocket connected, disabling polling');
      setPollingActive(false);
      fetchOrders(); // Initial fetch only
      return;
    }

    // Use polling as fallback when WebSocket is not available
    console.log('⚠️ WebSocket not connected, enabling polling');
    setPollingActive(true);

    // Initial fetch
    fetchOrders();

    // Set up polling interval (ทุก 10 วินาที) - เหมือนกับ Orders.jsx
    const pollingInterval = setInterval(() => {
      // Check again if WebSocket became available
      const isConnected = websocketService.isGuestConnected();
      console.log('🔄 Polling interval - checking WebSocket:', {
        isConnected,
        readyState: websocketService.guestWs?.readyState,
        temporaryId
      });
      
      if (isConnected) {
        console.log('✅ WebSocket became available, disabling polling');
        setPollingActive(false);
        clearInterval(pollingInterval);
        return;
      }
      console.log("🔄 Polling for order updates...");
      fetchOrdersQuietly(); // Fetch without loading states
    }, 10000);

    return () => {
      // Cleanup polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setPollingActive(false);
    };
  }, [temporaryId]); // ขึ้นกับ temporary_id เท่านั้น

  // แยก useEffect สำหรับ WebSocket event listeners
  useEffect(() => {
    // Set translate function for WebSocket service
    websocketService.setTranslateFunction(translate);

    // Listen for order status updates
    const handleOrderStatusUpdate = (data) => {
      console.log("🔄 Handling order status update:", data);

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
      } else {
        // Refresh orders list สำหรับสถานะอื่นๆ
        fetchOrdersQuietly();
      }

      // Show UI notification popup
      const translatedStatus = translate(`order.status.${newStatus}`);
      setStatusUpdateNotification({
        orderId: temporaryId,
        statusLabel: translatedStatus,
        oldStatus: data.payload?.old_status || data.old_status,
        newStatus: newStatus,
      });

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setStatusUpdateNotification(null);
      }, 5000);
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
  }, [translate]); // ใช้เฉพาะ translate เป็น dependency

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (temporaryId) {
        // Fetch specific guest order using track endpoint
        response = await api.get(
          `/guest-orders/track/?temporary_id=${temporaryId}`
        );
        setOrders([response.data]);
      } else {
        // Fetch all guest orders from localStorage (เก็บแค่ temporary_id) และดึงข้อมูลจาก API
        const guestOrdersData = localStorage.getItem("guest_orders");
        if (guestOrdersData) {
          const guestOrders = JSON.parse(guestOrdersData);

          // ดึงข้อมูลจาก API สำหรับแต่ละ temporary_id
          const detailedOrders = [];
          const validTemporaryIds = [];

          for (const guestOrder of guestOrders) {
            try {
              console.log(
                `🔍 Fetching order data for: ${guestOrder.temporary_id}`
              );
              const orderResponse = await api.get(
                `/guest-orders/track/?temporary_id=${guestOrder.temporary_id}`
              );
              const orderData = orderResponse.data;

              // ตรวจสอบสถานะออเดอร์
              if (
                orderData.current_status === "completed" ||
                orderData.current_status === "cancelled"
              ) {
                // ลบ temporary_id ออกจาก localStorage เมื่อออเดอร์เสร็จสิ้นหรือยกเลิก
                removeCompletedOrderFromLocalStorage(guestOrder.temporary_id);
                console.log(
                  `Order ${guestOrder.temporary_id} is ${orderData.current_status}, removing from localStorage`
                );
                continue; // ข้ามไป ไม่เพิ่มในรายการ
              }

              detailedOrders.push(orderData);
              validTemporaryIds.push(guestOrder.temporary_id);
              console.log(`✅ Order data fetched: ${guestOrder.temporary_id}`);
            } catch (error) {
              console.error(
                `Error fetching order ${guestOrder.temporary_id}:`,
                error
              );
              // ถ้า API ส่ง 404 หรือ 410 (expired) ให้ข้ามไป ไม่เพิ่มในรายการ
              if (
                error.response?.status === 404 ||
                error.response?.status === 410
              ) {
                console.log(
                  `Order ${guestOrder.temporary_id} not found or expired, removing from localStorage`
                );
                continue;
              }
              // สำหรับ error อื่นๆ ให้ข้ามไป ไม่ใช้ข้อมูลเก่าจาก localStorage
              console.log(
                `Skipping order ${guestOrder.temporary_id} due to API error`
              );
            }
          }

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
      console.error("Error fetching orders:", error);
      setError(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [temporaryId]); // ลบ translate ออกจาก dependencies

  // Fetch orders without loading states (สำหรับ polling)
  const fetchOrdersQuietly = useCallback(async () => {
    try {
      if (temporaryId) {
        const response = await api.get(
          `/guest-orders/track/?temporary_id=${temporaryId}`
        );
        const newOrder = response.data;

        // Compare with current orders to detect changes
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
      } else {
        const guestOrdersData = localStorage.getItem("guest_orders");
        if (guestOrdersData) {
          const guestOrders = JSON.parse(guestOrdersData);

          // ดึงข้อมูลจาก API สำหรับแต่ละ temporary_id
          const detailedOrders = [];
          const validTemporaryIds = [];

          for (const guestOrder of guestOrders) {
            try {
              const orderResponse = await api.get(
                `/guest-orders/track/?temporary_id=${guestOrder.temporary_id}`
              );
              const orderData = orderResponse.data;

              // ตรวจสอบสถานะออเดอร์
              if (
                orderData.current_status === "completed" ||
                orderData.current_status === "cancelled"
              ) {
                // ลบ temporary_id ออกจาก localStorage เมื่อออเดอร์เสร็จสิ้นหรือยกเลิก
                removeCompletedOrderFromLocalStorage(guestOrder.temporary_id);
                console.log(
                  `Order ${guestOrder.temporary_id} is ${orderData.current_status}, removing from localStorage`
                );
                continue; // ข้ามไป ไม่เพิ่มในรายการ
              }

              detailedOrders.push(orderData);
              validTemporaryIds.push(guestOrder.temporary_id);
            } catch (error) {
              console.error(
                `Error fetching order ${guestOrder.temporary_id}:`,
                error
              );
              // ถ้า API ส่ง 404 หรือ 410 (expired) ให้ข้ามไป
              if (
                error.response?.status === 404 ||
                error.response?.status === 410
              ) {
                console.log(
                  `Order ${guestOrder.temporary_id} not found or expired, removing from localStorage`
                );
                continue;
              }
              // สำหรับ error อื่นๆ ให้ข้ามไป
              console.log(
                `Skipping order ${guestOrder.temporary_id} due to API error`
              );
            }
          }

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
      console.error("Error fetching orders quietly:", error);
      // Don't show error UI for polling failures
    }
  }, [temporaryId]); // ลบ translate ออกจาก dependencies

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
          console.log(
            `Cleaned up ${removedCount} expired guest orders from localStorage`
          );

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
      console.error("Error cleaning up expired orders:", error);
    }
  }, []); // ลบ translate ออกจาก dependencies

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
          console.log(
            `✅ Removed completed order from localStorage: ${temporaryId}`
          );

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
      console.error("Error removing completed order from localStorage:", error);
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
      console.log(
        `✅ Added/updated guest order in localStorage: ${orderData.temporary_id}`
      );
    } catch (error) {
      console.error("Error adding guest order to localStorage:", error);
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
      {/* Status Update Notification */}
      {statusUpdateNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center">
            <span className="text-xl mr-3">🔔</span>
            <div>
              <p className="font-semibold">
                {translate("order.status_updated")}
              </p>
              <p className="text-sm">
                {statusUpdateNotification.oldStatus &&
                statusUpdateNotification.newStatus
                  ? translate("order.status_change_notification", {
                      orderId: statusUpdateNotification.orderId,
                      oldStatus: translate(
                        `order.status.${statusUpdateNotification.oldStatus}`
                      ),
                      newStatus: translate(
                        `order.status.${statusUpdateNotification.newStatus}`
                      ),
                    })
                  : translate("order.status_updated_notification", {
                      orderId: statusUpdateNotification.orderId,
                      status: translate(statusUpdateNotification.statusLabel),
                    })}
              </p>
            </div>
            <button
              onClick={() => setStatusUpdateNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cleanup Notification */}
      {cleanupNotification && (
        <div className="fixed top-4 left-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center">
            <span className="text-xl mr-3">🧹</span>
            <div>
              <p className="font-semibold">
                {translate("order.history_cleaned")}
              </p>
              <p className="text-sm">{cleanupNotification.message}</p>
            </div>
            <button
              onClick={() => setCleanupNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
              
              console.log('🔍 Status indicator check:', {
                isWebSocketConnected,
                readyState,
                readyStateText,
                hasWebSocket,
                pollingActive,
                temporaryId,
                guestTemporaryId: websocketService.guestTemporaryId,
                url: websocketService.guestWs?.url || 'N/A'
              });
              
              if (isWebSocketConnected) {
                return (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">
                      {translate("order.websocket_connected")}
                    </span>
                  </>
                );
              } else if (pollingActive) {
                return (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600 font-medium">
                      {translate("order.polling_active")}
                    </span>
                  </>
                );
              } else {
                return (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-600 font-medium">
                      {translate("order.no_realtime_updates")}
                    </span>
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
                      {parseFloat(order.total_amount).toFixed(2)}
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
                                {restaurantGroup.subtotal?.toFixed(2)}
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
                                      {item.product_image_url ? (
                                        <img
                                          src={item.product_image_url}
                                          alt={item.product_name}
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                      ) : (
                                        "🍽️"
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-secondary-800">
                                        {item.product_name}
                                      </p>
                                      <p className="text-sm text-secondary-500">
                                        {parseFloat(
                                          item.price_at_order
                                        ).toFixed(2)}{" "}
                                        × {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-semibold text-secondary-700">
                                    {parseFloat(item.subtotal).toFixed(2)}
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
                              {item.product_image_url ? (
                                <img
                                  src={item.product_image_url}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <span className="text-lg">🍽️</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800">
                                {item.product_name}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-secondary-500">
                                <span>
                                  {parseFloat(
                                    item.price_at_order || item.price
                                  ).toFixed(2)}
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
                            {parseFloat(
                              item.subtotal ||
                                (item.price_at_order || item.price) *
                                  item.quantity
                            ).toFixed(2)}
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
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">
                        {translate("order.delivery_fee")}:
                      </span>
                      <span className="text-secondary-800">
                        {parseFloat(order.delivery_fee || 0).toFixed(2)}
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
                        {parseFloat(order.total_amount).toFixed(2)}
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
