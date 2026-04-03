import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { notificationService, orderService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG, API_ENDPOINTS } from "../../config/api";
import { useNotificationContext } from "../../layouts/AdminLayout";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";
import { formatPrice } from "../../utils/formatPrice";
import {
  LuMapPin, LuUser, LuStore, LuPackage, LuTag, LuFileText, LuX, LuTrash2,
  LuCalendar, LuCreditCard, LuReceipt, LuUtensilsCrossed, LuRefreshCw, LuSearch,
  LuMap
} from "react-icons/lu";

// Modal Component สำหรับแสดงรายละเอียดคำสั่งซื้อ
const OrderDetailsModal = ({ order, isOpen, onClose, orderStatuses, formatDateTime, onDelete }) => {
  if (!isOpen || !order) return null;

  const { translate, currentLanguage } = useLanguage();

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant = order.is_multi_restaurant || orderDetailsByRestaurant.length > 1;
  const restaurantCount = order.restaurant_count || orderDetailsByRestaurant.length;
  const subtotal = orderDetails.reduce((total, detail) => total + parseFloat(detail.subtotal || 0), 0);

  const statusLabel = orderStatuses.find(s => s.value === (order.current_status || order.status))?.label || (order.current_status || order.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl max-h-[90vh] my-8 flex flex-col overflow-hidden bg-white shadow-xl rounded-lg border border-gray-200">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900">#{order.order_id}</h3>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{statusLabel}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <LuCalendar className="w-3.5 h-3.5" />
                {formatDateTime(order.order_date)}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  if (window.confirm(`ยืนยันการลบออเดอร์ #${order.order_id}?\n\nการกระทำนี้ไม่สามารถยกเลิกได้`)) {
                    onDelete(order.order_id);
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                title="ลบ"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="ปิด"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{translate('order.total_amount')}</span>
                <span className="text-lg font-semibold text-gray-900">{formatPrice(order.total_amount)}</span>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{translate('admin.customer_info')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <LuUser className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{order.customer_name || "—"}</p>
                      <p className="text-gray-500">{order.customer_phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <LuMapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {order.delivery_address ? (
                        <p className="text-gray-700 whitespace-pre-line">
                          {order.delivery_address
                            .split("\n")
                            .filter((line) => !/ตำแหน่ง\s*:\s*-?\d+\.?\d*,\s*-?\d+\.?\d*/.test(line.trim()))
                            .join("\n")
                            .trim() || "—"}
                        </p>
                      ) : (
                        <p className="text-gray-500">—</p>
                      )}
                      {order.delivery_latitude && order.delivery_longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline mt-1 inline-flex items-center gap-1"
                        >
                          <LuMap className="w-3 h-3" />
                          {translate('order.delivery_address') || 'ที่อยู่จัดส่ง'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <LuUtensilsCrossed className="w-3.5 h-3.5" />
                  {translate('order.items')}
                </h4>
              
              {isMultiRestaurant && orderDetailsByRestaurant.length > 0 ? (
                <div className="space-y-4">
                  {orderDetailsByRestaurant.map((restaurantGroup, groupIndex) => (
                    <div key={restaurantGroup.restaurant_id || groupIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                          <LuStore className="w-3.5 h-3.5 text-gray-500" />
                          {restaurantGroup.restaurant_name}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{formatPrice(restaurantGroup.subtotal)}</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {(restaurantGroup.items || []).map((item, itemIndex) => (
                          <div key={item.order_detail_id || itemIndex} className="px-4 py-3 flex justify-between text-sm">
                            <span>{getTranslatedName(item, currentLanguage, item.product_name)} × {item.quantity}</span>
                            <span className="font-medium text-gray-800 ml-2">{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {orderDetails.map((detail, index) => (
                    <div key={detail.order_detail_id || index} className="px-4 py-3 flex justify-between text-sm">
                      <span>{getTranslatedName(detail, currentLanguage, detail.product_name)} × {detail.quantity}</span>
                      <span className="font-medium text-gray-800 ml-2">{formatPrice(detail.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{translate('order.subtotal')}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{translate('order.delivery_fee')}</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2">
                  <span>{translate('order.total_amount')}</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <LuCreditCard className="w-3.5 h-3.5" />
                  {translate('admin.payment_info')}
                </h4>
                {order.payment ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                        order.payment.status === "completed" ? "bg-gray-100 text-gray-800" :
                        order.payment.status === "pending" ? "bg-gray-100 text-gray-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {order.payment.status === "completed" ? translate('order.status.paid') :
                         order.payment.status === "pending" ? translate('admin.payment_pending') : translate('admin.payment_failed')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {order.payment.payment_method === "bank_transfer" ? translate('cart.bank_transfer') :
                         order.payment.payment_method === "qr_payment" ? translate('cart.qr_payment') :
                         order.payment.payment_method}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{formatPrice(order.payment.amount_paid)}</span>
                    </div>
                    {order.payment.proof_of_payment_display_url && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => window.open(order.payment.proof_of_payment_display_url, "_blank")}
                          className="block"
                        >
                          <img
                            src={order.payment.proof_of_payment_display_url}
                            alt="หลักฐานการโอน"
                            className="max-w-full max-h-48 rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{translate('admin.no_payment_info')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ 
  order, 
  isOpen, 
  onClose, 
  orderStatuses, 
  onUpdateStatus, 
  isUpdating 
}) => {
  const [selectedStatus, setSelectedStatus] = useState(order?.current_status || order?.status || '');
  const { translate } = useLanguage();

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.current_status || order.status || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleStatusUpdate = () => {
    if (selectedStatus === (order.current_status || order.status)) {
      alert(translate('admin.please_select_new_status'));
      return;
    }
    onUpdateStatus(order.order_id, selectedStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                <LuRefreshCw className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {translate('admin.update_status_title')}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-800">
                {translate('order.order_number', { id: order.order_id })}
              </p>
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate('admin.select_new_status')}
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 font-medium cursor-pointer text-sm"
              >
                {orderStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <LuRefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? translate('admin.saving') : translate('common.confirm')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LuX className="w-4 h-4" />
              {translate('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;
  const { user } = useAuth();
  const { clearOrdersBadge, updateOrdersBadge, ordersBadgeCount, fetchBadgeCounts } = useNotificationContext();
  const { translate, currentLanguage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("current_status");
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [order, setOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [unreadOrderIds, setUnreadOrderIds] = useState(new Set()); // เก็บ order IDs ที่ยังไม่ได้อ่าน

  // Pagination
  const pageSize = 5; // แสดง 10 รายการต่อหน้า (ปรับได้)
  const [page, setPage] = useState(1);

  // สถานะที่ใช้ได้ (ตรงกับ Backend)
  const orderStatuses = [
    {
      value: "pending",
      label: translate('order.status.pending'),
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "paid",
      label: translate('order.status.paid'),
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "preparing",
      label: translate('order.status.preparing'),
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "ready_for_pickup",
      label: translate('order.status.ready_for_pickup'),
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "delivering",
      label: translate('order.status.delivering'),
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "completed",
      label: translate('order.status.completed'),
      color: "bg-green-100 text-green-800",
    },
    { value: "cancelled", label: translate('order.status.cancelled'), color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    fetchOrders();
  }, [sortBy]);

  // Fetch unread order IDs
  const fetchUnreadOrderIds = async () => {
    try {
      const response = await notificationService.getAll({
        is_read: "false",
        limit: 100,
      });
      const unreadNotifs = (response.data.results || response.data).filter((n) => !n.is_read);
      
      // สร้าง Set ของ order IDs ที่ยังไม่ได้อ่าน (เฉพาะ regular orders)
      const unreadIds = new Set();
      unreadNotifs.forEach(notif => {
        if (notif.type === 'order' && notif.related_order) {
          unreadIds.add(notif.related_order);
        }
      });
      
      setUnreadOrderIds(unreadIds);
      console.log("📬 Found", unreadIds.size, "unread orders");
    } catch (error) {
      console.error("❌ Error fetching unread order IDs:", error);
    }
  };

  useEffect(() => {
    fetchUnreadOrderIds();
  }, []);

  // Note: Badge will only clear when viewing individual order details, not when entering the page
  // useEffect(() => {
  //   console.log("🧹 AdminOrders mounted - clearing orders badge");
  //   clearOrdersBadge();
  // }, [clearOrdersBadge]);

  // Function to mark individual order as read
  const markOrderAsRead = async (orderId) => {
    try {
      // เรียก API เพื่อ mark notifications ที่เกี่ยวข้องกับออเดอร์นี้เป็น read
      const response = await notificationService.markOrderAsRead(orderId, 'regular');
      
      // อัปเดต unreadOrderIds ทันที
      setUnreadOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      
      // รีเฟรช badge counts จากฐานข้อมูลเพื่อความแม่นยำ
      if (response.data.marked_count > 0) {
        fetchBadgeCounts(); // รีเฟรชจากฐานข้อมูล
      }
    } catch (error) {
      console.error("❌ Error marking order notifications as read:", error);
      // Fallback: ลด badge แค่ 1 อัน
      if (ordersBadgeCount > 0) {
        const newCount = Math.max(0, ordersBadgeCount - 1);
        updateOrdersBadge(newCount);
        console.log("🏷️ Orders badge decreased to:", newCount, "(fallback)");
      }
    }
  };

  // Function to delete order
  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await orderService.delete(orderId);
      
      if (response.data.success) {
        return { success: true, message: response.data.message || `ลบออเดอร์ #${orderId} เรียบร้อยแล้ว` };
      }
    } catch (error) {
      console.error("❌ Error deleting order:", error);
      if (error.response?.status === 403) {
        return { success: false, message: "ไม่มีสิทธิ์ลบออเดอร์ (เฉพาะแอดมินเท่านั้น)" };
      } else {
        return { success: false, message: "เกิดข้อผิดพลาดในการลบออเดอร์: " + (error.response?.data?.error || error.message) };
      }
    }
  };

  // Wrapper function to handle delete and close modal
  const handleDeleteOrderWithModalClose = async (orderId) => {
    try {
      const result = await handleDeleteOrder(orderId);
      if (result.success) {
        alert(result.message);
        setShowDetailsModal(false);
        setOrder(null);
        await fetchOrders();
        fetchBadgeCounts();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert("ไม่มีสิทธิ์ลบออเดอร์ (เฉพาะแอดมินเท่านั้น)");
      } else {
        alert("เกิดข้อผิดพลาดในการลบออเดอร์: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // Function to handle viewing order details
  const handleViewDetails = (selectedOrder) => {
    setOrder(selectedOrder);
    setShowDetailsModal(true);
    markOrderAsRead(selectedOrder.order_id);
  };

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
    const locale = currentLanguage === 'th' ? 'th-TH-u-ca-gregory' : currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
    return date.toLocaleString(locale, {
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
            {translate('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <LuUser className="w-5 h-5 text-gray-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {translate('admin.orders')}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <p className="text-sm text-gray-600">
                    {translate('admin.showing_of_total', { showing: filteredOrders.length, total: orders.length })}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LuRefreshCw className="w-4 h-4" />
              <span className="font-medium">{translate('admin.refresh')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translate('admin.orders_search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm placeholder-gray-400"
                />
              </div>
            </div>
            <div className="min-w-44">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm cursor-pointer"
              >
                <option value="all">{translate('admin.all_statuses')}</option>
                {orderStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm cursor-pointer"
              >
                <option value="-order_date">{translate('admin.sort.latest')}</option>
                <option value="order_date">{translate('admin.sort.oldest')}</option>
                <option value="-total_amount">{translate('admin.sort.price_high')}</option>
                <option value="total_amount">{translate('admin.sort.price_low')}</option>
                <option value="current_status">{translate('admin.sort.by_status')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {orderStatuses.map((status) => {
            const count = orders.filter(
              (order) => (order.current_status || order.status) === status.value
            ).length;
            const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
            const isActive = filter === status.value;
            return (
              <div
                key={status.value}
                className={`bg-white rounded-lg border p-4 text-center cursor-pointer transition-shadow ${
                  isActive ? 'ring-2 ring-gray-900 shadow-md' : 'border-gray-200 hover:shadow-sm'
                }`}
                onClick={() => setFilter(filter === status.value ? 'all' : status.value)}
              >
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {count}
                </div>
                <div className="text-xs font-medium text-gray-600 mb-2">
                  {status.label}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                  <div 
                    className="h-1 rounded-full bg-gray-400 transition-all"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-500">
                  {percentage.toFixed(1)}%
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
                onMarkAsRead={markOrderAsRead}
                onDeleteOrder={handleDeleteOrderWithModalClose}
                onViewDetails={handleViewDetails}
                onChangeStatus={(order) => {
                  setOrder(order);
                  setShowStatusModal(true);
                }}
                isUpdating={updatingOrders.has(order.order_id)}
                getStatusColor={getStatusColor}
                formatDateTime={formatDateTime}
                hasUnreadNotification={unreadOrderIds.has(order.order_id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <LuUser className="w-16 h-16 text-gray-300 mb-4 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || filter !== "all" ? translate('order.no_history') : translate('order.no_history')}
            </h2>
            <p className="text-gray-500">
              {searchTerm || filter !== "all"
                ? translate('admin.orders_empty_search_message')
                : translate('admin.orders_empty_message')}
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
                    <span key={`e${idx}`} className="px-3 py-2 text-gray-400">
                      …
                    </span>
                  );
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === p
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              });
            })()}

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

        {/* Main Modals */}
        <OrderDetailsModal
          order={order}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setOrder(null);
          }}
          orderStatuses={orderStatuses}
          formatDateTime={formatDateTime}
          onDelete={handleDeleteOrderWithModalClose}
        />

        <StatusUpdateModal
          order={order}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          orderStatuses={orderStatuses}
          onUpdateStatus={updateOrderStatus}
          isUpdating={updatingOrders.has(order?.order_id)}
        />
      </div>
    </div>
  );
};

// Compact Order Card Component
const OrderCard = ({
  order,
  orderStatuses,
  onUpdateStatus,
  isUpdating,
  getStatusColor,
  formatDateTime,
  onMarkAsRead,
  onDeleteOrder,
  onViewDetails,
  onChangeStatus,
  hasUnreadNotification = false,
}) => {
  const { translate } = useLanguage();

  const handleViewDetailsClick = () => {
    onViewDetails(order);
    if (onMarkAsRead) {
      onMarkAsRead(order.order_id);
    }
  };

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const isMultiRestaurant = order.is_multi_restaurant || (order.order_details_by_restaurant && order.order_details_by_restaurant.length > 1);
  const restaurantCount = order.restaurant_count || (order.order_details_by_restaurant ? order.order_details_by_restaurant.length : 1);

  return (
    <>
      <div 
        id={`order-${order.order_id}`}
        className={`group relative rounded-lg border transition-shadow overflow-hidden ${
          order.order_id === order.highlightOrderId ? 'ring-2 ring-gray-900 ring-offset-1' : ''
        } ${
          hasUnreadNotification 
            ? 'bg-gray-50 border-gray-300' 
            : 'bg-white border-gray-200 hover:shadow-md'
        }`}
      >
        {hasUnreadNotification && (
          <div className="absolute top-3 right-3 z-20">
            <div className="flex items-center gap-1.5 bg-gray-900 text-white px-2.5 py-1 rounded text-xs font-medium">
              {translate('common.new') || 'ใหม่'}
            </div>
          </div>
        )}
        
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <LuUser className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {order.order_id}
                </h3>
              </div>
              <span className={`px-3 py-1.5 rounded text-sm font-medium ${getStatusColor(order.current_status || order.status)}`}>
                {orderStatuses.find(s => s.value === (order.current_status || order.status))?.label || order.current_status || order.status}
              </span>
              {isMultiRestaurant && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <LuStore className="w-3 h-3" />
                  {restaurantCount} ร้าน
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-900">
                {formatPrice(order.total_amount || 0)}
              </p>
              <p className="text-xs text-gray-500">{formatDateTime(order.order_date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                <LuUser className="w-3 h-3" />
                {translate('admin.customer')}
              </p>
              <p className="font-bold text-gray-900 truncate text-sm">{order.customer_name || "ไม่ระบุ"}</p>
              <p className="text-xs text-gray-500">{order.customer_phone || "ไม่ระบุ"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                <LuStore className="w-3 h-3" />
                {translate('common.restaurant')}
              </p>
              {isMultiRestaurant ? (
                <p className="font-bold text-gray-800 text-sm">หลายร้าน ({restaurantCount})</p>
              ) : (
                <Link 
                  to={`/restaurants/${order.restaurant}`}
                  className="font-bold text-gray-900 hover:text-primary-600 text-sm truncate block"
                >
                  {order.restaurant_name || "ไม่ระบุ"}
                </Link>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                <LuMapPin className="w-3 h-3" />
                {translate('order.delivery_address')}
              </p>
              <div className="text-gray-900 text-sm">
                {order.delivery_address ? (
                  (() => {
                    const displayAddress = order.delivery_address
                      .split("\n")
                      .filter((line) => !/ตำแหน่ง\s*:\s*-?\d+\.?\d*,\s*-?\d+\.?\d*/.test(line.trim()))
                      .join("\n")
                      .trim();
                    return displayAddress ? (
                      <p className="text-xs text-gray-700 whitespace-pre-line line-clamp-2">{displayAddress}</p>
                    ) : null;
                  })()
                ) : (
                  <p className="font-bold">ไม่ระบุ</p>
                )}
              </div>
              {order.delivery_latitude && order.delivery_longitude && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <a
                    href={`https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <LuMap className="w-3 h-3" />
                    {translate('order.delivery_address') || 'ที่อยู่จัดส่ง'}
                  </a>
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                <LuPackage className="w-3 h-3" />
                {translate('order.items')}
              </p>
              <p className="font-bold text-gray-900 text-sm">{orderDetails.length} {translate('order.items_count')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                <LuCreditCard className="w-3 h-3" />
                {translate('order.payment_method')}
              </p>
              {order.payment ? (
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                  order.payment.status === "completed" ? "bg-gray-100 text-gray-800" :
                  order.payment.status === "pending" ? "bg-gray-100 text-gray-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {order.payment.status === "completed" ? translate('order.status.paid') :
                   order.payment.status === "pending" ? translate('admin.payment_pending_short') : translate('admin.payment_failed')}
                </span>
              ) : (
                <span className="text-xs text-gray-500 font-medium">{translate('common.no_data')}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleViewDetailsClick}
              className="flex-1 min-w-0 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LuFileText className="w-4 h-4" />
              {translate('common.details')}
            </button>
            <button
              onClick={() => onChangeStatus(order)}
              disabled={isUpdating}
              className={`flex-1 min-w-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isUpdating
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
              }`}
            >
              <LuRefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? translate('admin.saving') : translate('admin.change_status')}
            </button>
            {(order.current_status || order.status) !== "cancelled" && (
              <button
                onClick={() => onUpdateStatus(order.order_id, "cancelled")}
                disabled={isUpdating}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LuX className="w-4 h-4" />
                {translate('common.cancel')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrders;