import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG, API_ENDPOINTS } from "../../config/api";

const AdminGuestOrders = () => {
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;
  const { user } = useAuth();
  const [guestOrders, setGuestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("current_status");
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  // Pagination
  const pageSize = 5; // แสดง 5 รายการต่อหน้า (ปรับได้)
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
    fetchGuestOrders();
  }, [sortBy]);

  const sortOrders = (orders) => {
    return orders.sort((a, b) => {
      // Sort by created_at descending (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const fetchGuestOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // กำหนด URL ตาม sortBy (ใช้ backend ordering สำหรับฟิลด์อื่น ยกเว้น current_status)
      let url = "/guest-orders/";
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
          const diff = rank(a.current_status) - rank(b.current_status);
          if (diff !== 0) return diff;
          // ถ้าอยู่สถานะเดียวกัน เรียงตามวันที่ (เก่า -> ใหม่)
          return new Date(a.order_date) - new Date(b.order_date);
        });
      }

      setGuestOrders(apiOrders);
    } catch (error) {
      console.error("Error fetching admin guest orders:", error);
      setError("ไม่สามารถโหลดข้อมูล Guest Orders ได้");
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

      await api.post(`/guest-orders/${orderId}/update_status/`, requestBody);

      // อัปเดท state local
      setGuestOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.guest_order_id === orderId
            ? { ...order, current_status: newStatus }
            : order
        )
      );

      alert(
        `อัปเดทสถานะ Guest Order #${orderId} เป็น "${getStatusLabel(
          newStatus
        )}" เรียบร้อย`
      );
    } catch (error) {
      console.error("Error updating guest order status:", error);
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
    let filtered = guestOrders;

    // กรองตามสถานะ
    if (filter !== "all") {
      filtered = filtered.filter((order) => order.current_status === filter);
    }

    // ค้นหา
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.guest_order_id?.toString().includes(search) ||
          order.temporary_id?.toLowerCase().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.customer_phone?.includes(search) ||
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
        const el = document.getElementById(`guest-order-${highlightOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [highlightOrderId, guestOrders]);

  // รีคำนวณหน้าทั้งหมดและรีเซ็ตหน้าปัจจุบันเมื่อข้อมูลหรือเงื่อนไขเปลี่ยน
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, guestOrders]);

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
            กำลังโหลดข้อมูล Guest Orders...
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
          จัดการ Guest Orders
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchGuestOrders}
            className="bg-secondary-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-200 transition-colors"
          >
            🔄 รีเฟรช
          </button>
          <div className="text-sm text-secondary-600">
            ทั้งหมด {guestOrders.length} รายการ
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
              placeholder="หมายเลขคำสั่งซื้อ, Temporary ID, ชื่อลูกค้า, ร้านอาหาร..."
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
          const count = guestOrders.filter(
            (order) => order.current_status === status.value
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
                    ? `${((count / guestOrders.length) * 100).toFixed(1)}%`
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
            <GuestOrderCard
              key={order.guest_order_id}
              order={order}
              orderStatuses={orderStatuses}
              onUpdateStatus={updateOrderStatus}
              isUpdating={updatingOrders.has(order.guest_order_id)}
              getStatusColor={getStatusColor}
              formatDateTime={formatDateTime}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">🛒</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {searchTerm ? "ไม่พบ Guest Orders ที่ค้นหา" : "ไม่มี Guest Orders"}
          </h2>
          <p className="text-secondary-500">
            {searchTerm
              ? "ลองใช้คำค้นหาอื่น"
              : "Guest Orders จะปรากฏที่นี่เมื่อมีลูกค้าสั่งซื้อโดยไม่ล็อกอิน"}
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  pageNum === page
                    ? "bg-primary-500 text-white"
                    : "bg-secondary-100 hover:bg-secondary-200"
                }`}
              >
                {pageNum}
              </button>
            )
          )}

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

