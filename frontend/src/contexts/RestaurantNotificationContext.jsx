import React, { createContext, useState, useContext, useEffect } from 'react';
import websocketService from '../services/websocket';
import { useAuth } from './AuthContext';

const RestaurantNotificationContext = createContext();

export const useRestaurantNotification = () => {
  const context = useContext(RestaurantNotificationContext);
  if (!context) {
    throw new Error('useRestaurantNotification must be used within RestaurantNotificationProvider');
  }
  return context;
};

export const RestaurantNotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newBillRequestsCount, setNewBillRequestsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Load counts from localStorage on mount
  useEffect(() => {
    const savedOrdersCount = localStorage.getItem('restaurant_new_orders_count');
    const savedBillRequestsCount = localStorage.getItem('restaurant_new_bill_requests_count');
    
    if (savedOrdersCount) setNewOrdersCount(parseInt(savedOrdersCount, 10));
    if (savedBillRequestsCount) setNewBillRequestsCount(parseInt(savedBillRequestsCount, 10));
  }, []);

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect WebSocket when user logs out
      websocketService.disconnect();
      return;
    }
    if (user.role !== 'special_restaurant' && user.role !== 'general_restaurant') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect WebSocket with force reconnect to ensure new token is used
    websocketService.connect(token, true);

    // Handle new dine-in order notification
    const handleNewDineInOrder = (data) => {
      if (data.type === 'new_dine_in_order') {
        // ตรวจสอบว่าเป็น order ของร้านนี้หรือไม่ (ถ้ามี restaurant_id ใน event)
        const eventRestaurantId = data.restaurant_id;
        const userRestaurantId = user?.restaurant?.restaurant_id;
        
        // ถ้ามี restaurant_id ใน event ให้เช็คว่าตรงกับร้านนี้หรือไม่
        if (eventRestaurantId && userRestaurantId && eventRestaurantId !== userRestaurantId) {
          console.log('⚠️ Order notification for different restaurant, ignoring');
          return;
        }
        
        const tableNumber = data.table_number || data.payload?.table_number;
        const orderId = data.order_id || data.payload?.order_id;
        
        // เพิ่ม notification ใน panel
        const notification = {
          id: Date.now() + Math.random(),
          type: 'new_order',
          message: `มีออเดอร์ใหม่! โต๊ะที่ ${tableNumber}${orderId ? ` (#${orderId})` : ''}`,
          timestamp: new Date().toISOString(),
          tableNumber,
          orderId
        };
        
        setNotifications(prev => [notification, ...prev].slice(0, 50)); // เก็บสูงสุด 50 รายการ
        
        // อัปเดต badge count
        setNewOrdersCount(prev => {
          const newCount = prev + 1;
          localStorage.setItem('restaurant_new_orders_count', newCount.toString());
          return newCount;
        });
      }
    };

    // Handle bill request notification
    const handleBillRequest = (data) => {
      if (data.type === 'bill_request') {
        // ตรวจสอบว่าเป็น bill request ของร้านนี้หรือไม่
        const eventRestaurantId = data.restaurant_id || data.payload?.restaurant_id;
        const userRestaurantId = user?.restaurant?.restaurant_id;
        
        if (eventRestaurantId && userRestaurantId && eventRestaurantId !== userRestaurantId) {
          console.log('⚠️ Bill request for different restaurant, ignoring');
          return;
        }
        
        const tableNumber = data.table_number || data.payload?.table_number;
        
        // เพิ่ม notification ใน panel
        const notification = {
          id: Date.now() + Math.random(),
          type: 'bill_request',
          message: `โต๊ะที่ ${tableNumber} ร้องขอเช็กบิล`,
          timestamp: new Date().toISOString(),
          tableNumber
        };
        
        setNotifications(prev => [notification, ...prev].slice(0, 50)); // เก็บสูงสุด 50 รายการ
        
        // อัปเดต badge count
        setNewBillRequestsCount(prev => {
          const newCount = prev + 1;
          localStorage.setItem('restaurant_new_bill_requests_count', newCount.toString());
          return newCount;
        });
      }
    };

    websocketService.on('new_dine_in_order', handleNewDineInOrder);
    websocketService.on('bill_request', handleBillRequest);

    return () => {
      websocketService.off('new_dine_in_order', handleNewDineInOrder);
      websocketService.off('bill_request', handleBillRequest);
    };
  }, [user, isAuthenticated]);

  // Sync badge count with actual pending orders count
  const syncNewOrdersCount = (pendingCount) => {
    setNewOrdersCount(pendingCount);
    if (pendingCount === 0) {
      localStorage.removeItem('restaurant_new_orders_count');
    } else {
      localStorage.setItem('restaurant_new_orders_count', pendingCount.toString());
    }
  };

  // Decrease new orders count by 1 (call when order is confirmed)
  const decreaseNewOrdersCount = () => {
    setNewOrdersCount(prev => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        localStorage.removeItem('restaurant_new_orders_count');
      } else {
        localStorage.setItem('restaurant_new_orders_count', newCount.toString());
      }
      return newCount;
    });
  };

  // Clear new orders count (call when user views orders page)
  const clearNewOrdersCount = () => {
    setNewOrdersCount(0);
    localStorage.removeItem('restaurant_new_orders_count');
  };

  // Clear bill requests count
  const clearNewBillRequestsCount = () => {
    setNewBillRequestsCount(0);
    localStorage.removeItem('restaurant_new_bill_requests_count');
  };

  // Remove notification from panel
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Sync notifications with actual orders (remove notifications for paid/completed orders)
  const syncNotificationsWithOrders = (orders) => {
    setNotifications(prev => {
      // Filter out notifications for orders that are paid or cancelled
      const filtered = prev.filter(notification => {
        // For bill_request notifications: check if any order from that table still has bill_requested = true
        if (notification.type === 'bill_request' && notification.tableNumber) {
          // Check ALL orders for this table (including paid ones to see if bill was completed)
          const tableOrders = orders.filter(order => 
            order.table_number === notification.tableNumber
          );
          
          // If no orders found for this table, remove notification
          if (tableOrders.length === 0) {
            console.log(`🗑️ Removing bill_request notification: No orders found for table ${notification.tableNumber}`);
            return false;
          }
          
          // Check if all orders for this table are paid or cancelled
          const allPaidOrCancelled = tableOrders.every(order => 
            order.payment_status === 'paid' || order.current_status === 'cancelled'
          );
          if (allPaidOrCancelled) {
            console.log(`🗑️ Removing bill_request notification: All orders paid/cancelled for table ${notification.tableNumber}`);
            return false;
          }
          
          // Check if any unpaid order still has bill_requested = true
          const unpaidOrders = tableOrders.filter(order => 
            order.payment_status !== 'paid' && order.current_status !== 'cancelled'
          );
          
          if (unpaidOrders.length === 0) {
            console.log(`🗑️ Removing bill_request notification: No unpaid orders for table ${notification.tableNumber}`);
            return false;
          }
          
          const hasActiveBillRequest = unpaidOrders.some(order => order.bill_requested === true);
          if (!hasActiveBillRequest) {
            console.log(`🗑️ Removing bill_request notification: No active bill request for table ${notification.tableNumber}`);
            return false;
          }
          
          return true; // Keep notification
        }
        
        // For new_order notifications: ลบเมื่อ order ไม่ใช่ pending แล้ว (confirm/processing/completed)
        if (notification.type === 'new_order' && notification.orderId) {
          const matchingOrder = orders.find(order => 
            order.dine_in_order_id === notification.orderId
          );
          
          if (matchingOrder) {
            // Remove if order is paid or cancelled
            if (matchingOrder.payment_status === 'paid' || matchingOrder.current_status === 'cancelled') {
              console.log(`🗑️ Removing new_order notification: Order ${notification.orderId} is paid/cancelled`);
              return false;
            }
            // Remove if order status is no longer pending (confirmed/preparing/ready/served/completed)
            if (matchingOrder.current_status !== 'pending') {
              console.log(`🗑️ Removing new_order notification: Order ${notification.orderId} is no longer pending (status: ${matchingOrder.current_status})`);
              return false;
            }
            // Keep if order is still pending
            return true;
          }
          
          // If order not found in the list, it might have been deleted or filtered
          // For safety, remove the notification
          console.log(`🗑️ Removing new_order notification: Order ${notification.orderId} not found`);
          return false;
        }

        // Keep notification if type is unknown (shouldn't happen)
        console.warn(`⚠️ Unknown notification type: ${notification.type}`);
        return true;
      });
      
      if (prev.length !== filtered.length) {
        console.log(`🔄 Synced notifications: ${prev.length} → ${filtered.length} (removed ${prev.length - filtered.length})`);
      }
      return filtered;
    });
  };

  return (
    <RestaurantNotificationContext.Provider
      value={{
        newOrdersCount,
        newBillRequestsCount,
        notifications,
        syncNewOrdersCount,
        decreaseNewOrdersCount,
        clearNewOrdersCount,
        clearNewBillRequestsCount,
        removeNotification,
        clearNotifications,
        syncNotificationsWithOrders,
      }}
    >
      {children}
    </RestaurantNotificationContext.Provider>
  );
};

