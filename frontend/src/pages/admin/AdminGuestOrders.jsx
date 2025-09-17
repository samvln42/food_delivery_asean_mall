import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { notificationService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG, API_ENDPOINTS } from "../../config/api";
import { useNotificationContext } from "../../layouts/AdminLayout";
import { formatPrice } from "../../utils/formatPrice";

// Guest Order Details Modal Component
const GuestOrderDetailsModal = ({ order, isOpen, onClose, orderStatuses, formatDateTime }) => {
  if (!isOpen || !order) return null;

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = orderDetails.reduce((acc, detail) => {
    const restaurantId = detail.restaurant_id || detail.restaurant || 'unknown';
    const restaurantName = detail.restaurant_name || order.restaurant_name || 'ไม่ระบุร้าน';
    
    const existingGroup = acc.find(group => group.restaurant_id === restaurantId);
    
    if (existingGroup) {
      existingGroup.items.push(detail);
      existingGroup.subtotal += parseFloat(detail.subtotal || 0);
    } else {
      acc.push({
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        items: [detail],
        subtotal: parseFloat(detail.subtotal || 0)
      });
    }
    
    return acc;
  }, []);

  const isMultiRestaurant = orderDetailsByRestaurant.length > 1;
  const restaurantCount = orderDetailsByRestaurant.length;
  const subtotal = orderDetails.reduce((total, detail) => total + parseFloat(detail.subtotal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Enhanced Background overlay */}
        <div className="fixed inset-0 transition-all duration-300 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Enhanced Modal content */}
        <div className="inline-block w-full max-w-5xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent">
                  Guest Order #{order.guest_order_id}
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-sm text-gray-600 font-medium">
                    📅 {formatDateTime(order.order_date)}
                  </p>
                  <span className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 py-1 rounded-xl text-xs font-bold">
                    👤 Guest User
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 rounded-2xl hover:bg-red-50 transition-all duration-200 transform hover:scale-110 border border-gray-200 hover:border-red-200"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* รายการอาหาร */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🍽️ รายการอาหาร</h4>
              
              {isMultiRestaurant && orderDetailsByRestaurant.length > 0 ? (
                <div className="space-y-4">
                  {orderDetailsByRestaurant.map((restaurantGroup, groupIndex) => (
                    <div key={restaurantGroup.restaurant_id || groupIndex} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800">🏪 {restaurantGroup.restaurant_name}</h5>
                        <span className="text-sm font-semibold text-primary-600">
                          {formatPrice(restaurantGroup.subtotal)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(restaurantGroup.items || []).map((item, itemIndex) => (
                          <div key={item.guest_order_detail_id || itemIndex} className="flex justify-between text-sm">
                            <span>
                              {item.product_name} × {item.quantity}
                              {item.special_instructions && (
                                <span className="text-gray-500 ml-2">({item.special_instructions})</span>
                              )}
                            </span>
                            <span className="font-medium">{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {orderDetails.map((detail, index) => (
                    <div key={detail.guest_order_detail_id || index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>
                        {detail.product_name} × {detail.quantity}
                        {detail.special_instructions && (
                          <span className="text-gray-500 ml-2">({detail.special_instructions})</span>
                        )}
                      </span>
                      <span className="font-medium">{formatPrice(detail.subtotal || 0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ยอดรวม */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดรวม:</span>
                  <span className="text-primary-600">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>

            {/* ข้อมูลการจัดส่งและ Guest */}
            <div className="space-y-6">
              {/* ข้อมูลลูกค้า */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">👤 ข้อมูลลูกค้า</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">ชื่อ:</span>
                    <span className="ml-2 font-medium">{order.customer_name || "ไม่ระบุ"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">โทรศัพท์:</span>
                    <span className="ml-2 font-medium">{order.customer_phone || "ไม่ระบุ"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ที่อยู่จัดส่ง:</span>
                    <span className="mt-2 ml-2 text-sm">{order.delivery_address || "ไม่ระบุ"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Temporary ID:</span>
                    <span className="ml-2 font-mono text-sm bg-gray-200 px-2 py-1 rounded">{order.temporary_id}</span>
                  </div>
                </div>
              </div>

              {/* ข้อมูลการชำระเงิน */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">💳 ข้อมูลการชำระเงิน</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">สถานะ:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === "completed" ? "bg-green-100 text-green-800" :
                      order.payment_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {order.payment_status === "completed" ? "✅ ชำระแล้ว" :
                       order.payment_status === "pending" ? "⏳ รอดำเนินการ" : "❌ ไม่สำเร็จ"}
                    </span>
                  </div>
                  {order.payment_method && (
                    <div>
                      <span className="text-sm text-gray-600">วิธีการชำระ:</span>
                      <span className="ml-2 text-sm">
                        {order.payment_method === "bank_transfer" ? "🏦 โอนผ่านธนาคาร" :
                         order.payment_method === "qr_payment" ? "📱 QR Payment" :
                         order.payment_method}
                      </span>
                    </div>
                  )}
                  {order.proof_of_payment && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">หลักฐานการโอน:</span>
                      <img
                        src={order.proof_of_payment}
                        alt="หลักฐานการโอนเงิน"
                        className="w-full max-w-xs h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(order.proof_of_payment, "_blank")}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* สรุปยอดเงิน */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">💰 สรุปยอดเงิน</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ยอดรวมสินค้า:</span>
                    <span>฿{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ค่าจัดส่ง:</span>
                    <span>฿{parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>ยอดชำระทั้งหมด:</span>
                    <span className="text-primary-600">฿{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Guest Status Update Modal Component
const GuestStatusUpdateModal = ({ 
  order, 
  isOpen, 
  onClose, 
  orderStatuses, 
  onUpdateStatus, 
  isUpdating 
}) => {
  const [selectedStatus, setSelectedStatus] = useState(order?.current_status || '');

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.current_status || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleStatusUpdate = () => {
    if (selectedStatus === order.current_status) {
      alert("กรุณาเลือกสถานะใหม่");
      return;
    }
    onUpdateStatus(order.guest_order_id, selectedStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-all duration-300 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-md p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                อัปเดทสถานะ Guest
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="group p-2 rounded-xl hover:bg-red-50 transition-all duration-200 transform hover:scale-110 border border-gray-200 hover:border-red-200"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 mb-4 border border-orange-100">
              <p className="text-sm font-semibold text-orange-800">
                🛒 Guest Order #{order.guest_order_id}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Temporary ID: {order.temporary_id}
              </p>
            </div>
            
            <label className="block text-sm font-bold text-gray-700 mb-3">
              🎯 เลือกสถานะใหม่
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none p-4 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white transition-all font-medium cursor-pointer"
              >
                {orderStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="group flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-4 rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center space-x-2">
                <span className={isUpdating ? "" : "group-hover:rotate-180 transition-transform duration-300"}>
                  {isUpdating ? "⏳" : "✅"}
                </span>
                <span>{isUpdating ? "กำลังอัปเดท..." : "ยืนยัน"}</span>
              </span>
            </button>
            <button
              onClick={onClose}
              className="group flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 px-6 py-4 rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center space-x-2">
                <span className="group-hover:scale-110 transition-transform">❌</span>
                <span>ยกเลิก</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminGuestOrders = () => {
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;
  const { user } = useAuth();
  const { clearGuestOrdersBadge, updateGuestOrdersBadge, guestOrdersBadgeCount, fetchBadgeCounts } = useNotificationContext();
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

  // Note: Badge will only clear when viewing individual order details, not when entering the page
  // useEffect(() => {
  //   console.log("🧹 AdminGuestOrders mounted - clearing guest orders badge");
  //   clearGuestOrdersBadge();
  // }, [clearGuestOrdersBadge]);

  // Function to mark individual guest order as read
  const markGuestOrderAsRead = async (guestOrderId) => {
    try {
      // เรียก API เพื่อ mark notifications ที่เกี่ยวข้องกับ guest order นี้เป็น read
      const response = await notificationService.markOrderAsRead(guestOrderId, 'guest');
      
      // รีเฟรช badge counts จากฐานข้อมูลเพื่อความแม่นยำ
      if (response.data.marked_count > 0) {
        fetchBadgeCounts(); // รีเฟรชจากฐานข้อมูล
      }
    } catch (error) {
      console.error("❌ Error marking guest order notifications as read:", error);
      // Fallback: ลด badge แค่ 1 อัน
      if (guestOrdersBadgeCount > 0) {
        const newCount = Math.max(0, guestOrdersBadgeCount - 1);
        updateGuestOrdersBadge(newCount);
        console.log("🏷️ Guest orders badge decreased to:", newCount, "(fallback)");
      }
    }
  };

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

      // กรองเฉพาะคำสั่งซื้อที่มี email (ไม่แสดงคำสั่งซื้อที่แอดมินสร้าง)
      apiOrders = apiOrders.filter(order => 
        order.customer_email && order.customer_email.trim() !== ''
      );

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium text-lg">
            กำลังโหลดข้อมูล Guest Orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-orange-500/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent">
          จัดการ Guest Orders
        </h1>
              </div>
        <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600">
                    แสดง <span className="font-semibold text-orange-600">{filteredOrders.length}</span> จาก 
                    <span className="font-semibold text-gray-800"> {guestOrders.length}</span> รายการ
                  </p>
                </div>
              </div>
            </div>
          <button
            onClick={fetchGuestOrders}
              className="group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">รีเฟรช</span>
          </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
          {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหา Guest Orders, Temporary ID, ลูกค้า..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white transition-all text-sm font-medium placeholder-gray-400"
            />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
          </div>

            {/* Filter */}
            <div className="min-w-44">
              <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white transition-all text-sm font-medium cursor-pointer"
            >
                  <option value="all">🔍 ทุกสถานะ</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
          </div>

          {/* Sort */}
            <div className="min-w-44">
              <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="-order_date">📅 ล่าสุด</option>
                  <option value="order_date">📅 เก่าสุด</option>
                  <option value="-total_amount">💰 ราคาสูง</option>
                  <option value="total_amount">💰 ราคาต่ำ</option>
                  <option value="current_status">📊 ตามสถานะ</option>
            </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
          </div>
        </div>
      </div>

        {/* Beautiful Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {orderStatuses.map((status, index) => {
          const count = guestOrders.filter(
            (order) => order.current_status === status.value
          ).length;
            const percentage = guestOrders.length > 0 ? (count / guestOrders.length) * 100 : 0;
            const isActive = filter === status.value;
            
          return (
            <div
              key={status.value}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-4 text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isActive ? 'ring-2 ring-orange-400 bg-gradient-to-br from-orange-50 to-red-50 scale-105 shadow-xl' : 'hover:shadow-lg'
                }`}
                onClick={() => setFilter(filter === status.value ? 'all' : status.value)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                  status.value === 'pending' ? 'from-yellow-100 to-orange-100' :
                  status.value === 'paid' ? 'from-blue-100 to-cyan-100' :
                  status.value === 'preparing' ? 'from-orange-100 to-red-100' :
                  status.value === 'ready_for_pickup' ? 'from-purple-100 to-pink-100' :
                  status.value === 'delivering' ? 'from-indigo-100 to-blue-100' :
                  status.value === 'completed' ? 'from-green-100 to-emerald-100' :
                  'from-red-100 to-pink-100'
                }`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`text-3xl font-black mb-2 transition-all duration-300 ${
                    count > 0 ? 'text-gray-800 group-hover:scale-110' : 'text-gray-300'
                  } ${isActive ? 'text-orange-600' : ''}`}>
                    {count}
                </div>
                  <div className={`text-xs font-semibold mb-2 transition-colors ${
                    isActive ? 'text-orange-700' : 'text-gray-600 group-hover:text-gray-800'
                  }`}>
                    {status.label}
              </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        status.value === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        status.value === 'paid' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                        status.value === 'preparing' ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                        status.value === 'ready_for_pickup' ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                        status.value === 'delivering' ? 'bg-gradient-to-r from-indigo-400 to-blue-400' :
                        status.value === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        'bg-gradient-to-r from-red-400 to-pink-400'
                      }`}
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    ></div>
                  </div>
                  
                  <div className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
                    isActive ? 'bg-orange-500 text-white' : status.color
                  }`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                )}
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
                onMarkAsRead={markGuestOrderAsRead}
                isUpdating={updatingOrders.has(order.guest_order_id)}
                getStatusColor={getStatusColor}
                formatDateTime={formatDateTime}
              />
            ))}
        </div>
      ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-6xl mb-4 opacity-20">👤</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || filter !== "all" ? "ไม่พบ Guest Orders ที่ตรงกับเงื่อนไข" : "ไม่มี Guest Orders"}
          </h2>
            <p className="text-gray-500">
              {searchTerm || filter !== "all"
                ? "ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง"
              : "Guest Orders จะปรากฏที่นี่เมื่อมีลูกค้าสั่งซื้อโดยไม่ล็อกอิน"}
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
          </button>

          {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pageNum === page
                    ? "bg-orange-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
          </button>
        </div>
      )}
      </div>
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
  onMarkAsRead, // Add this prop
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleViewDetails = () => {
    setShowDetailsModal(true);
    // Mark as read when viewing details
    if (onMarkAsRead) {
      onMarkAsRead(order.guest_order_id);
    }
  };

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = orderDetails.reduce((acc, detail) => {
    const restaurantId = detail.restaurant_id || detail.restaurant || 'unknown';
    const restaurantName = detail.restaurant_name || order.restaurant_name || 'ไม่ระบุร้าน';
    
    const existingGroup = acc.find(group => group.restaurant_id === restaurantId);
    
    if (existingGroup) {
      existingGroup.items.push(detail);
      existingGroup.subtotal += parseFloat(detail.subtotal || 0);
    } else {
      acc.push({
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        items: [detail],
        subtotal: parseFloat(detail.subtotal || 0)
      });
    }
    
    return acc;
  }, []);

  const isMultiRestaurant = orderDetailsByRestaurant.length > 1;
  const restaurantCount = orderDetailsByRestaurant.length;

  return (
    <>
    <div 
      id={`guest-order-${order.guest_order_id}`}
        className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
          order.guest_order_id === order.highlightOrderId ? 'ring-2 ring-orange-400 ring-opacity-60 shadow-2xl' : ''
        }`}
      >
        {/* Decorative gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Main Card Content */}
        <div className="relative z-10 p-6">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {order.guest_order_id}
              </h3>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all group-hover:shadow-md ${getStatusColor(order.current_status)}`}>
                {orderStatuses.find(s => s.value === order.current_status)?.label || order.current_status}
              </span>
              <span className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                👤 Guest
              </span>
              {isMultiRestaurant && (
                <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                  🏪 {restaurantCount} ร้าน
                </span>
              )}
          </div>
          <div className="text-right">
              <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {formatPrice(order.total_amount || 0)}
            </p>
              <p className="text-xs text-gray-500 font-medium">{formatDateTime(order.order_date)}</p>
          </div>
        </div>

          {/* Enhanced Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">👤 ลูกค้า</p>
              <p className="font-bold text-gray-900 truncate text-sm">{order.customer_name || "ไม่ระบุ"}</p>
              <p className="text-xs text-gray-500">{order.customer_phone || "ไม่ระบุ"}</p>
          </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">🏪 ร้านอาหาร</p>
            {isMultiRestaurant ? (
                <p className="font-bold text-blue-600 text-sm">หลายร้าน ({restaurantCount})</p>
              ) : (
                <p className="font-bold text-gray-900 text-sm truncate">{order.restaurant_name || "ไม่ระบุ"}</p>
            )}
          </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">📍 ที่อยู่จัดส่ง</p>
              <p className="font-bold text-gray-900 text-sm truncate">{order.delivery_address || "ไม่ระบุ"}</p>
          </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">📦 จำนวนรายการ</p>
              <p className="font-bold text-gray-900 text-sm">{orderDetails.length} รายการ</p>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">🔖 Temp ID</p>
              <p className="font-mono text-xs bg-gray-200 px-2 py-1 rounded truncate">{order.temporary_id}</p>
          </div>
        </div>

          {/* Enhanced Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
              onClick={handleViewDetails}
              className="group flex-1 min-w-0 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
          >
              <span className="flex items-center justify-center space-x-2">
                <span className="group-hover:scale-110 transition-transform">📋</span>
                <span>รายละเอียด</span>
              </span>
          </button>
          <button
              onClick={() => setShowStatusModal(true)}
            disabled={isUpdating}
              className={`group flex-1 min-w-0 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform shadow-sm ${
              isUpdating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white hover:scale-105 hover:shadow-md"
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isUpdating ? "อัปเดท..." : "เปลี่ยนสถานะ"}</span>
              </span>
          </button>
          {order.current_status !== "cancelled" && (
            <button
              onClick={() => onUpdateStatus(order.guest_order_id, "cancelled")}
              disabled={isUpdating}
                className="group bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
                <span className="flex items-center justify-center space-x-2">
                  <span className="group-hover:scale-110 transition-transform">❌</span>
                  <span>ยกเลิก</span>
                </span>
            </button>
          )}
        </div>
                          </div>
                        </div>

      {/* Modals */}
      <GuestOrderDetailsModal
        order={order}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        orderStatuses={orderStatuses}
        formatDateTime={formatDateTime}
      />

      <GuestStatusUpdateModal
        order={order}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        orderStatuses={orderStatuses}
        onUpdateStatus={onUpdateStatus}
        isUpdating={isUpdating}
      />
    </>
  );
};



export default AdminGuestOrders; 