const GuestOrderCard = ({
  order,
  orderStatuses,
  onUpdateStatus,
  isUpdating,
  getStatusColor,
  formatDateTime,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.current_status);

  const orderDetails = Array.isArray(order.order_details)
    ? order.order_details
    : [];

  const handleStatusUpdate = () => {
    if (selectedStatus === order.current_status) {
      alert("กรุณาเลือกสถานะใหม่");
      return;
    }

    onUpdateStatus(order.guest_order_id, selectedStatus);
    setShowStatusUpdate(false);
  };

  return (
    <div 
      id={`guest-order-${order.guest_order_id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      {/* Order Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-secondary-800">
                Guest Order #{order.guest_order_id}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.current_status
                )}`}
              >
                {orderStatuses.find(
                  (s) => s.value === order.current_status
                )?.label || order.current_status}
              </span>
              {/* Guest Badge */}
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                👤 Guest
              </span>
            </div>
            <p className="text-sm text-secondary-600 mt-1">
              Temporary ID: {order.temporary_id}
            </p>
            <p className="text-sm text-secondary-600">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-secondary-600">ลูกค้า</p>
            <p className="font-semibold text-secondary-800">
              {order.customer_name}
            </p>
            <p className="text-sm text-secondary-500">{order.customer_phone}</p>
          </div>
          <div>
            <p className="text-sm text-secondary-600">ร้านอาหาร</p>
            <p className="font-semibold text-secondary-800">
              {order.restaurant_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-secondary-600">ที่อยู่จัดส่ง</p>
            <p className="font-semibold text-secondary-800">
              {order.delivery_address}
            </p>
          </div>
          <div>
            <p className="text-sm text-secondary-600">จำนวนรายการ</p>
            <p className="font-semibold text-secondary-800">
              {orderDetails.length} รายการ
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

          {order.current_status !== "cancelled" && (
            <button
              onClick={() => onUpdateStatus(order.guest_order_id, "cancelled")}
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
            {/* Items */}
            <div>
              <h4 className="font-semibold text-secondary-700 mb-3">
                รายการอาหาร
              </h4>
              <div className="space-y-2">
                {orderDetails.map((detail, index) => (
                  <div
                    key={detail.guest_order_detail_id || index}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-secondary-700">
                      {detail.product_name} × {detail.quantity}
                      {detail.special_instructions && (
                        <span className="text-secondary-500 ml-2">
                          ({detail.special_instructions})
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
                  <span>
                    {orderDetails.reduce((total, detail) => 
                      total + parseFloat(detail.subtotal || 0), 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h4 className="font-semibold text-secondary-700 mb-3">
                ข้อมูลการจัดส่ง
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-secondary-600">ลูกค้า:</span>
                  <p className="mt-1 font-medium">{order.customer_name}</p>
                  <p className="text-secondary-500">{order.customer_phone}</p>
                </div>
                <div>
                  <span className="text-secondary-600">ร้านอาหาร:</span>
                  <p className="mt-1 font-medium">{order.restaurant_name}</p>
                </div>
                <div>
                  <span className="text-secondary-600">ที่อยู่:</span>
                  <p className="mt-1">{order.delivery_address || "ไม่ระบุ"}</p>
                </div>
                <div>
                  <span className="text-secondary-600">ค่าจัดส่ง:</span>
                  <span className="ml-2">
                    {parseFloat(order.delivery_fee || 0).toFixed(2)}
                  </span>
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
                    <span>
                      {orderDetails.reduce((total, detail) => 
                        total + parseFloat(detail.subtotal || 0), 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">ค่าจัดส่ง:</span>
                    <span>
                      {parseFloat(order.delivery_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">ภาษี:</span>
                    <span>
                      {parseFloat(order.tax_amount || 0).toFixed(2)}
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

            {/* Guest Order Information */}
            <div>
              <h4 className="font-semibold text-secondary-700 mb-3">
                ข้อมูล Guest Order
              </h4>
              <div className="space-y-3">
                {/* Guest Order Status */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-secondary-600">
                    สถานะคำสั่งซื้อ:
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.current_status
                    )}`}
                  >
                    {orderStatuses.find(
                      (s) => s.value === order.current_status
                    )?.label || order.current_status}
                  </span>
                </div>

                {/* Temporary ID */}
                <div>
                  <span className="text-sm text-secondary-600">
                    Temporary ID:
                  </span>
                  <span className="ml-2 text-sm font-mono text-secondary-800">
                    {order.temporary_id}
                  </span>
                </div>

                {/* Order Date */}
                <div>
                  <span className="text-sm text-secondary-600">
                    วันที่สั่งซื้อ:
                  </span>
                  <span className="ml-2 text-sm">
                    {formatDateTime(order.order_date)}
                  </span>
                </div>

                {/* Guest Badge */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-secondary-600">
                    ประเภทลูกค้า:
                  </span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    👤 Guest User
                  </span>
                </div>

                {/* Special Instructions */}
                {order.special_instructions && (
                  <div>
                    <span className="text-sm text-secondary-600">
                      หมายเหตุพิเศษ:
                    </span>
                    <p className="mt-1 text-sm text-secondary-700">
                      {order.special_instructions}
                    </p>
                  </div>
                )}

                {/* Payment Information */}
                {order.payment_status && (
                  <div className="border-t pt-3 mt-3">
                    <h5 className="font-semibold text-secondary-700 mb-2">
                      ข้อมูลการชำระเงิน
                    </h5>
                    <div className="space-y-2">
                      {/* Payment Status */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-secondary-600">
                          สถานะการชำระ:
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.payment_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.payment_status === "completed"
                            ? "✅ ชำระแล้ว"
                            : order.payment_status === "pending"
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
                          {order.payment_method === "bank_transfer"
                            ? "🏦 โอนผ่านธนาคาร"
                            : order.payment_method === "qr_payment"
                            ? "📱 QR Payment"
                            : order.payment_method}
                        </span>
                      </div>

                      {/* Proof of Payment */}
                      {order.proof_of_payment && (
                        <div>
                          <span className="text-sm text-secondary-600 block mb-2">
                            หลักฐานการโอนเงิน:
                          </span>
                          <div className="border border-secondary-200 rounded-lg p-2 bg-white">
                            <img
                              src={order.proof_of_payment}
                              alt="หลักฐานการโอนเงิน"
                              className="w-full max-w-xs h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                window.open(
                                  order.proof_of_payment,
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
                      {order.payment_status === "pending" && (
                        <div className="mt-3 pt-2 border-t border-secondary-200">
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
                  </div>
                )}

                {/* Guest Order Actions */}
                <div className="border-t pt-3 mt-3">
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // TODO: Implement view tracking page
                        alert("ฟีเจอร์ดูหน้า Tracking จะพัฒนาในอนาคต");
                      }}
                      className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      📍 ดูหน้า Tracking
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement send notification
                        alert("ฟีเจอร์ส่งการแจ้งเตือนจะพัฒนาในอนาคต");
                      }}
                      className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      📱 ส่งการแจ้งเตือน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Panel */}
      {showStatusUpdate && (
        <div className="border-t bg-yellow-50 p-6">
          <h4 className="font-semibold text-secondary-700 mb-4">
            อัปเดทสถานะ Guest Order
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

export default AdminGuestOrders; 