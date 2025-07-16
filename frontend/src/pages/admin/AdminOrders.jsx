import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG, API_ENDPOINTS } from "../../config/api";

const AdminOrders = () => {
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("current_status");
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  // Pagination
  const pageSize = 5; // แสดง 10 รายการต่อหน้า (ปรับได้)
  const [page, setPage] = useState(1);

  // สถานะที่ใช้ได้ (ตรงกับ Backend)
  const orderStatuses = [
    {
      value: "pending",
      label: "รอดำเนินการ",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "paid",
      label: "ชำระเงินแล้ว",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "preparing",
      label: "กำลังเตรียม",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "ready_for_pickup",
      label: "พร้อมส่ง",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "delivering",
      label: "กำลังจัดส่ง",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "completed",
      label: "เสร็จสิ้น",
      color: "bg-green-100 text-green-800",
    },
    { value: "cancelled", label: "ยกเลิก", color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    fetchOrders();
  }, [sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // กำหนด URL ตาม sortBy (ใช้ backend ordering สำหรับฟิลด์อื่น ยกเว้น current_status)
      let url = "/orders/";
      if (sortBy && sortBy !== "current_status") {
        url += `?ordering=${sortBy}`;
      }

      const response = await api.get(url);
      let apiOrders = response.data.results || response.data;

      // ถ้าเรียงตามสถานะ ให้จัดเรียง client-side ตามลำดับ workflow
      if (sortBy === "current_status") {
        const statusOrder = [
          "pending",
          "paid",
          "preparing",
          "ready_for_pickup",
          "delivering",
          "completed",
          "cancelled",
        ];
        const rank = (s) => {
          const idx = statusOrder.indexOf(s ?? "");
          return idx === -1 ? statusOrder.length : idx;
        };
        apiOrders = [...apiOrders].sort((a, b) => {
          const diff =
            rank(a.current_status || a.status) -
            rank(b.current_status || b.status);
          if (diff !== 0) return diff;
          // ถ้าอยู่สถานะเดียวกัน เรียงตามวันที่ (เก่า -> ใหม่)
          return new Date(a.order_date) - new Date(b.order_date);
        });
      }

      setOrders(apiOrders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      setError("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (updatingOrders.has(orderId)) return; // ป้องกันการคลิกซ้ำ

    try {
      setUpdatingOrders((prev) => new Set([...prev, orderId]));

      const requestBody = {
        status: newStatus,
      };

      const data = await api.post(
        API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
        requestBody
      );

      // อัปเดท state local
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId
            ? { ...order, current_status: newStatus }
            : order
        )
      );

      alert(
        `อัปเดทสถานะคำสั่งซื้อ #${orderId} เป็น "${getStatusLabel(
          newStatus
        )}" เรียบร้อย`
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(
        "เกิดข้อผิดพลาดในการอัปเดทสถานะ: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find((s) => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find((s) => s.value === status);
    return statusObj ? statusObj.color : "bg-gray-100 text-gray-800";
  };

  const getFilteredAndSearchedOrders = () => {
    let filtered = orders;

    // กรองตามสถานะ
    if (filter !== "all") {
      filtered = filtered.filter(
        (order) => (order.current_status || order.status) === filter
      );
    }

    // ค้นหา
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_id?.toString().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.restaurant_name?.toLowerCase().includes(search) ||
          order.delivery_address?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = getFilteredAndSearchedOrders();

  // ถ้ามี highlightOrderId ให้เลื่อนไปและไฮไลต์
  useEffect(() => {
    if (highlightOrderId) {
      // เลื่อน card สู่ viewport หลัง render
      setTimeout(() => {
        const el = document.getElementById(`order-${highlightOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [highlightOrderId, orders]);

  // รีคำนวณหน้าทั้งหมดและรีเซ็ตหน้าปัจจุบันเมื่อข้อมูลหรือเงื่อนไขเปลี่ยน
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const displayOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">
            กำลังโหลดข้อมูลคำสั่งซื้อ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          จัดการคำสั่งซื้อ
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchOrders}
            className="bg-secondary-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-200 transition-colors"
          >
            🔄 รีเฟรช
          </button>
          <div className="text-sm text-secondary-600">
            ทั้งหมด {orders.length} รายการ
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค้นหา
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="หมายเลขคำสั่งซื้อ, ชื่อลูกค้า, ร้านอาหาร..."
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Status */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              กรองตามสถานะ
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              เรียงลำดับ
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="-order_date">วันที่ล่าสุด</option>
              <option value="order_date">วันที่เก่าสุด</option>
              <option value="-total_amount">ราคาสูงสุด</option>
              <option value="total_amount">ราคาต่ำสุด</option>
              <option value="current_status">สถานะ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {orderStatuses.map((status) => {
          const count = orders.filter(
            (order) => (order.current_status || order.status) === status.value
          ).length;
          return (
            <div
              key={status.value}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">{status.label}</p>
                  <p className="text-2xl font-bold text-secondary-800">
                    {count}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                >
                  {count > 0
                    ? `${((count / orders.length) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {displayOrders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              orderStatuses={orderStatuses}
              onUpdateStatus={updateOrderStatus}
              isUpdating={updatingOrders.has(order.order_id)}
              getStatusColor={getStatusColor}
              formatDateTime={formatDateTime}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">📋</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {searchTerm ? "ไม่พบคำสั่งซื้อที่ค้นหา" : "ไม่มีคำสั่งซื้อ"}
          </h2>
          <p className="text-secondary-500">
            {searchTerm
              ? "ลองใช้คำค้นหาอื่น"
              : "คำสั่งซื้อจะปรากฏที่นี่เมื่อมีลูกค้าสั่งซื้อ"}
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-1 select-none">
          {/* Prev */}
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded bg-secondary-100 hover:bg-secondary-200 disabled:opacity-50"
          >
            ‹
          </button>

          {/* Page Numbers */}
          {(() => {
            const pages = [];
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (page > 3) pages.push("ellipsis-prev");
              const start = Math.max(2, page - 1);
              const end = Math.min(totalPages - 1, page + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (page < totalPages - 2) pages.push("ellipsis-next");
              pages.push(totalPages);
            }

            return pages.map((p, idx) => {
              if (p === "ellipsis-prev" || p === "ellipsis-next") {
                return (
                  <span key={`e${idx}`} className="px-2 py-1">
                    …
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded ${
                    page === p
                      ? "bg-primary-600 text-white"
                      : "bg-secondary-100 hover:bg-secondary-200"
                  }`}
                >
                  {p}
                </button>
              );
            });
          })()}

          {/* Next */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded bg-secondary-100 hover:bg-secondary-200 disabled:opacity-50"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

// Order Card Component
const OrderCard = ({
  order,
  orderStatuses,
  onUpdateStatus,
  isUpdating,
  getStatusColor,
  formatDateTime,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    order.current_status || order.status
  );

  const orderDetails = Array.isArray(order.order_details)
    ? order.order_details
    : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant =
    order.is_multi_restaurant || orderDetailsByRestaurant.length > 1;
  const restaurantCount =
    order.restaurant_count || orderDetailsByRestaurant.length;
  const subtotal = orderDetails.reduce(
    (total, detail) => total + parseFloat(detail.subtotal || 0),
    0
  );

  const handleStatusUpdate = () => {
    if (selectedStatus === (order.current_status || order.status)) {
      alert("กรุณาเลือกสถานะใหม่");
      return;
    }

    onUpdateStatus(order.order_id, selectedStatus);
    setShowStatusUpdate(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Order Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-secondary-800">
                คำสั่งซื้อ #{order.order_id}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.current_status || order.status
                )}`}
              >
                {orderStatuses.find(
                  (s) => s.value === (order.current_status || order.status)
                )?.label ||
                  order.current_status ||
                  order.status}
              </span>
              {/* Multi-Restaurant Badge */}
              {isMultiRestaurant && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  🏪 {restaurantCount} ร้าน
                </span>
              )}

              {/* Payment Status Badge */}
              {order.payment && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                    order.payment.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.payment.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.payment.status === "completed"
                    ? "💰 ชำระแล้ว"
                    : order.payment.status === "pending"
                    ? "⏳ รอชำระ"
                    : "❌ ชำระไม่สำเร็จ"}
                </span>
              )}
            </div>
            <p className="text-sm text-secondary-600 mt-1">
              {formatDateTime(order.order_date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              {parseFloat(order.total_amount || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-secondary-600">ลูกค้า</p>
            <p className="font-semibold text-secondary-800">
              {order.customer_name || "ไม่ระบุ"}
            </p>
          </div>
          <div>
            <p className="text-sm text-secondary-600">
              {isMultiRestaurant ? "ร้านอาหาร (หลายร้าน)" : "ร้านอาหาร"}
            </p>
            {isMultiRestaurant ? (
              <div className="space-y-1">
                <p className="font-semibold text-blue-600 flex items-center">
                  <span className="mr-1">🏪</span>
                  การสั่งซื้อจาก {restaurantCount} ร้าน
                </p>
                {orderDetailsByRestaurant
                  .slice(0, 2)
                  .map((restaurantGroup, index) => (
                    <p key={index} className="text-sm text-secondary-600">
                      • {restaurantGroup.restaurant_name}
                    </p>
                  ))}
                {restaurantCount > 2 && (
                  <p className="text-sm text-secondary-500">
                    และอีก {restaurantCount - 2} ร้าน...
                  </p>
                )}
              </div>
            ) : (
              <Link
                to={`/restaurants/${order.restaurant}`}
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                {order.restaurant_name || "ไม่ระบุ"}
              </Link>
            )}
          </div>
          <div>
            <p className="text-sm text-secondary-600">จำนวนรายการ</p>
            <p className="font-semibold text-secondary-800">
              {orderDetails.length} รายการ
              {isMultiRestaurant && (
                <span className="text-secondary-500">
                  {" "}
                  จาก {restaurantCount} ร้าน
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-secondary-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-200 transition-colors text-sm"
          >
            {showDetails ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
          </button>

          <button
            onClick={() => setShowStatusUpdate(!showStatusUpdate)}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isUpdating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary-500 text-white hover:bg-primary-600"
            }`}
          >
            {isUpdating ? "กำลังอัปเดท..." : "อัปเดทสถานะ"}
          </button>

          {(order.current_status || order.status) !== "cancelled" && (
            <button
              onClick={() => onUpdateStatus(order.order_id, "cancelled")}
              disabled={isUpdating}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          )}
        </div>
      </div>

      {/* Order Details */}
      {showDetails && (
        <div className="border-t bg-secondary-50 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items - แยกตามร้าน */}
            <div>
              <h4 className="font-semibold text-secondary-700 mb-3">
                รายการอาหาร
                {isMultiRestaurant && (
                  <span className="text-blue-600"> (แยกตามร้าน)</span>
                )}
              </h4>

              {isMultiRestaurant && orderDetailsByRestaurant.length > 0 ? (
                // แสดงแยกตามร้าน สำหรับ multi-restaurant orders
                <div className="space-y-4">
                  {orderDetailsByRestaurant.map(
                    (restaurantGroup, groupIndex) => (
                      <div
                        key={restaurantGroup.restaurant_id || groupIndex}
                        className="border border-gray-200 rounded-lg p-3 bg-white"
                      >
                        {/* Restaurant Header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center">
                            <span className="text-sm mr-2">🏪</span>
                            <h5 className="font-semibold text-secondary-700 text-sm">
                              {restaurantGroup.restaurant_name}
                            </h5>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary-600">
                              {restaurantGroup.subtotal?.toFixed(2)}
                            </p>
                            <p className="text-xs text-secondary-500">
                              {restaurantGroup.items?.length || 0} รายการ
                            </p>
                          </div>
                        </div>

                        {/* Items in this restaurant */}
                        <div className="space-y-1">
                          {(restaurantGroup.items || []).map(
                            (item, itemIndex) => (
                              <div
                                key={item.order_detail_id || itemIndex}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-secondary-700">
                                  {item.product_name} × {item.quantity}
                                </span>
                                <span className="text-secondary-800 font-medium">
                                  {parseFloat(item.subtotal).toFixed(2)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* Total Summary */}
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>ยอดรวมทั้งหมด</span>
                    <span className="text-primary-600">
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                // แสดงแบบเดิม สำหรับ single-restaurant orders
                <div className="space-y-2">
                  {orderDetails.map((detail, index) => (
                    <div
                      key={detail.order_detail_id || index}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-secondary-700">
                        {detail.product_name} × {detail.quantity}
                        {detail.restaurant_name && !isMultiRestaurant && (
                          <span className="text-secondary-500 ml-2">
                            ({detail.restaurant_name})
                          </span>
                        )}
                      </span>
                      <span className="text-secondary-800 font-medium">
                        {parseFloat(detail.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>ยอดรวม</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h4 className="font-semibold text-secondary-700 mb-3">
                ข้อมูลการจัดส่ง
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-secondary-600">ที่อยู่:</span>
                  <p className="mt-1">{order.delivery_address || "ไม่ระบุ"}</p>
                </div>
                <div>
                  <span className="text-secondary-600">ค่าจัดส่ง:</span>
                  <span className="ml-2">
                    {parseFloat(order.delivery_fee || 0).toFixed(2)}
                  </span>
                  {isMultiRestaurant && (
                    <div className="text-xs text-secondary-500 mt-1">
                      • การจัดส่งจาก {restaurantCount} ร้าน
                    </div>
                  )}
                </div>
                {order.estimated_delivery_time && (
                  <div>
                    <span className="text-secondary-600">
                      เวลาจัดส่งโดยประมาณ:
                    </span>
                    <span className="ml-2">
                      {formatDateTime(order.estimated_delivery_time)}
                    </span>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">ยอดรวมสินค้า:</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">ค่าจัดส่ง:</span>
                    <span>
                      {parseFloat(order.delivery_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>ยอดชำระทั้งหมด:</span>
                    <span className="text-primary-600">
                      {parseFloat(order.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h4 className="font-semibold text-secondary-700 mb-3">
                ข้อมูลการชำระเงิน
              </h4>
              {order.payment ? (
                <div className="space-y-3">
                  {/* Payment Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-secondary-600">
                      สถานะการชำระ:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.payment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.payment.status === "completed"
                        ? "✅ ชำระแล้ว"
                        : order.payment.status === "pending"
                        ? "⏳ รอดำเนินการ"
                        : "❌ ไม่สำเร็จ"}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <span className="text-sm text-secondary-600">
                      วิธีการชำระ:
                    </span>
                    <span className="ml-2 text-sm font-medium">
                      {order.payment.payment_method === "bank_transfer"
                        ? "🏦 โอนผ่านธนาคาร"
                        : order.payment.payment_method === "qr_payment"
                        ? "📱 QR Payment"
                        : order.payment.payment_method}
                    </span>
                  </div>

                  {/* Payment Date */}
                  {order.payment.payment_date && (
                    <div>
                      <span className="text-sm text-secondary-600">
                        วันที่ชำระ:
                      </span>
                      <span className="ml-2 text-sm">
                        {formatDateTime(order.payment.payment_date)}
                      </span>
                    </div>
                  )}

                  {/* Amount Paid */}
                  <div>
                    <span className="text-sm text-secondary-600">
                      จำนวนเงินที่ชำระ:
                    </span>
                    <span className="ml-2 text-sm font-bold text-primary-600">
                      {parseFloat(order.payment.amount_paid || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Transaction ID */}
                  {order.payment.transaction_id && (
                    <div>
                      <span className="text-sm text-secondary-600">
                        หมายเลขอ้างอิง:
                      </span>
                      <span className="ml-2 text-sm font-mono text-secondary-800">
                        {order.payment.transaction_id}
                      </span>
                    </div>
                  )}

                  {/* Proof of Payment */}
                  {order.payment.proof_of_payment_display_url && (
                    <div>
                      <span className="text-sm text-secondary-600 block mb-2">
                        หลักฐานการโอนเงิน:
                      </span>
                      <div className="border border-secondary-200 rounded-lg p-2 bg-white">
                        <img
                          src={order.payment.proof_of_payment_display_url}
                          alt="หลักฐานการโอนเงิน"
                          className="w-full max-w-xs h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            window.open(
                              order.payment.proof_of_payment_display_url,
                              "_blank"
                            )
                          }
                        />
                        <p className="text-xs text-secondary-500 mt-1 text-center">
                          คลิกเพื่อดูรูปขนาดเต็ม
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Actions */}
                  {order.payment.status === "pending" && (
                    <div className="mt-4 pt-3 border-t border-secondary-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // TODO: Implement approve payment
                            alert("ฟีเจอร์อนุมัติการชำระเงินจะพัฒนาในอนาคต");
                          }}
                          className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                        >
                          ✅ อนุมัติ
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement reject payment
                            alert("ฟีเจอร์ปฏิเสธการชำระเงินจะพัฒนาในอนาคต");
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          ❌ ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2 opacity-30">💳</div>
                  <p className="text-secondary-500 text-sm">
                    ยังไม่มีข้อมูลการชำระเงิน
                  </p>
                  <p className="text-secondary-400 text-xs">
                    ลูกค้าอาจยังไม่ได้ทำการชำระเงิน
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Panel */}
      {showStatusUpdate && (
        <div className="border-t bg-yellow-50 p-6">
          <h4 className="font-semibold text-secondary-700 mb-4">
            อัปเดทสถานะคำสั่งซื้อ
            {isMultiRestaurant && (
              <span className="text-blue-600"> (หลายร้าน)</span>
            )}
          </h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              สถานะใหม่
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          {isMultiRestaurant && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>หมายเหตุ:</strong>{" "}
                การอัปเดทสถานะจะมีผลกับคำสั่งซื้อทั้งหมด ({restaurantCount}{" "}
                ร้าน)
              </p>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              ยืนยันการอัปเดท
            </button>
            <button
              onClick={() => setShowStatusUpdate(false)}
              className="bg-secondary-200 text-secondary-700 px-6 py-2 rounded-lg hover:bg-secondary-300 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
