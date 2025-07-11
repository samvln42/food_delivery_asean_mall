import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
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
        {/* Progress Line */}
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

        {/* Current Status Banner for Mobile */}
        <div className="sm:hidden mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center">
            <span className="text-lg mr-2">
              {statusSteps[currentStepIndex]?.icon}
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-green-700">
                {statusSteps[currentStepIndex]?.label}
              </p>
              <p className="text-xs text-green-600">
                {statusSteps[currentStepIndex]?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="relative z-10 flex justify-between">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center flex-1 max-w-[90px]"
              >
                {/* Step Circle */}
                <div
                  className={`
                  relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300 ease-in-out
                  ${
                    isCompleted
                      ? "bg-green-500 text-white transform scale-110 shadow-lg"
                      : "bg-secondary-200 text-secondary-500"
                  }
                  ${
                    isCurrent
                      ? "ring-4 ring-green-200 ring-opacity-50 shadow-xl"
                      : ""
                  }
                `}
                >
                  {isCompleted ? "✓" : step.icon}

                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25" />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center px-1">
                  <p
                    className={`text-xs font-medium leading-tight ${
                      isCompleted ? "text-green-600" : "text-secondary-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs mt-1 leading-tight hidden sm:block ${
                      isCompleted ? "text-green-500" : "text-secondary-400"
                    }`}
                  >
                    {step.description}
                  </p>

                  {/* Show timestamp for completed steps */}
                  {isCompleted && isCurrent && (
                    <p className="text-xs text-secondary-400 mt-1 hidden sm:block">
                      {new Date(orderDate).toLocaleString(
                        localeMap[currentLanguage] || "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        }
                      )}
                    </p>
                  )}
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

const Orders = () => {
  const { user, token } = useAuth();
  const { translate, currentLanguage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [statusUpdateNotification, setStatusUpdateNotification] =
    useState(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [totalPages, setTotalPages] = useState(1);

  // เรียกใช้ข้อมูล orders เมื่อ component โหลดครั้งแรก
  useEffect(() => {
    fetchOrders();

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, [page]);

  // Polling system สำหรับ real-time updates (Fallback หาก WebSocket ไม่ทำงาน)
  useEffect(() => {
    if (!user?.id || !token) {
      console.log("⚠️ User not authenticated, stopping polling");
      setPollingActive(false);
      return;
    }

    // Check WebSocket connection status
    const isWebSocketConnected = websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN;
    
    if (isWebSocketConnected) {
      console.log("✅ WebSocket connected - polling disabled");
      setPollingActive(false);
      fetchOrders(); // Initial fetch only
      return;
    }

    // Use polling as fallback when WebSocket is not available
    setPollingActive(true);
    console.log("🔄 WebSocket not available - using polling for real-time updates...");

    // Initial fetch
    fetchOrders();

    // Set up polling interval (ทุก 10 วินาที)
    const pollingInterval = setInterval(() => {
      // Check again if WebSocket became available
      if (websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN) {
        console.log("✅ WebSocket now available - stopping polling");
        setPollingActive(false);
        clearInterval(pollingInterval);
        return;
      }
      fetchOrdersQuietly(); // Fetch without loading states
    }, 10000);

    return () => {
      setPollingActive(false);
      clearInterval(pollingInterval);
    };
  }, [user?.id, token]);

  useEffect(() => {
    // Set translate function for WebSocket service
    websocketService.setTranslateFunction(translate);
    
    // Listen for order status updates
    const handleOrderStatusUpdate = (data) => {
      console.log('🎯 Order status update received in Orders.jsx:', data);
      console.log('👤 Current user:', user);
      console.log('📦 Order details:', data.payload || data);
      
      // Refresh orders list
      fetchOrdersQuietly();
      
      // Build display message (no toast anymore)
      const displayMessage = data.payload?.new_status_display || `Order #${data.payload?.order_id || data.order_id} updated to ${data.payload?.new_status || data.new_status}`;
      
      // Show UI notification popup
      const translatedStatus = translate(`order.status.${data.payload?.new_status || data.new_status}`);
      setStatusUpdateNotification({
        orderId: data.payload?.order_id || data.order_id,
        statusLabel: translatedStatus,
        oldStatus: data.payload?.old_status || data.old_status,
        newStatus: data.payload?.new_status || data.new_status,
      });

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setStatusUpdateNotification(null);
      }, 5000);

      // Removed Browser notification
    };
    
    websocketService.on('order_status_update', handleOrderStatusUpdate);
    
    return () => {
      websocketService.off('order_status_update', handleOrderStatusUpdate);
    };
  }, [translate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // ตรวจสอบว่ามี user และ token หรือไม่
      if (!user || !token) {
        console.error("❌ User not authenticated");
        setError(translate("order.please_login_first"));
        setOrders([]);
        return;
      }

      // เรียก API จริง - backend จะ filter orders ตาม user role อัตโนมัติ
      const response = await api.get("/orders/");
      const apiOrders = response.data.results || response.data;
      // เรียงตาม order_date (ใหม่ -> เก่า)
      const sortedOrders = [...apiOrders].sort(
        (a, b) => new Date(b.order_date) - new Date(a.order_date)
      );
      setOrders(sortedOrders);
      // compute pages client side
      const filtered = getFilteredOrders(apiOrders);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      setError(translate("order.unable_to_load_history"));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders without loading states (สำหรับ polling)
  const fetchOrdersQuietly = async () => {
    try {
      // ตรวจสอบว่ามี user และ token หรือไม่
      if (!user || !token) {
        console.error("❌ User not authenticated for polling");
        return;
      }

      const response = await api.get("/orders/");
      const apiOrders = response.data.results || response.data;
      const sortedNew = [...apiOrders].sort(
        (a, b) => new Date(b.order_date) - new Date(a.order_date)
      );

      // Compare with current orders to detect changes
      setOrders((prevOrders) => {
        // Check for status changes
        const statusChanges = [];

        sortedNew.forEach((newOrder) => {
          const oldOrder = prevOrders.find(
            (o) => o.order_id === newOrder.order_id
          );
          if (oldOrder && oldOrder.current_status !== newOrder.current_status) {
            statusChanges.push({
              orderId: newOrder.order_id,
              oldStatus: oldOrder.current_status,
              newStatus: newOrder.current_status,
              restaurantName: newOrder.restaurant_name,
            });
          }
        });

        // Show notifications for status changes (Only if WebSocket is not connected)
        if (statusChanges.length > 0) {
          const latestChange = statusChanges[0];
          const statusInfo = getStatusDisplay(latestChange.newStatus);

          // Only show notification if WebSocket is not connected (fallback)
          if (!websocketService.ws || websocketService.ws.readyState !== WebSocket.OPEN) {
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

            // Removed Browser notification
          }
        }

        return sortedNew;
      });
    } catch (error) {
      console.error("❌ Error polling orders:", error);
      // Don't show error UI for polling failures
    }
  };

  // ใช้ orderStatuses เดียวกันกับที่ใช้ในการแสดงผล
  const getOrderStatuses = () => [
    {
      value: "pending",
      label: translate("order.status.pending"),
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "paid",
      label: translate("order.status.paid"),
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "preparing",
      label: translate("order.status.preparing"),
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "ready_for_pickup",
      label: translate("order.status.ready_for_pickup"),
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "delivering",
      label: translate("order.status.delivering"),
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "completed",
      label: translate("order.status.completed"),
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: translate("order.status.cancelled"),
      color: "bg-red-100 text-red-800",
    },
  ];

  const getFilteredOrders = (ordersArr = orders) => {
    if (filter === "all") return ordersArr;
    return ordersArr.filter(
      (order) => (order.current_status || order.status || "pending") === filter
    );
  };

  const getStatusDisplay = (status) => {
    const statusObj = getOrderStatuses().find((s) => s.value === status);
    return statusObj
      ? { text: statusObj.label, color: statusObj.color }
      : { text: status, color: "bg-gray-100 text-gray-800" };
  };

  const getPaymentMethodDisplay = (method) => {
    const methodMap = {
      cash: translate("payment.cash"),
      credit_card: translate("payment.credit_card"),
      debit_card: translate("payment.debit_card"),
      promptpay: translate("payment.promptpay"),
      bank_transfer: translate("payment.bank_transfer"),
    };
    return methodMap[method] || method;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const localeMap = {
      en: "en-US",
      th: "th-TH",
      ko: "ko-KR",
    };
    
    // สร้าง options สำหรับ toLocaleString
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "gregory" // บังคับให้ใช้ปฏิทินแบบ Gregorian (ค.ศ.)
    };

    return date.toLocaleString(localeMap[currentLanguage] || "en-US", options);
  };

  const calculateSubtotal = (orderDetails) => {
    // API ส่ง order_details แทน items
    if (!Array.isArray(orderDetails)) {
      console.warn(
        "calculateSubtotal: orderDetails is not an array:",
        orderDetails
      );
      return 0;
    }
    return orderDetails.reduce((total, detail) => {
      // ใช้ subtotal หรือ price_at_order * quantity
      const subtotal = parseFloat(detail.subtotal) || 0;
      return total + subtotal;
    }, 0);
  };

  // Pre-calculate paginated orders
  const filteredOrdersLocal = getFilteredOrders();
  const displayOrders = filteredOrdersLocal.slice((page - 1) * pageSize, page * pageSize);

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
                {translate("order.status_change_notification", {
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          {translate("order.history")}
        </h1>
        <div className="flex items-center space-x-4">
          {/* Authentication Status */}
          {!user ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600">
                {translate("auth.not_logged_in")}
              </span>
            </div>
          ) : (
            <>
              {/* Real-time Updates Status Indicator */}
              <div className="flex items-center space-x-2">
                {websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">
                      WebSocket Connected
                    </span>
                  </>
                ) : pollingActive ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600 font-medium">
                      Polling Active
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-600 font-medium">
                      No Real-time Updates
                    </span>
                  </>
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* Authentication Warning */}
      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-500 mr-3">⚠️</span>
            <div>
              <p className="text-yellow-800 font-semibold">
                {translate("auth.please_login")}
              </p>
              <p className="text-yellow-700 text-sm">
                {translate("order.login_required_message")}
              </p>
              <div className="mt-2">
                <a
                  href="/login"
                  className="inline-flex items-center px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                >
                  {translate("common.login")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto border-b">
          {[
            { key: "all", label: translate("common.all") },
            ...getOrderStatuses().map(status => ({
              key: status.value,
              label: status.label
            }))
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-secondary-500 hover:text-secondary-700"
              }`}
            >
              {tab.label} (
              {tab.key === "all"
                ? orders.length
                : orders.filter(
                    (order) =>
                      (order.current_status || order.status || "pending") ===
                      tab.key
                  ).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrdersLocal.length > 0 ? (
        <div className="space-y-6">
          {displayOrders.map((order) => {
            const statusInfo = getStatusDisplay(
              order.current_status || order.status
            );
            const orderDetails = Array.isArray(order.order_details)
              ? order.order_details
              : [];
            const orderDetailsByRestaurant =
              order.order_details_by_restaurant || [];
            const isMultiRestaurant =
              order.is_multi_restaurant || orderDetailsByRestaurant.length > 1;
            const restaurantCount =
              order.restaurant_count || orderDetailsByRestaurant.length;
            const subtotal = calculateSubtotal(orderDetails);

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800">
                      {translate("order.order_number", { id: order.order_id })}
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
                    <p className="text-lg font-semibold text-primary-600 mt-1">
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
                              <p className="text-sm font-semibold text-primary-600">
                                {restaurantGroup.subtotal?.toFixed(2)}
                              </p>
                              <p className="text-xs text-secondary-500">
                                {restaurantGroup.items?.length || 0}{" "}
                                {translate("order.items_count")}
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
                      <span className="text-primary-600">
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
            <a
              href="/restaurants"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              {translate("order.start_ordering")}
            </a>
            <a
              href="/categories"
              className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors"
            >
              {translate("order.choose_by_category")}
            </a>
          </div>
        </div>
      )}
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-1 select-none">
          {/* Prev */}
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded bg-secondary-100 hover:bg-secondary-200 disabled:opacity-50"
          >‹</button>

          {/* Page Numbers */}
          {(() => {
            const pages = [];
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (page > 3) pages.push('ellipsis-prev');
              const start = Math.max(2, page - 1);
              const end = Math.min(totalPages - 1, page + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (page < totalPages - 2) pages.push('ellipsis-next');
              pages.push(totalPages);
            }

            return pages.map((p, idx) => {
              if (p === 'ellipsis-prev' || p === 'ellipsis-next') {
                return (
                  <span key={`e${idx}`} className="px-2 py-1">…</span>
                );
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded ${page===p ? 'bg-primary-600 text-white' : 'bg-secondary-100 hover:bg-secondary-200'}`}
                >{p}</button>
              );
            });
          })()}

          {/* Next */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded bg-secondary-100 hover:bg-secondary-200 disabled:opacity-50"
          >›</button>
        </div>
      )}
    </div>
  );
};

export default Orders;
