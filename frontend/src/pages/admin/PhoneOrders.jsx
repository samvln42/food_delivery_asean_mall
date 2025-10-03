import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { orderService } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { useLanguage } from '../../contexts/LanguageContext';

// Phone Order Details Modal Component
const PhoneOrderDetailsModal = ({ order, isOpen, onClose, orderStatuses, formatDateTime, onDelete }) => {
  if (!isOpen || !order) return null;
  const { translate } = useLanguage();

  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant = orderDetailsByRestaurant.length > 1;
  const restaurantCount = isMultiRestaurant ? orderDetailsByRestaurant.length : 1;
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
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent">
                  📞 {translate('admin.phone_order_number', { id: order.guest_order_id })}
                </h3>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  📅 {formatDateTime(order.order_date)} | {translate('admin.temporary_id')}: {order.temporary_id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* ปุ่มลบออเดอร์ */}
              <button
                onClick={() => {
                  const orderType = order.temporary_id ? 'Guest' : 'Regular';
                  const orderId = order.temporary_id || order.order_id;
                  if (window.confirm(`ยืนยันการลบออเดอร์ ${orderType} #${orderId}?\n\nการกระทำนี้ไม่สามารถยกเลิกได้และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง`)) {
                    onDelete(order);
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
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🍽️ {translate('order.items')}</h4>
              
              {isMultiRestaurant && orderDetailsByRestaurant.length > 0 ? (
                <div className="space-y-4">
                  {orderDetailsByRestaurant.map((restaurantGroup, groupIndex) => (
                    <div key={restaurantGroup.restaurant_id || groupIndex} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800">🏪 {restaurantGroup.restaurant_name}</h5>
                        <span className="text-sm font-semibold text-green-600">
                          {formatPrice(restaurantGroup.subtotal)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(restaurantGroup.items || []).map((item, itemIndex) => (
                          <div key={item.guest_order_detail_id || itemIndex} className="flex justify-between text-sm">
                            <span>{item.product_name} × {item.quantity}</span>
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
                    <div key={detail.guest_order_detail_id || index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>{detail.product_name} × {detail.quantity}</span>
                      <span className="font-medium">{formatPrice(detail.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* สรุปยอดเงิน */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">💰 {translate('admin.summary')}</h4>
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
                    <span className="text-green-600">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลลูกค้าและการจัดส่ง */}
            <div className="space-y-6">
              {/* ข้อมูลลูกค้า */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">👤 {translate('admin.customer_info')}</h4>
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 mb-1">{translate('order.delivery_address')}:</p>
                    <p className="text-gray-800">{order.delivery_address}</p>
                  </div>
                  {order.special_instructions && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-600 mb-1">{translate('cart.special_instructions')}:</p>
                      <p className="text-gray-800">{order.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ข้อมูลการชำระเงิน */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">💳 {translate('admin.payment_info')}</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{translate('order.payment_method')}:</span>
                    <span className="font-medium">
                      {order.payment_method === 'bank_transfer' ? translate('cart.bank_transfer') : 
                       order.payment_method === 'cash' ? translate('payment.cash') : 
                       (order.payment_method || translate('common.not_specified'))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{translate('admin.payment_status')}:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                      order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.payment_status === 'paid' ? translate('order.status.paid') : 
                       order.payment_status === 'pending' ? translate('admin.payment_pending_short') : 
                       translate('common.not_specified')}
                    </span>
                  </div>
                </div>
              </div>

              {/* สถานะคำสั่งซื้อ */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">📋 {translate('admin.order_status')}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{translate('admin.current_status')}:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.current_status)}`}>
                      {translate(`order.status.${order.current_status}`)}
                    </span>
                  </div>
                  {isMultiRestaurant && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-orange-600 font-medium">🏪 {translate('order.from_multiple_restaurants', { count: restaurantCount })}</p>
                    </div>
                  )}
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
const PhoneStatusUpdateModal = ({ order, isOpen, onClose, onUpdateStatus, orderStatuses }) => {
  const [selectedStatus, setSelectedStatus] = useState(order?.current_status || '');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { translate } = useLanguage();

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.current_status || '');
      setNote('');
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === order.current_status) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(order.guest_order_id, selectedStatus, note);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-all duration-300 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{translate('admin.update_status_title')}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translate('admin.select_new_status')}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translate('admin.note_optional')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="เพิ่มหมายเหตุเกี่ยวกับการอัพเดทสถานะ..."
              />
            </div> */}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {translate('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isUpdating || selectedStatus === order.current_status}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? translate('admin.saving') : translate('admin.change_status')}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium text-lg">
            {translate('admin.loading_phone_orders')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-green-500/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  📞 {translate('admin.phone_orders_title')}
                </h1>
                <p className="text-gray-500 text-sm font-medium">{translate('admin.phone_orders_subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchPhoneOrders}
                className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">{translate('admin.refresh')}</span>
              </button>
              <button
                onClick={() => navigate('/admin/create-phone-order')}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">{translate('admin.phone_orders_create_new')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Controls - match AdminOrders style */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translate('admin.phone_orders_search_placeholder')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400 focus:bg-white transition-all text-sm font-medium placeholder-gray-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            </div>

            {/* Filter */}
            <div className="min-w-44">
              <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400 focus:bg-white transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="all">🔍 {translate('admin.all_statuses')}</option>
                  <option value="pending">⏳ {translate('order.status.pending')}</option>
                  <option value="paid">💳 {translate('order.status.paid')}</option>
                  <option value="preparing">👨‍🍳 {translate('order.status.preparing')}</option>
                  <option value="ready_for_pickup">📦 {translate('order.status.ready_for_pickup')}</option>
                  <option value="delivering">🚚 {translate('order.status.delivering')}</option>
                  <option value="completed">✅ {translate('order.status.completed')}</option>
                  <option value="cancelled">❌ {translate('order.status.cancelled')}</option>
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
                  className="w-full appearance-none px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400 focus:bg-white transition-all text-sm font-medium cursor-pointer"
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

        {/* Status Cards (click to filter) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          {orderStatuses.map((status) => {
            const count = orders.filter((o) => o.current_status === status.value).length;
            const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
            const isActive = filter === status.value;
            return (
              <div
                key={status.value}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-4 text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isActive ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-emerald-50 scale-105 shadow-xl' : 'hover:shadow-lg'
                }`}
                onClick={() => setFilter(isActive ? 'all' : status.value)}
              >
                <div className="relative z-10">
                  <div className={`text-3xl font-black mb-2 transition-all duration-300 ${
                    count > 0 ? 'text-gray-800 group-hover:scale-110' : 'text-gray-300'
                  } ${isActive ? 'text-green-600' : ''}`}>
                    {count}
                  </div>
                  <div className={`text-xs font-semibold mb-2 transition-colors ${
                    isActive ? 'text-green-700' : 'text-gray-600 group-hover:text-gray-800'
                  }`}>
                    {status.label}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div 
                      className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    ></div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
                    isActive ? 'bg-green-500 text-white' : status.color
                  }`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Orders List */}
        {displayOrders.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{translate('admin.phone_orders_empty_title')}</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== 'all' ? translate('admin.phone_orders_empty_search_message') : translate('admin.phone_orders_empty_message')}
            </p>
            <button
              onClick={() => navigate('/admin/create-phone-order')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">{translate('admin.phone_orders_create_new')}</span>
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
                  onViewDetails={() => {
                    setSelectedOrder(order);
                    setShowDetailsModal(true);
                  }}
                  onUpdateStatus={() => {
                    setSelectedOrder(order);
                    setShowStatusModal(true);
                  }}
                  isUpdating={updatingOrders.has(order.guest_order_id)}
                  highlightOrderId={highlightOrderId}
                  highlightTemporaryId={highlightTemporaryId}
                  formatDateTime={formatDateTime}
                />
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>แสดง</span>
                    <span className="font-semibold text-green-600">{(page - 1) * pageSize + 1}</span>
                    <span>ถึง</span>
                    <span className="font-semibold text-green-600">{Math.min(page * pageSize, filteredOrders.length)}</span>
                    <span>จาก</span>
                    <span className="font-semibold text-green-600">{filteredOrders.length}</span>
                    <span>รายการ</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white/60 border border-white/30 rounded-xl hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      ก่อนหน้า
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                              page === pageNum
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                : 'text-gray-600 bg-white/60 border border-white/30 hover:bg-white/80'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white/60 border border-white/30 rounded-xl hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
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

// Compact Phone Order Card Component
const PhoneOrderCard = ({ order, onViewDetails, onUpdateStatus, isUpdating, highlightOrderId, highlightTemporaryId, formatDateTime }) => {
  const { translate } = useLanguage();
  const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
  const orderDetailsByRestaurant = order.order_details_by_restaurant || [];
  const isMultiRestaurant = orderDetailsByRestaurant.length > 1;
  const restaurantCount = isMultiRestaurant ? orderDetailsByRestaurant.length : 1;

  const isHighlighted = order.guest_order_id === highlightOrderId || order.temporary_id === highlightTemporaryId;

  return (
    <div className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
      isHighlighted 
        ? 'border-green-300 bg-green-50/80 shadow-green-500/20' 
        : 'border-white/20 hover:border-green-200'
    }`}>
      {/* Compact Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                📞 {translate('admin.phone_order_number', { id: order.guest_order_id })}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                {formatDateTime(order.order_date)} • {translate('admin.temporary_id')}: {order.temporary_id}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatPrice(order.total_amount || 0)}
            </p>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.current_status)} shadow-sm`}>
              {getStatusText(order.current_status, translate)}
            </span>
          </div>
        </div>

        {/* Compact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{order.customer_name}</p>
              <p className="text-gray-500">{order.customer_phone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{translate('order.delivery_address')}</p>
              <p className="text-gray-500 truncate">{order.delivery_address}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{orderDetails.length} {translate('common.items')}</p>
              {isMultiRestaurant && (
                <p className="text-gray-500">{restaurantCount} {translate('common.restaurants')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{translate('admin.payment_info')}</p>
              <p className="text-gray-500">
                {order.payment_method === 'bank_transfer' ? translate('cart.bank_transfer') : 
                 order.payment_method === 'cash' ? translate('payment.cash') : 
                 (order.payment_method || translate('common.not_specified'))}
              </p>
            </div>
          </div>

          {isMultiRestaurant && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 text-xs">🏪</span>
              </div>
              <div>
                    <p className="font-medium text-amber-600">{translate('admin.multiple_restaurants')}</p>
                    <p className="text-gray-500">{restaurantCount} {translate('common.restaurants')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onViewDetails}
            className="group/btn flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
                <span className="text-sm font-medium">{translate('common.details')}</span>
          </button>

          <button
            onClick={onUpdateStatus}
            disabled={isUpdating}
            className="group/btn flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
              <span className="text-sm font-medium">{isUpdating ? translate('admin.saving') : translate('admin.change_status')}</span>
          </button>

          {isMultiRestaurant && (
            <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-3 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-medium">{translate('order.from_multiple_restaurants', { count: restaurantCount })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneOrders;