import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDineInCart } from '../../contexts/DineInCartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslatedName } from '../../utils/translationHelpers';
import { dineInOrderService } from '../../services/api';
import websocketService from '../../services/websocket';
import { FaArrowLeft, FaReceipt, FaSpinner, FaTimesCircle, FaBox, FaEdit, FaCreditCard, FaCheckCircle, FaClock } from 'react-icons/fa';

const DineInOrderHistory = () => {
  const { qrCodeData } = useParams();
  const navigate = useNavigate();
  const { translate, currentLanguage } = useLanguage();
  const { sessionId } = useDineInCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingBill, setRequestingBill] = useState(false);
  const [cancellingItemKey, setCancellingItemKey] = useState(null);
  const [supportsCanRequestBillApi, setSupportsCanRequestBillApi] = useState(true);
  const [billEligibility, setBillEligibility] = useState({
    canRequestBill: false,
    message: 'Checking bill availability...'
  });

  const t = (key, fallback, vars = {}) => {
    const value = translate(key, vars);
    return value === key ? fallback : value;
  };

  const formatPrice = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const computeLocalBillEligibility = (ordersList) => {
    if (!ordersList || ordersList.length === 0) {
      return {
        canRequestBill: false,
        message: t('dine_in.history.bill.no_active_orders', 'No active orders for billing')
      };
    }

    const hasUnservedItems = ordersList.some((order) => {
      if (order.payment_status === 'paid' || order.current_status === 'cancelled') {
        return false;
      }
      const details = order.order_details || [];
      if (details.length === 0) {
        return (order.current_status || order.status) !== 'served';
      }
      return details.some((detail) => detail.is_served !== true);
    });

    return {
      canRequestBill: !hasUnservedItems,
      message: hasUnservedItems
        ? t('dine_in.history.bill.unavailable_unserved', 'Cannot request bill yet because some items are not served')
        : t('dine_in.history.bill.available', 'You can request the bill now')
    };
  };

  useEffect(() => {
    const checkAndFetch = () => {
      const currentSessionId = sessionId || localStorage.getItem('dine_in_session_id');
      if (currentSessionId) {
        fetchOrders();
      } else {
        setError(t('dine_in.history.error_no_session', 'Session ID not found. Please scan QR code again'));
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchOrders();
    } else {
      const timeout = setTimeout(checkAndFetch, 100);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    websocketService.setDineInSessionId(sessionId);

    const handleDineInStatusUpdate = (data) => {
      const payload = data.payload || data;
      const orderId = payload.order_id;
      const newStatus = payload.new_status;

      if (orderId && newStatus) {
        setOrders((prevOrders) => {
          const updated = prevOrders.map((order) => {
            if (order.dine_in_order_id === orderId || order.order_id === orderId) {
              return {
                ...order,
                current_status: newStatus,
                status: newStatus
              };
            }
            return order;
          });

          const found = updated.some((o) => o.dine_in_order_id === orderId || o.order_id === orderId);
          if (!found) {
            setTimeout(() => fetchOrders(true), 100);
          }

          return updated;
        });
      } else {
        fetchOrders(true);
      }
    };

    const handleBillCheckCompleted = (data) => {
      if (data.type === 'bill_check_completed') {
        websocketService.disconnectDineIn();
        localStorage.removeItem('dine_in_session_id');
        navigate(`/dine-in/${qrCodeData}`);
      }
    };

    websocketService.on('dine_in_order_status_update', handleDineInStatusUpdate);
    websocketService.on('bill_check_completed', handleBillCheckCompleted);

    const interval = setInterval(() => fetchOrders(true), 30000);
    const onFocus = () => fetchOrders(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      websocketService.off('dine_in_order_status_update', handleDineInStatusUpdate);
      websocketService.off('bill_check_completed', handleBillCheckCompleted);
      websocketService.setDineInSessionId(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, navigate, qrCodeData]);

  const fetchOrders = async (quiet = false) => {
    try {
      if (!quiet) {
        setLoading(true);
        setError(null);
      }

      const currentSessionId = sessionId || localStorage.getItem('dine_in_session_id');
      if (!currentSessionId) {
        setError(t('dine_in.history.error_no_session', 'Session ID not found. Please scan QR code again'));
        if (!quiet) setLoading(false);
        return;
      }

      const response = await dineInOrderService.getBySession(currentSessionId, {});
      let fetchedOrders = response.data.results || response.data || [];

      fetchedOrders = fetchedOrders.filter((order) => order.payment_status !== 'paid' && order.current_status !== 'cancelled');
      fetchedOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

      setOrders(fetchedOrders);
      if (supportsCanRequestBillApi) {
        try {
          const eligibilityResponse = await dineInOrderService.canRequestBill(currentSessionId);
          const eligibilityData = eligibilityResponse?.data || {};
          setBillEligibility({
            canRequestBill: Boolean(eligibilityData.can_request_bill),
            message: eligibilityData.message || ''
          });
        } catch (eligibilityError) {
          if (eligibilityError?.response?.status === 404) {
            setSupportsCanRequestBillApi(false);
            setBillEligibility(computeLocalBillEligibility(fetchedOrders));
          } else {
            const message =
              eligibilityError?.response?.data?.message ||
              eligibilityError?.response?.data?.error ||
              t('dine_in.history.bill.unavailable_generic', 'Bill request is currently unavailable');
            setBillEligibility({ canRequestBill: false, message });
          }
        }
      } else {
        setBillEligibility(computeLocalBillEligibility(fetchedOrders));
      }
    } catch (err) {
      console.error('Error fetching dine-in orders:', err);
      if (!quiet) {
        setError(t('dine_in.history.error_load', 'Unable to load order history'));
      }
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  };

  const handleRequestBill = async () => {
    if (!sessionId) {
      alert(t('dine_in.history.error_no_session', 'Session ID not found. Please scan QR code again'));
      return;
    }

    if (!billEligibility.canRequestBill) {
      return;
    }

    setRequestingBill(true);

    try {
      await websocketService.requestBill(sessionId);
    } catch (error) {
      console.error('Error sending bill request:', error);
      setRequestingBill(false);
      alert(t('dine_in.history.bill.send_error', 'Unable to send bill request. Please try again.'));
    }
  };

  const handleCancelOrderItem = async (orderId, orderDetailId) => {
    const currentSessionId = sessionId || localStorage.getItem('dine_in_session_id');
    if (!currentSessionId) return;

    const itemKey = `${orderId}-${orderDetailId}`;
    setCancellingItemKey(itemKey);
    try {
      await dineInOrderService.cancelItem(currentSessionId, orderId, orderDetailId);
      await fetchOrders(true);
    } catch (cancelError) {
      const message =
        cancelError?.response?.data?.message ||
        cancelError?.response?.data?.error ||
        t('dine_in.history.cancel_item_error', 'Unable to cancel this menu item');
      alert(message);
    } finally {
      setCancellingItemKey(null);
    }
  };

  useEffect(() => {
    const handleBillRequestSent = (data) => {
      if (data.type === 'bill_request_sent') {
        setRequestingBill(false);
        alert(t('dine_in.history.bill.send_success', 'Bill request sent successfully. Orders count: {count}', { count: data.orders_count || 0 }));
        fetchOrders(true);
      } else if (data.type === 'error' && requestingBill) {
        setRequestingBill(false);
        setBillEligibility({
          canRequestBill: false,
          message: data.message || t('dine_in.history.bill.unavailable_generic', 'Bill request is currently unavailable')
        });
        fetchOrders(true);
      }
    };

    websocketService.on('bill_request_sent', handleBillRequestSent);
    websocketService.on('error', handleBillRequestSent);

    return () => {
      websocketService.off('bill_request_sent', handleBillRequestSent);
      websocketService.off('error', handleBillRequestSent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, requestingBill]);

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: t('dine_in.status.pending', 'Pending'),
      confirmed: t('dine_in.status.confirmed', 'Confirmed'),
      preparing: t('dine_in.status.preparing', 'Preparing'),
      ready: t('dine_in.status.ready', 'Ready'),
      served: t('dine_in.status.served', 'Served'),
      completed: t('dine_in.status.completed', 'Completed'),
      cancelled: t('dine_in.status.cancelled', 'Cancelled')
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (paymentStatus) => {
    return paymentStatus === 'paid'
      ? t('dine_in.history.payment_paid', 'Paid')
      : t('dine_in.history.payment_unpaid', 'Unpaid');
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-6xl text-primary-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">{t('dine_in.history.loading_title', 'Loading order history...')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('dine_in.loading_subtitle', 'Please wait a moment')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('dine_in.error_title', 'Error')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/dine-in/${qrCodeData}`)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            {t('dine_in.history.back_to_menu', 'Back to menu')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-white rounded-2xl shadow-md p-5 mb-4 flex items-center justify-between">
          <button
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => navigate(`/dine-in/${qrCodeData}`)}
            aria-label={t('common.back', 'Back')}
          >
            <FaArrowLeft />
          </button>
          <div className="flex-1"></div>
          {orders.length > 0 && (
            <div className="flex flex-col items-end">
              <button
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                onClick={handleRequestBill}
                disabled={requestingBill || !sessionId || !billEligibility.canRequestBill}
                title={!billEligibility.canRequestBill ? billEligibility.message : ''}
              >
                {requestingBill ? (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    {t('dine_in.history.bill.requesting', 'Sending...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FaReceipt />
                    {t('dine_in.history.bill.request', 'Request Bill')}
                  </span>
                )}
              </button>
              {!billEligibility.canRequestBill && <p className="text-xs text-gray-500 mt-2 text-right max-w-xs">{billEligibility.message}</p>}
            </div>
          )}
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.dine_in_order_id} className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{t('dine_in.history.order_number', 'Order #{id}', { id: order.dine_in_order_id })}</h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <FaClock className="text-gray-500" />
                      <span>{formatDateTime(order.order_date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.current_status)}`}>
                      {getStatusLabel(order.current_status)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                </div>

                {order.order_details && order.order_details.length > 0 && (
                  <div className="mb-4">
                    {order.order_details.map((detail, index) => (
                      <div key={detail.order_detail_id || index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex gap-3 items-center">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700">{detail.quantity}x</span>
                          <span className="text-gray-900">{getTranslatedName(detail, currentLanguage, detail.product_name)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 font-medium text-sm">
                            {formatPrice(detail.subtotal || detail.price_at_order * detail.quantity)}
                          </span>
                          {order.current_status === 'pending' && detail.order_detail_id && (
                            <button
                              onClick={() => handleCancelOrderItem(order.dine_in_order_id, detail.order_detail_id)}
                              disabled={cancellingItemKey === `${order.dine_in_order_id}-${detail.order_detail_id}`}
                              className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {cancellingItemKey === `${order.dine_in_order_id}-${detail.order_detail_id}`
                                ? '...'
                                : t('dine_in.history.cancel_item', 'Cancel item')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {order.special_instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2 text-amber-800">
                      <FaEdit className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{t('dine_in.history.special_instructions', 'Special instructions')}:</strong>
                        <p className="text-sm mt-1">{order.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">{t('dine_in.history.total', 'Total')}:</span>
                  <span className="text-base font-medium text-gray-500">{formatPrice(order.total_amount)}</span>
                </div>

                {order.payment_status === 'paid' && order.payment_method && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <FaCreditCard className="text-green-600" />
                      <span className="font-semibold">
                        {t('order.payment_method', 'Payment method')}: {order.payment_method === 'cash' ? t('payment.cash', 'Cash') : order.payment_method}
                      </span>
                    </div>
                    {order.paid_at && (
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <FaCheckCircle className="text-green-600" />
                        <span>
                          {t('dine_in.history.paid_at', 'Paid at')}: {formatDateTime(order.paid_at)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaBox className="text-8xl text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('dine_in.history.empty_title', 'No order history yet')}</h2>
            <p className="text-gray-600 mb-8">{t('dine_in.history.empty_message', 'Your order history will appear here after ordering')}</p>
            <button
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              onClick={() => navigate(`/dine-in/${qrCodeData}`)}
            >
              {t('dine_in.history.back_to_menu', 'Back to menu')}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-hide::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default DineInOrderHistory;
