import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from '../../hooks/useNotification';

const RestaurantOrders = () => {
  const { user } = useAuth();
  const { translate } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');



  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // เรียก API จริง
      const response = await api.get('/orders/');
      const apiOrders = response.data.results || response.data;
      
      // กรองเฉพาะ orders ของร้านนี้ (หากมี restaurant_id)
      let filteredOrders = apiOrders;
      if (user?.restaurant?.restaurant_id) {
        filteredOrders = apiOrders.filter(order => 
          order.restaurant_id === user.restaurant.restaurant_id ||
          order.restaurant === user.restaurant.restaurant_id
        );
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // เรียก API เพื่ออัพเดทสถานะ
      await api.patch(`/orders/${orderId}/`, { 
        current_status: newStatus 
      });
      
      // อัพเดท local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId
            ? { ...order, status: newStatus, current_status: newStatus }
            : order
        )
      );
      
      // แสดงการแจ้งเตือนสำเร็จ
      const statusText = translate(`order.status.${newStatus}`);
      const successMessage = translate("order.status_change_notification", {
        orderId: orderId,
        status: statusText
      });
      toast.success(successMessage);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(translate('order.update_status_failed'));
    }
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(order => order.status === filter);
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': { text: 'รอยืนยัน', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { text: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-800' },
      'preparing': { text: 'กำลังเตรียม', color: 'bg-orange-100 text-orange-800' },
      'ready': { text: 'พร้อมส่ง', color: 'bg-green-100 text-green-800' },
      'delivering': { text: 'กำลังจัดส่ง', color: 'bg-purple-100 text-purple-800' },
      'delivered': { text: 'จัดส่งแล้ว', color: 'bg-green-100 text-green-800' },
      'cancelled': { text: 'ยกเลิก', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusActions = (order) => {
    const actions = [];
    
    switch (order.status) {
      case 'pending':
        actions.push(
          <button
            key="confirm"
            onClick={() => updateOrderStatus(order.order_id, 'confirmed')}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Confirm
          </button>,
          <button
            key="cancel"
            onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Reject
          </button>
        );
        break;
      case 'confirmed':
        actions.push(
          <button
            key="prepare"
            onClick={() => updateOrderStatus(order.order_id, 'preparing')}
            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
          >
            Start preparing
          </button>
        );
        break;
      case 'preparing':
        actions.push(
          <button
            key="ready"
            onClick={() => updateOrderStatus(order.order_id, 'ready')}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Ready to deliver
          </button>
        );
        break;
      case 'ready':
        actions.push(
          <button
            key="delivering"
            onClick={() => updateOrderStatus(order.order_id, 'delivering')}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
          >
            Delivered
          </button>
        );
        break;
    }
    
    return actions;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">Manage orders</h1>
        <div className="bg-white rounded-lg px-4 py-2 shadow">
          <span className="text-sm text-secondary-600">Total orders: </span>
          <span className="font-semibold text-primary-600">{orders.length}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto border-b">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'preparing', label: 'Preparing' },
            { key: 'ready', label: 'Ready' },
            { key: 'delivering', label: 'Delivering' },
            { key: 'delivered', label: 'Delivered' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab.label} ({tab.key === 'all' ? orders.length : orders.filter(order => order.status === tab.key).length})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusDisplay(order.status);
            const actions = getStatusActions(order);
            
            return (
              <div key={order.order_id} className="bg-white rounded-lg shadow-md p-6">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-800">
                        #{order.order_id}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {formatDateTime(order.order_date)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary-600">
                                              {order.total_amount}
                    </p>
                    {order.estimated_prep_time > 0 && (
                      <p className="text-sm text-secondary-500">
                        Preparing: ~{order.estimated_prep_time} minutes
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-secondary-700 mb-1">Customer information</h4>
                    <p className="text-secondary-600">{order.customer_name}</p>
                    <p className="text-secondary-600">{order.customer_phone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-700 mb-1">Delivery address</h4>
                    <p className="text-secondary-600 text-sm">{order.delivery_address}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-secondary-700 mb-2">Food list</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-secondary-800 font-medium">
                            {item.product_name} x {item.quantity}
                          </span>
                          {item.special_instructions && (
                            <p className="text-sm text-secondary-500 italic">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <span className="text-secondary-800 font-semibold">
                                                      {item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {order.special_instructions && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800">Special instructions:</p>
                      <p className="text-sm text-yellow-700">{order.special_instructions}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {actions}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">📋</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {filter === 'all' ? 'No orders' : `No orders${filter === 'pending' ? ' that need to be confirmed' : ''}`}
          </h2>
          <p className="text-secondary-500">
            {filter === 'all' ? 'Orders from customers will appear here' : 'Try changing the filter to see other orders'}
          </p>
          
          {filter === 'all' && orders.length === 0 && (
            <div className="mt-6">
              <button
                onClick={fetchOrders}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
              >
                Refresh orders
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantOrders; 