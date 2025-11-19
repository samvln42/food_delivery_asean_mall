import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { notificationService, orderService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG, API_ENDPOINTS } from "../../config/api";
import { useNotificationContext } from "../../layouts/AdminLayout";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";
import { formatPrice } from "../../utils/formatPrice";
import { FaRegEye } from "react-icons/fa";
import { FaUserAlt } from "react-icons/fa";
import { IoStorefrontSharp } from "react-icons/io5";
import { FaBoxOpen } from "react-icons/fa";
import { GiSandsOfTime } from "react-icons/gi";
import { FaRegCreditCard } from "react-icons/fa6";
import { LuMapPin } from "react-icons/lu";

// Modal Component สำหรับแสดงรายละเอียดคำสั่งซื้อ
const OrderDetailsModal = ({ order, isOpen, onClose, orderStatuses, formatDateTime, onDelete }) => {
  if (!isOpen || !order) return null;

  const { translate, currentLanguage } = useLanguage();

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant = order.is_multi_restaurant || orderDetailsByRestaurant.length > 1;
  const restaurantCount = order.restaurant_count || orderDetailsByRestaurant.length;
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  {translate('order.order_number', { id: order.order_id })}
                </h3>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  📅 {formatDateTime(order.order_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* ปุ่มลบออเดอร์ */}
              <button
                onClick={() => {
                  if (window.confirm(`ยืนยันการลบออเดอร์ #${order.order_id}?\n\nการกระทำนี้ไม่สามารถยกเลิกได้และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง`)) {
                    onDelete(order.order_id);
                  }
                }}
                className="group p-3 rounded-2xl hover:bg-red-50 transition-all duration-200 transform hover:scale-110 border border-red-200 hover:border-red-400 bg-red-50/50"
                title="ลบออเดอร์"
              >
                <svg className="w-6 h-6 text-red-500 group-hover:text-red-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              {/* ปุ่มปิด */}
              <button
                onClick={onClose}
                className="group p-3 rounded-2xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-110 border border-gray-200 hover:border-gray-300"
                title="ปิด"
              >
                <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* รายการอาหาร */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">{translate('order.items')}</h4>
              
              {isMultiRestaurant && orderDetailsByRestaurant.length > 0 ? (
                <div className="space-y-4">
                  {orderDetailsByRestaurant.map((restaurantGroup, groupIndex) => (
                    <div key={restaurantGroup.restaurant_id || groupIndex} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800"><IoStorefrontSharp /> {restaurantGroup.restaurant_name}</h5>
                        <span className="text-sm font-semibold text-primary-600">
                          {formatPrice(restaurantGroup.subtotal)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(restaurantGroup.items || []).map((item, itemIndex) => (
                          <div key={item.order_detail_id || itemIndex} className="flex justify-between text-sm">
                            <span>{getTranslatedName(item, currentLanguage, item.product_name)} × {item.quantity}</span>
                            <span>{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {orderDetails.map((detail, index) => (
                    <div key={detail.order_detail_id || index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>{getTranslatedName(detail, currentLanguage, detail.product_name)} × {detail.quantity}</span>
                      <span className="font-medium">{formatPrice(detail.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ยอดรวม */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span>{translate('order.subtotal')}:</span>
                  <span className="text-primary-600">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>

            {/* ข้อมูลการจัดส่งและการชำระเงิน */}
            <div className="space-y-6">
              {/* ข้อมูลลูกค้า */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{translate('admin.customer_info')}</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">{translate('contact.name')}:</span>
                    <span className="ml-2">{order.customer_name || "ไม่ระบุ"}</span>
                  </div>
                    <div>
                      <span className="text-sm text-gray-600">{translate('auth.phone')}:</span>
                      <span className="ml-2">{order.customer_phone || "ไม่ระบุ"}</span>
                    </div>
                  <div>
                    <span className="text-sm text-gray-600">{translate('order.delivery_address')}:</span>
                    <div className="mt-1 text-sm">
                      {order.delivery_address ? (
                        (() => {
                          const addressLines = order.delivery_address.split('\n');
                          const detailAddress = addressLines.slice(1).join('\n');
                          return (
                            <>
                              {detailAddress && (
                                <div className="mt-1 text-gray-600">
                                  <p className="whitespace-pre-line">{detailAddress}</p>
                                </div>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <p>ไม่ระบุ</p>
                      )}
                    </div>
                    {order.delivery_latitude && order.delivery_longitude && (
                      <div className="mt-2">
                        <a
                          href={`https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer inline-flex items-center gap-1"
                        >
                          <LuMapPin className="w-4 h-4" /> {order.delivery_latitude}, {order.delivery_longitude}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ข้อมูลการชำระเงิน */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{translate('admin.payment_info')}</h4>
                {order.payment ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{translate('common.status')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.payment.status === "completed" ? "bg-green-100 text-green-800" :
                        order.payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {order.payment.status === "completed" ? `${translate('order.status.paid')}` :
                         order.payment.status === "pending" ? ` ${translate('admin.payment_pending')}` : `❌ ${translate('admin.payment_failed')}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{translate('order.payment_method')}:</span>
                      <span className="ml-2 text-sm">
                        {order.payment.payment_method === "bank_transfer" ? `🏦 ${translate('cart.bank_transfer')}` :
                         order.payment.payment_method === "qr_payment" ? `📱 ${translate('cart.qr_payment')}` :
                         order.payment.payment_method}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{translate('common.amount')}:</span>
                      <span className="ml-2 font-semibold text-primary-600">
                        {formatPrice(order.payment.amount_paid)}
                      </span>
                    </div>
                    {order.payment.proof_of_payment_display_url && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">{translate('cart.proof_of_payment')}:</span>
                        <img
                          src={order.payment.proof_of_payment_display_url}
                          alt="หลักฐานการโอนเงิน"
                          className="w-full max-w-xs h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(order.payment.proof_of_payment_display_url, "_blank")}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2 opacity-30">💳</div>
                    <p className="text-gray-500 text-sm">{translate('admin.no_payment_info')}</p>
                  </div>
                )}
              </div>

              {/* สรุปยอดเงิน */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{translate('admin.summary')}</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{translate('order.subtotal')}:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{translate('order.delivery_fee')}:</span>
                    <span>{formatPrice(order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>{translate('order.total_amount')}:</span>
                    <span className="text-primary-600">{formatPrice(order.total_amount)}</span>
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
        <div className="fixed inset-0 transition-all duration-300 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-md p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {translate('admin.update_status_title')}
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
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-4 border border-blue-100">
              <p className="text-sm font-semibold text-blue-800">
                🏷️ {translate('order.order_number', { id: order.order_id })}
              </p>
            </div>
            
            <label className="block text-sm font-bold text-gray-700 mb-3">
              🎯 {translate('admin.select_new_status')}
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none p-4 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all font-medium cursor-pointer"
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
              className="group flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center space-x-2">
                <span className={isUpdating ? "" : "group-hover:rotate-180 transition-transform duration-300"}>
                  {isUpdating ? "⏳" : "✅"}
                </span>
                <span>{isUpdating ? translate('admin.saving') : translate('common.confirm')}</span>
              </span>
            </button>
            <button
              onClick={onClose}
              className="group flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 px-6 py-4 rounded-2xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center space-x-2">
                <span className="group-hover:scale-110 transition-transform">❌</span>
                <span>{translate('common.cancel')}</span>
              </span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  {translate('admin.orders')}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600">
                    {translate('admin.showing_of_total', { showing: filteredOrders.length, total: orders.length })}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">{translate('admin.refresh')}</span>
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
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translate('admin.orders_search_placeholder')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all text-sm font-medium placeholder-gray-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            </div>

            {/* Filter */}
            <div className="min-w-44">
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="all">🔍 {translate('admin.all_statuses')}</option>
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
                  className="w-full appearance-none px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="-order_date">📅 {translate('admin.sort.latest')}</option>
                  <option value="order_date">📅 {translate('admin.sort.oldest')}</option>
                  <option value="-total_amount">💰 {translate('admin.sort.price_high')}</option>
                  <option value="total_amount">💰 {translate('admin.sort.price_low')}</option>
                  <option value="current_status">📊 {translate('admin.sort.by_status')}</option>
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
            const count = orders.filter(
              (order) => (order.current_status || order.status) === status.value
            ).length;
            const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
            const isActive = filter === status.value;
            
            return (
              <div
                key={status.value}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-4 text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isActive ? 'ring-2 ring-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-xl' : 'hover:shadow-lg'
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
                  } ${isActive ? 'text-blue-600' : ''}`}>
                    {count}
                  </div>
                  <div className={`text-xs font-semibold mb-2 transition-colors ${
                    isActive ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-800'
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
                    isActive ? 'bg-blue-500 text-white' : status.color
                  }`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
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
            <div className="text-6xl mb-4 opacity-20">📋</div>
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
                        ? "bg-primary-600 text-white"
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
        className={`group relative rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
          order.order_id === order.highlightOrderId ? 'ring-2 ring-blue-400 ring-opacity-60 shadow-2xl' : ''
        } ${
          hasUnreadNotification 
            ? 'bg-gradient-to-r from-orange-50 via-white to-orange-50 border-2 border-orange-300 shadow-orange-200' 
            : 'bg-white/90 backdrop-blur-sm border border-white/20'
        }`}
      >
        {/* Unread indicator badge */}
        {hasUnreadNotification && (
          <div className="absolute top-3 right-3 z-20">
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              {translate('common.new') || 'ใหม่'}
            </div>
          </div>
        )}
        
        {/* Decorative gradient border */}
        <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          hasUnreadNotification 
            ? 'bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 opacity-30 group-hover:opacity-50' 
            : 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100'
        }`}></div>
        
        {/* Main Card Content */}
        <div className="relative z-10 p-6">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">#</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {order.order_id}
                </h3>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all group-hover:shadow-md ${getStatusColor(order.current_status || order.status)}`}>
                {orderStatuses.find(s => s.value === (order.current_status || order.status))?.label || order.current_status || order.status}
              </span>
              {isMultiRestaurant && (
                <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                  🏪 {restaurantCount} {translate('common.restaurant')}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {formatPrice(order.total_amount)}
              </p>
              <p className="text-xs text-gray-500 font-medium">{formatDateTime(order.order_date)}</p>
            </div>
          </div>

          {/* Enhanced Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium"><FaUserAlt className="w-4 h-4 text-gray-500 inline-block mr-1" /> {translate('admin.customer')}</p>
              <p className="font-bold text-gray-900 truncate text-sm">{order.customer_name || "ไม่ระบุ"}</p>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium"><IoStorefrontSharp className="w-4 h-4 text-gray-500 inline-block mr-1" /> {translate('common.restaurant')}</p>
              {isMultiRestaurant ? (
                <p className="font-bold text-blue-600 text-sm">{translate('order.from_multiple_restaurants', { count: restaurantCount })}</p>
              ) : (
                <Link 
                  to={`/restaurants/${order.restaurant}`}
                  className="font-bold text-primary-600 hover:text-primary-700 text-sm truncate block transition-colors"
                >
                  {order.restaurant_name || "ไม่ระบุ"}
                </Link>
              )}
            </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium"><FaBoxOpen className="w-4 h-4 text-gray-500 inline-block mr-1" /> {translate('order.items')}</p>
              <p className="font-bold text-gray-900 text-sm">{orderDetails.length} {translate('order.items_count')}</p>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium"><FaRegCreditCard className="w-4 h-4 text-gray-500 inline-block mr-1" /> {translate('order.payment_method')}</p>
              {order.payment ? (
                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold shadow-sm ${
                  order.payment.status === "completed" ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800" :
                  order.payment.status === "pending" ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800" :
                  "bg-gradient-to-r from-red-100 to-pink-100 text-red-800"
                }`}>
                  {order.payment.status === "completed" ? `${translate('order.status.paid')}` :
                   order.payment.status === "pending" ? `${translate('admin.payment_pending_short')}` : `❌ ${translate('admin.payment_failed')}`}
                </span>
              ) : (
                <span className="text-xs text-gray-500 font-medium">{translate('common.no_data')}</span>
              )}
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleViewDetailsClick}
              className="group flex-1 min-w-0 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
            >
              <span className="flex items-center justify-center space-x-2">
                <span className="group-hover:scale-110 transition-transform"><FaRegEye /></span>
                <span>{translate('common.details')}</span>
              </span>
            </button>
            <button
              onClick={() => onChangeStatus(order)}
              disabled={isUpdating}
              className={`group flex-1 min-w-0 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform shadow-sm ${
                isUpdating 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 hover:shadow-md"
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isUpdating ? translate('admin.saving') : translate('admin.change_status')}</span>
              </span>
            </button>
            {(order.current_status || order.status) !== "cancelled" && (
              <button
                onClick={() => onUpdateStatus(order.order_id, "cancelled")}
                disabled={isUpdating}
                className="group bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span className="group-hover:scale-110 transition-transform">❌</span>
                  <span>{translate('common.cancel')}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default AdminOrders;