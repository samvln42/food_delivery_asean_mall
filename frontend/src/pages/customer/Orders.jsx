import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// Order Status Tracker Component
const OrderStatusTracker = ({ currentStatus, orderDate }) => {
  const statusSteps = [
    {
      key: "pending",
      label: "Pending",
      icon: "🕐",
      description: "Order received",
    },
    {
      key: "paid",
      label: "Paid",
      icon: "💳",
      description: "Payment successful",
    },
    {
      key: "preparing",
      label: "Preparing",
      icon: "👨‍🍳",
      description: "Restaurant is preparing food",
    },
    {
      key: "ready_for_pickup",
      label: "Ready for pickup",
      icon: "📦",
      description: "Food is ready for pickup",
    },
    {
      key: "delivering",
      label: "Delivering",
      icon: "🚗",
      description: "Driver is delivering",
    },
    {
      key: "completed",
      label: "Completed",
      icon: "✅",
      description: "Delivery completed",
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
            <p className="text-red-800 font-semibold">Order cancelled</p>
            <p className="text-red-600 text-sm">
              This order has been cancelled
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 mb-4">
      <h4 className="text-md font-semibold text-secondary-700 mb-4">
        Order status
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
                      {new Date(orderDate).toLocaleString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
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
                    Estimated time:{" "}
                    {currentStatus === "pending"
                      ? "5 minutes"
                      : currentStatus === "paid"
                      ? "10 minutes"
                      : currentStatus === "preparing"
                      ? "15-20 minutes"
                      : currentStatus === "ready_for_pickup"
                      ? "5 minutes"
                      : currentStatus === "delivering"
                      ? "10-15 minutes"
                      : "Completed"}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600 ml-2">Tracking</span>
                </div>
              </div>
            </div>

            {/* Next Step Preview */}
            {currentStepIndex < statusSteps.length - 1 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">📋</span>
                  <span className="text-gray-700 text-sm">
                    Next step:{" "}
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
                Order completed! Thank you for using our service!
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [statusUpdateNotification, setStatusUpdateNotification] =
    useState(null);
  const [pollingActive, setPollingActive] = useState(false);

  // เรียกใช้ข้อมูล orders เมื่อ component โหลดครั้งแรก
  useEffect(() => {
    fetchOrders();

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  // Polling system สำหรับ real-time updates
  useEffect(() => {
    if (!user?.id || !token) {
      console.log("⚠️ User not authenticated, stopping polling");
      setPollingActive(false);
      return;
    }

    setPollingActive(true);
    console.log("🔄 Starting polling for real-time updates...");

    // Initial fetch
    fetchOrders();

    // Set up polling interval (ทุก 10 วินาที)
    const pollingInterval = setInterval(() => {
      console.log("🔄 Polling for order updates...");
      fetchOrdersQuietly(); // Fetch without loading states
    }, 10000);

    return () => {
      console.log("🛑 Stopping polling...");
      setPollingActive(false);
      clearInterval(pollingInterval);
    };
  }, [user?.id, token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // เรียก API จริง
      const response = await api.get(import.meta.env.VITE_API_URL + "/orders/");
      const apiOrders = response.data.results || response.data;

      // Debug: ดูข้อมูลจาก API
      console.log("📋 Orders from API:", apiOrders);
      if (apiOrders.length > 0) {
        console.log("📦 First order structure:", apiOrders[0]);
        console.log("📋 First order details:", apiOrders[0].order_details);
      }

      setOrders(apiOrders);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      setError("Unable to load order history");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders without loading states (สำหรับ polling)
  const fetchOrdersQuietly = async () => {
    try {
      const response = await api.get(import.meta.env.VITE_API_URL + "/orders/");
      const apiOrders = response.data.results || response.data;

      // Compare with current orders to detect changes
      setOrders((prevOrders) => {
        // Check for status changes
        const statusChanges = [];

        apiOrders.forEach((newOrder) => {
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

        // Show notifications for status changes
        if (statusChanges.length > 0) {
          const latestChange = statusChanges[0];
          const statusInfo = getStatusDisplay(latestChange.newStatus);

          console.log("🔔 Status update detected:", latestChange);

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

          // Browser notification (if permission granted)
          if (Notification.permission === "granted") {
            new Notification("สถานะคำสั่งซื้อมีการอัปเดท!", {
              body: `คำสั่งซื้อ #${latestChange.orderId} เปลี่ยนเป็น "${statusInfo.text}"`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
            });
          }
        }

        return apiOrders;
      });
    } catch (error) {
      console.error("❌ Error polling orders:", error);
      // Don't show error UI for polling failures
    }
  };

  // ใช้ orderStatuses เดียวกันกับที่ใช้ในการแสดงผล
  const orderStatuses = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "paid", label: "Paid", color: "bg-blue-100 text-blue-800" },
    {
      value: "preparing",
      label: "Preparing",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "ready_for_pickup",
      label: "Ready for pickup",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "delivering",
      label: "Delivering",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  const getFilteredOrders = () => {
    if (filter === "all") return orders;
    return orders.filter(
      (order) => (order.current_status || order.status || "pending") === filter
    );
  };

  const getStatusDisplay = (status) => {
    const statusObj = orderStatuses.find((s) => s.value === status);
    return statusObj
      ? { text: statusObj.label, color: statusObj.color }
      : { text: status, color: "bg-gray-100 text-gray-800" };
  };

  const getPaymentMethodDisplay = (method) => {
    const methodMap = {
      cash: "เงินสด",
      credit_card: "บัตรเครดิต",
      debit_card: "บัตรเดบิต",
      promptpay: "พร้อมเพย์",
      bank_transfer: "โอนเงิน",
    };
    return methodMap[method] || method;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const filteredOrders = getFilteredOrders();

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
            onClick={fetchOrders}
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
      {/* Status Update Notification */}
      {statusUpdateNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center">
            <span className="text-xl mr-3">🔔</span>
            <div>
              <p className="font-semibold">สถานะคำสั่งซื้อมีการอัปเดท!</p>
              <p className="text-sm">
                คำสั่งซื้อ #{statusUpdateNotification.orderId} เปลี่ยนเป็น "
                {statusUpdateNotification.statusLabel}"
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
          ประวัติการสั่งซื้อ
        </h1>
        <div className="flex items-center space-x-4">
          {/* Authentication Status */}
          {!user ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600">Not Logged In</span>
            </div>
          ) : (
            <>
              {/* Real-time Updates Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    pollingActive ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                <span
                  className={`text-xs ${
                    pollingActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {pollingActive ? "Real-time Active" : "Real-time Inactive"}
                </span>
              </div>

              {/* Debug User Info */}
              <div className="text-xs text-gray-500 space-x-2">
                <span>User ID: {user.id}</span>
                <span>|</span>
                <span>Token: {token ? "✓" : "✗"}</span>
                <button
                  onClick={() => {
                    console.log("🔄 Force refresh orders");
                    fetchOrders();
                  }}
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  Refresh
                </button>
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
              <p className="text-yellow-800 font-semibold">Please login</p>
              <p className="text-yellow-700 text-sm">
                คุณต้องเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อและรับการอัปเดทแบบ
                real-time (ทุก 10 วินาที)
              </p>
              <div className="mt-2">
                <a
                  href="/login"
                  className="inline-flex items-center px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                >
                  เข้าสู่ระบบ
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
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "paid", label: "Paid" },
            { key: "preparing", label: "Preparing" },
            { key: "ready_for_pickup", label: "Ready for pickup" },
            { key: "delivering", label: "Delivering" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
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
      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
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
                      Order #{order.order_id}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      {isMultiRestaurant ? (
                        <p className="text-sm text-secondary-600 flex items-center">
                          <span className="text-lg mr-1">🏪</span>
                          Order from {restaurantCount} restaurants
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
                        Order from multiple restaurants - items will be
                        delivered together
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
                                {restaurantGroup.items?.length || 0} items
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
                      <span className="text-secondary-600">Total:</span>
                      <span className="text-secondary-800">
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Delivery fee:</span>
                      <span className="text-secondary-800">
                        {parseFloat(order.delivery_fee || 0).toFixed(2)}
                      </span>
                    </div>
                    {isMultiRestaurant && (
                      <div className="text-xs text-secondary-500 pl-4">
                        • Delivery from {restaurantCount} restaurants
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span className="text-secondary-800">Total:</span>
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
                  />
                </div>

                {/* Delivery Address */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-secondary-700 mb-2">
                    📍 Delivery address
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
            No order history
          </h2>
          <p className="text-secondary-500 mb-6">
            You have not ordered food or there is no order in this category
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/restaurants"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Start ordering
            </a>
            <a
              href="/categories"
              className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors"
            >
              Choose by category
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
