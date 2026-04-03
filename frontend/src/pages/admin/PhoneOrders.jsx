import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { orderService } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslatedName } from '../../utils/translationUtils';
import {
  LuMapPin, LuUser, LuStore, LuPackage, LuTag, LuFileText, LuX, LuTrash2,
  LuCalendar, LuCreditCard, LuUtensilsCrossed, LuRefreshCw, LuSearch, LuMap
} from 'react-icons/lu';

// Phone Order Details Modal Component (same style as Guest Orders)
const PhoneOrderDetailsModal = ({ order, isOpen, onClose, orderStatuses, formatDateTime, onDelete, getStatusColor }) => {
  if (!isOpen || !order) return null;
  const { translate, currentLanguage } = useLanguage();

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant = orderDetailsByRestaurant.length > 1;
  const restaurantCount = isMultiRestaurant ? orderDetailsByRestaurant.length : 1;
  const subtotal = orderDetails.reduce((total, detail) => total + parseFloat(detail.subtotal || 0), 0);
  const orderId = order.guest_order_id || order.order_id;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        
        <div className="relative w-full max-w-2xl max-h-[90vh] my-8 flex flex-col overflow-hidden bg-white shadow-xl rounded-lg border border-gray-200">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900">#{orderId}</h3>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {orderStatuses?.find(s => s.value === order.current_status)?.label || order.current_status}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  📞 {translate('admin.phone_orders')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <LuCalendar className="w-3.5 h-3.5" />
                {formatDateTime(order.order_date)}
                {order.temporary_id && <span className="ml-2">| {order.temporary_id}</span>}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  const orderIdDel = order.temporary_id || order.guest_order_id || order.order_id;
                  if (window.confirm(`ยืนยันการลบออเดอร์ #${orderIdDel}?\n\nการกระทำนี้ไม่สามารถยกเลิกได้`)) {
                    onDelete(order);
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                title="ลบ"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="ปิด">
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
                  {order.temporary_id && (
                    <div className="flex gap-2 items-center pt-1">
                      <LuTag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{order.temporary_id}</span>
                    </div>
                  )}
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
                          <div key={item.guest_order_detail_id || item.order_detail_id || itemIndex} className="px-4 py-3 flex justify-between text-sm">
                            <span>{getTranslatedName(item, currentLanguage, item.product_name) || item.product_name} × {item.quantity}</span>
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
                    <div key={detail.guest_order_detail_id || detail.order_detail_id || index} className="px-4 py-3 flex justify-between text-sm">
                      <span>{getTranslatedName(detail, currentLanguage, detail.product_name) || detail.product_name} × {detail.quantity}</span>
                      <span className="font-medium text-gray-800 ml-2">{formatPrice(detail.subtotal || 0)}</span>
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
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                    (order.payment_status || order.payment?.status) === "completed" || (order.payment_status || order.payment?.status) === "paid" ? "bg-gray-100 text-gray-800" :
                    (order.payment_status || order.payment?.status) === "pending" ? "bg-gray-100 text-gray-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {(order.payment_status || order.payment?.status) === "completed" || (order.payment_status || order.payment?.status) === "paid"
                      ? translate('order.status.paid')
                      : (order.payment_status || order.payment?.status) === "pending"
                        ? translate('admin.payment_pending')
                        : translate('common.not_specified')}
                  </span>
                  {(order.payment_method || order.payment?.payment_method) && (
                    <span className="text-sm text-gray-600">
                      {(order.payment_method || order.payment?.payment_method) === "bank_transfer" ? translate('cart.bank_transfer') :
                       (order.payment_method || order.payment?.payment_method) === "cash" ? translate('payment.cash') :
                       (order.payment_method || order.payment?.payment_method) === "qr_payment" ? translate('cart.qr_payment') :
                       (order.payment_method || order.payment?.payment_method)}
                    </span>
                  )}
                </div>
                {(order.proof_of_payment || order.payment?.proof_of_payment_display_url) && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => window.open(order.proof_of_payment || order.payment?.proof_of_payment_display_url, "_blank")}
                      className="block"
                    >
                      <img
                        src={order.proof_of_payment || order.payment?.proof_of_payment_display_url}
                        alt="หลักฐานการโอน"
                        className="max-w-full max-h-48 rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Update Modal Component (same style as Guest Orders)
const PhoneStatusUpdateModal = ({ order, isOpen, onClose, onUpdateStatus, orderStatuses, isUpdating: isUpdatingProp }) => {
  const [selectedStatus, setSelectedStatus] = useState(order?.current_status || '');
  const [note, setNote] = useState('');
  const [isUpdatingLocal, setIsUpdatingLocal] = useState(false);
  const { translate } = useLanguage();
  const isUpdating = isUpdatingProp !== undefined ? isUpdatingProp : isUpdatingLocal;

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.current_status || '');
      setNote('');
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === order.current_status) return;

    setIsUpdatingLocal(true);
    try {
      await onUpdateStatus(order.guest_order_id, selectedStatus, note);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingLocal(false);
    }
  };

  if (!isOpen || !order) return null;

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
              <h3 className="text-lg font-semibold text-gray-900">{translate('admin.update_status_title')}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
              <LuX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-800">
                  {translate('admin.phone_order_number', { id: order.guest_order_id })}
                </p>
                {order.temporary_id && (
                  <p className="text-xs text-gray-500 mt-1">{translate('admin.temporary_id')}: {order.temporary_id}</p>
                )}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translate('admin.select_new_status')}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 font-medium cursor-pointer text-sm"
                required
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                {translate('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isUpdating || selectedStatus === order.current_status}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <LuRefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? translate('admin.saving') : translate('common.confirm')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'paid': 'bg-blue-100 text-blue-800',
    'preparing': 'bg-orange-100 text-orange-800',
    'ready_for_pickup': 'bg-purple-100 text-purple-800',
    'delivering': 'bg-indigo-100 text-indigo-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status, translateFn) => {
  const statusText = {
    'pending': translateFn('order.status.pending'),
    'paid': translateFn('order.status.paid'),
    'preparing': translateFn('order.status.preparing'),
    'ready_for_pickup': translateFn('order.status.ready_for_pickup'),
    'delivering': translateFn('order.status.delivering'),
    'completed': translateFn('order.status.completed'),
    'cancelled': translateFn('order.status.cancelled')
  };
  return statusText[status] || status;
};

const PhoneOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { translate, currentLanguage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  // Pagination
  const pageSize = 5;
  const [page, setPage] = useState(1);

  // Highlight order from navigation state
  const highlightOrderId = location.state?.highlightOrderId;
  const highlightTemporaryId = location.state?.temporaryId;

  // สถานะที่ใช้ได้
  const orderStatuses = [
    { value: "pending", label: translate('order.status.pending'), color: "bg-yellow-100 text-yellow-800" },
    { value: "paid", label: translate('order.status.paid'), color: "bg-blue-100 text-blue-800" },
    { value: "preparing", label: translate('order.status.preparing'), color: "bg-orange-100 text-orange-800" },
    { value: "ready_for_pickup", label: translate('order.status.ready_for_pickup'), color: "bg-purple-100 text-purple-800" },
    { value: "delivering", label: translate('order.status.delivering'), color: "bg-indigo-100 text-indigo-800" },
    { value: "completed", label: translate('order.status.completed'), color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: translate('order.status.cancelled'), color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    fetchPhoneOrders();
  }, [sortBy]);

  const sortOrders = (orders) => {
    return [...orders].sort((a, b) => {
      if (sortBy === 'current_status') {
        const statusOrder = ["pending", "paid", "preparing", "ready_for_pickup", "delivering", "completed", "cancelled"];
        const aIndex = statusOrder.indexOf(a.current_status);
        const bIndex = statusOrder.indexOf(b.current_status);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return new Date(b.order_date) - new Date(a.order_date);
      }
      return new Date(b.order_date) - new Date(a.order_date);
    });
  };

  // Function to delete order (both regular and guest orders)
  const handleDeleteOrder = async (order) => {
    try {
      let response;
      const orderId = order.temporary_id || order.order_id;
      const isGuestOrder = !!order.temporary_id;
      
      if (isGuestOrder) {
        // Delete guest order using API endpoint
        response = await api.delete(`/guest-orders/${order.guest_order_id}/`);
      } else {
        // Delete regular order using orderService
        response = await orderService.delete(order.order_id);
      }
      
      // แสดงข้อความสำเร็จ
      const orderType = isGuestOrder ? 'Guest' : 'Regular';
      return { success: true, message: `ลบออเดอร์ ${orderType} #${orderId} เรียบร้อยแล้ว` };
      
    } catch (error) {
      console.error("❌ Error deleting order:", error);
      
      // แสดงข้อความผิดพลาด
      if (error.response?.status === 403) {
        return { success: false, message: "ไม่มีสิทธิ์ลบออเดอร์ (เฉพาะแอดมินเท่านั้น)" };
      } else {
        return { success: false, message: "เกิดข้อผิดพลาดในการลบออเดอร์: " + (error.response?.data?.error || error.message) };
      }
    }
  };

  // Wrapper function to handle delete and close modal
  const handleDeleteOrderWithModalClose = async (order) => {
    try {
      const result = await handleDeleteOrder(order);
      if (result.success) {
        alert(result.message);
        setShowDetailsModal(false);
        setSelectedOrder(null);
        await fetchPhoneOrders(); // รีเฟรชรายการออเดอร์
      } else {
        alert(result.message);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert("ไม่มีสิทธิ์ลบออเดอร์ (เฉพาะแอดมินเท่านั้น)");
      } else {
        alert("เกิดข้อผิดพลาดในการลบออเดอร์: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const fetchPhoneOrders = async () => {
    try {
      setLoading(true);
      let url = '/guest-orders/';
      const params = new URLSearchParams();
      
      if (sortBy && sortBy !== 'current_status') {
        params.append('ordering', `-${sortBy}`);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await api.get(url);
      let allOrders = response.data.results || response.data;
      
      // Filter only phone orders (orders without customer_email or with empty customer_email)
      const phoneOrders = allOrders.filter(order => 
        !order.customer_email || order.customer_email === ''
      );
      
      // Apply client-side sorting if needed
      const sortedOrders = sortBy === 'current_status' ? sortOrders(phoneOrders) : phoneOrders;
      
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching phone orders:', error);
      alert(translate('common.failed_to_load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, note = '') => {
    setUpdatingOrders(prev => new Set([...prev, orderId]));
    try {
      await api.post(`/guest-orders/${orderId}/update_status/`, {
        status: newStatus,
        note: note || `Status updated to ${newStatus} by admin`
      });
      
      // Refresh orders
      await fetchPhoneOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Filtered and paginated orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesFilter = filter === 'all' || order.current_status === filter;
      const matchesSearch = !searchTerm.trim() || 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm) ||
        order.temporary_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.guest_order_id?.toString().includes(searchTerm);
      
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, searchTerm]);

  // Statistics per status (exclude total card per request)
  const statistics = useMemo(() => {
    return {
      pending: filteredOrders.filter(o => o.current_status === 'pending').length,
      paid: filteredOrders.filter(o => o.current_status === 'paid').length,
      preparing: filteredOrders.filter(o => o.current_status === 'preparing').length,
      ready_for_pickup: filteredOrders.filter(o => o.current_status === 'ready_for_pickup').length,
      delivering: filteredOrders.filter(o => o.current_status === 'delivering').length,
      completed: filteredOrders.filter(o => o.current_status === 'completed').length,
      cancelled: filteredOrders.filter(o => o.current_status === 'cancelled').length,
    };
  }, [filteredOrders]);

  // (removed) Statistics cards and calculations per request

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const locale = currentLanguage === 'th' ? 'th-TH-u-ca-gregory' : currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
      return date.toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const displayOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium text-lg">
            {translate('admin.loading_phone_orders')}
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
                  {translate('admin.phone_orders_title')}
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
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPhoneOrders}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <LuRefreshCw className="w-4 h-4" />
                <span className="font-medium">{translate('admin.refresh')}</span>
              </button>
              <button
                onClick={() => navigate('/admin/create-phone-order')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span className="font-medium">{translate('admin.phone_orders_create_new')}</span>
              </button>
            </div>
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
                  placeholder={translate('admin.phone_orders_search_placeholder')}
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
                  <option key={status.value} value={status.value}>{status.label}</option>
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
            const count = orders.filter((o) => o.current_status === status.value).length;
            const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
            const isActive = filter === status.value;
            return (
              <div
                key={status.value}
                className={`bg-white rounded-lg border p-4 text-center cursor-pointer transition-shadow ${
                  isActive ? 'ring-2 ring-gray-900 shadow-md' : 'border-gray-200 hover:shadow-sm'
                }`}
                onClick={() => setFilter(isActive ? 'all' : status.value)}
              >
                <div className="text-2xl font-bold text-gray-900 mb-2">{count}</div>
                <div className="text-xs font-medium text-gray-600 mb-2">{status.label}</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                  <div className="h-1 rounded-full bg-gray-400 transition-all" style={{ width: `${Math.max(percentage, 2)}%` }} />
                </div>
                <div className="text-xs font-medium text-gray-500">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>

        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <LuUser className="w-16 h-16 text-gray-300 mb-4 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{translate('admin.phone_orders_empty_title')}</h2>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== 'all' ? translate('admin.phone_orders_empty_search_message') : translate('admin.phone_orders_empty_message')}
            </p>
            <button
              onClick={() => navigate('/admin/create-phone-order')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {translate('admin.phone_orders_create_new')}
            </button>
          </div>
        ) : (
          <>
            {/* Order Cards */}
            <div className="space-y-4 mb-8">
              {displayOrders.map((order) => (
                <PhoneOrderCard
                  key={order.guest_order_id}
                  order={order}
                  orderStatuses={orderStatuses}
                  onViewDetails={() => {
                    setSelectedOrder(order);
                    setShowDetailsModal(true);
                  }}
                  onChangeStatus={() => {
                    setSelectedOrder(order);
                    setShowStatusModal(true);
                  }}
                  onUpdateStatus={handleStatusUpdate}
                  isUpdating={updatingOrders.has(order.guest_order_id)}
                  highlightOrderId={highlightOrderId}
                  highlightTemporaryId={highlightTemporaryId}
                  formatDateTime={formatDateTime}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>

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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pageNum === page ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
          </>
        )}
      </div>

      {/* Modals */}
      <PhoneOrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        orderStatuses={orderStatuses}
        formatDateTime={formatDateTime}
        onDelete={handleDeleteOrderWithModalClose}
      />

      <PhoneStatusUpdateModal
        order={selectedOrder}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdateStatus={handleStatusUpdate}
        orderStatuses={orderStatuses}
      />
    </div>
  );
};

// Phone Order Card Component (same style as Guest Orders)
const PhoneOrderCard = ({ order, orderStatuses, onViewDetails, onChangeStatus, onUpdateStatus, isUpdating, highlightOrderId, highlightTemporaryId, formatDateTime, getStatusColor }) => {
  const { translate } = useLanguage();
  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant = orderDetailsByRestaurant.length > 1;
  const restaurantCount = isMultiRestaurant ? orderDetailsByRestaurant.length : 1;
  const isHighlighted = order.guest_order_id === highlightOrderId || order.temporary_id === highlightTemporaryId;

  return (
    <div
      id={`phone-order-${order.guest_order_id}`}
      className={`group relative rounded-lg border transition-shadow overflow-hidden ${
        isHighlighted ? 'ring-2 ring-gray-900 ring-offset-1' : ''
      } bg-white border-gray-200 hover:shadow-md`}
    >
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <LuUser className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {order.guest_order_id}
              </h3>
            </div>
            <span className={`px-3 py-1.5 rounded text-sm font-medium ${getStatusColor(order.current_status)}`}>
              {orderStatuses?.find(s => s.value === order.current_status)?.label || order.current_status}
            </span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              📞 {translate('admin.phone_orders')}
            </span>
            {isMultiRestaurant && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <LuStore className="w-3 h-3" />
                {restaurantCount} ร้าน
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-gray-900">{formatPrice(order.total_amount || 0)}</p>
            <p className="text-xs text-gray-500">{formatDateTime(order.order_date)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><LuUser className="w-3 h-3" /> {translate('admin.customer')}</p>
            <p className="font-bold text-gray-900 truncate text-sm">{order.customer_name || "ไม่ระบุ"}</p>
            <p className="text-xs text-gray-500">{order.customer_phone || "ไม่ระบุ"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><LuStore className="w-3 h-3" /> {translate('common.restaurant')}</p>
            {isMultiRestaurant ? (
              <p className="font-bold text-gray-800 text-sm">หลายร้าน ({restaurantCount})</p>
            ) : (
              <p className="font-bold text-gray-900 text-sm truncate">{order.restaurant_name || "ไม่ระบุ"}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><LuMapPin className="w-3 h-3" /> {translate('order.delivery_address')}</p>
            <div className="text-gray-900 text-sm">
              {order.delivery_address ? (
                (() => {
                  const displayAddress = order.delivery_address
                    .split("\n")
                    .filter((line) => !/ตำแหน่ง\s*:\s*-?\d+\.?\d*,\s*-?\d+\.?\d*/.test(line.trim()))
                    .join("\n")
                    .trim();
                  return displayAddress ? <p className="text-xs text-gray-700 whitespace-pre-line line-clamp-2">{displayAddress}</p> : null;
                })()
              ) : <p className="font-bold">ไม่ระบุ</p>}
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
            <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><LuPackage className="w-3 h-3" /> {translate('order.items')}</p>
            <p className="font-bold text-gray-900 text-sm">{orderDetails.length} {translate('order.items_count')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><LuTag className="w-3 h-3" /> {translate('admin.temporary_id')}</p>
            <p className="font-mono text-xs bg-gray-200 px-2 py-1 rounded truncate">{order.temporary_id || "—"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 min-w-0 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LuFileText className="w-4 h-4" />
            {translate('common.details')}
          </button>
          <button
            onClick={onChangeStatus}
            disabled={isUpdating}
            className={`flex-1 min-w-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isUpdating ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 text-white"
            }`}
          >
            <LuRefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? translate('admin.saving') : translate('admin.change_status')}
          </button>
          {order.current_status !== "cancelled" && (
            <button
              onClick={() => onUpdateStatus(order.guest_order_id, "cancelled")}
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
  );
};

export default PhoneOrders;