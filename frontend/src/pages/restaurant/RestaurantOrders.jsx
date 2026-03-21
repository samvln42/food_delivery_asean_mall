import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { dineInOrderService, dineInOrderDetailService } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurantNotification } from '../../contexts/RestaurantNotificationContext';
import websocketService from '../../services/websocket';
import { toast } from '../../hooks/useNotification';
import { formatPrice } from '../../utils/formatPrice';
import { 
  FaBox, FaReceipt, FaClock, FaCreditCard, FaCheckCircle, FaTimesCircle,
  FaUser, FaEdit, FaUtensils, FaClipboardList, FaHourglassHalf, FaCheck,
  FaSpinner, FaBellSlash, FaMapPin, FaFire, FaPrint, FaPlus, FaShoppingCart, FaSearch, FaTrash
} from 'react-icons/fa';
import { BsTable, BsEggFried } from 'react-icons/bs';
import { MdRestaurant } from 'react-icons/md';

const RestaurantOrders = () => {
  const { translate } = useLanguage();
  const { user } = useAuth();
  const { syncNewOrdersCount, decreaseNewOrdersCount, syncNotificationsWithOrders } = useRestaurantNotification();
  const [dineInOrders, setDineInOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tables'); // เปลี่ยน default เป็น 'tables'
  const [selectedBillTable, setSelectedBillTable] = useState(null); // { table_number, session_id, orders: [...] }
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null); // order object for bill checkout (used in order list)
  const [selectedTable, setSelectedTable] = useState(null); // selected table to view orders
  const [showBillConfirmation, setShowBillConfirmation] = useState(false); // show bill confirmation in table modal
  const [orderToCancel, setOrderToCancel] = useState(null); // order to cancel (for confirmation)
  
  // Add menu to table
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [dineInProducts, setDineInProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuCart, setMenuCart] = useState([]);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [submittingMenuOrder, setSubmittingMenuOrder] = useState(false);

  const t = (key, fallback, vars = {}) => {
    const value = translate(key, vars);
    return value === key ? fallback : value;
  };

  const filterTabs = useMemo(
    () => [
      { key: 'tables', label: t('restaurant.orders.tabs.tables', 'All tables'), icon: BsTable },
      { key: 'pending', label: t('order.status.pending', 'Pending'), icon: FaHourglassHalf },
      { key: 'confirmed', label: t('order.status.confirmed', 'Confirmed'), icon: FaCheckCircle },
      { key: 'served', label: t('dine_in.status.served', 'Served'), icon: FaCheck },
      { key: 'cancelled', label: t('order.status.cancelled', 'Cancelled'), icon: FaTimesCircle },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translate]
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // ใช้ Promise.allSettled เพื่อให้ทำงานแม้จะมี error
        await Promise.allSettled([fetchOrders(), fetchTables()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket connection for real-time notifications (refresh orders when new order arrives)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    // Connect WebSocket with token (only if not already connected)
    websocketService.connect(token);

    // Listen for new dine-in order notifications (refresh orders list)
    const handleNewDineInOrder = (data) => {
      if (data.type === 'new_dine_in_order') {
        // Refresh orders to show new order (toast notification handled by RestaurantNotificationContext)
        fetchOrders();
      }
    };

    // Listen for bill request notifications (refresh orders list)
    const handleBillRequest = (data) => {
      if (data.type === 'bill_request') {
        // Refresh orders to show new bill requests (toast notification handled by RestaurantNotificationContext)
        fetchOrders();
      }
    };

    // Listen when customer cancels item before confirmation (refresh immediately)
    const handleDineInItemCancelled = (data) => {
      if (data.type === 'dine_in_item_cancelled') {
        fetchOrders();
        fetchTables();
      }
    };

    websocketService.on('new_dine_in_order', handleNewDineInOrder);
    websocketService.on('bill_request', handleBillRequest);
    websocketService.on('dine_in_item_cancelled', handleDineInItemCancelled);

    return () => {
      websocketService.off('new_dine_in_order', handleNewDineInOrder);
      websocketService.off('bill_request', handleBillRequest);
      websocketService.off('dine_in_item_cancelled', handleDineInItemCancelled);
      // Don't disconnect WebSocket here - it might be used by other components
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrders = async () => {
    try {
      // ร้านค้า: แสดงเฉพาะ dine-in orders
      const response = await api.get('/dine-in-orders/');
      const raw = response.data.results || response.data;

      const normalized = Array.isArray(raw) ? raw : [];
      // เรียงลำดับ: order ที่ยังไม่ confirm (pending) อยู่บนสุด, served อยู่ล่างสุด
      // ภายใน status เดียวกัน เรียงตาม order_date จากเก่าไปใหม่
      const statusPriority = {
        'pending': 1,
        'confirmed': 2,
        'served': 3,
        'cancelled': 4
      };
      
      const sorted = [...normalized].sort((a, b) => {
        const statusA = a?.current_status || a?.status || 'served';
        const statusB = b?.current_status || b?.status || 'served';
        const priorityA = statusPriority[statusA] || 99;
        const priorityB = statusPriority[statusB] || 99;
        
        // เรียงตาม status priority ก่อน
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // ถ้า status เท่ากัน ให้เรียงตาม order_date จากเก่าไปใหม่
        return new Date(a?.order_date || 0) - new Date(b?.order_date || 0);
      });

      setDineInOrders(sorted);

      // Sync badge count with actual pending orders count
      const pendingOrdersCount = sorted.filter(order => 
        order.current_status === 'pending' && 
        order.payment_status !== 'paid'
      ).length;
      syncNewOrdersCount(pendingOrdersCount);

      // Sync notifications with actual orders (remove notifications for paid/completed orders)
      syncNotificationsWithOrders(sorted);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setDineInOrders([]);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api.get('/restaurant-tables/', {
        params: { is_active: true }
      });
      const raw = response.data.results || response.data;
      setTables(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  };

  const updateDineInOrderStatus = async (orderId, newStatus) => {
    try {
      // Find the order to check its current status
      const order = dineInOrders.find(o => o.dine_in_order_id === orderId);
      const oldStatus = order?.current_status;

      await api.post(`/dine-in-orders/${orderId}/update-status/`, {
        status: newStatus,
        note: '',
      });

      // Refresh orders and tables to sync notifications (ลบ notification ของ order ที่ถูก confirm แล้ว)
      await fetchOrders();
      await fetchTables();

      // ลด badge count เมื่อ confirm หรือ cancel order ที่เป็น pending
      if (oldStatus === 'pending' && (newStatus === 'confirmed' || newStatus === 'cancelled')) {
        decreaseNewOrdersCount();
      }
    } catch (error) {
      console.error('Error updating dine-in order status:', error);
      toast.error(translate('order.update_status_failed'));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const updatePaymentStatus = async (orderId, paymentStatus, paymentMethod = 'cash') => {
    try {
      await dineInOrderService.updatePaymentStatus(orderId, paymentStatus, paymentMethod);
      
      setDineInOrders((prev) =>
        prev.map((order) =>
          order.dine_in_order_id === orderId
            ? { ...order, payment_status: paymentStatus, payment_method: paymentMethod }
            : order
        )
      );

      // Removed toast notification
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  // ล้างคำขอเช็กบิล (ปิดคำขอ ไม่ชำระเงิน)
  const dismissBillRequest = async (orderId) => {
    try {
      await dineInOrderService.dismissBillRequest(orderId);
      
      // Refresh orders and tables to sync notifications
      await fetchOrders();
      await fetchTables();

      setSelectedBillTable(null);
    } catch (error) {
      console.error('Error dismissing bill request:', error);
      toast.error('Failed to dismiss bill request');
    }
  };

  // เช็กบิลเสร็จแล้ว (ลูกค้าชำระเงินแล้ว)
  const completeBill = async (orderId) => {
    try {
      await dineInOrderService.completeBill(orderId);
      
      // Refresh orders and tables immediately to sync notifications
      await fetchOrders();
      await fetchTables();

      // ปิด modal และ reset state
      setSelectedBillTable(null);
      setSelectedOrderForBill(null);
      setShowBillConfirmation(false);
      setSelectedTable(null);
      
      toast.success(t('restaurant.orders.bill_success', 'Bill completed successfully'));
    } catch (error) {
      console.error('Error completing bill:', error);
      toast.error(t('restaurant.orders.bill_error', 'Unable to complete bill'));
    }
  };

  // จัดกลุ่มออเดอร์ที่ร้องขอเช็กบิลตามโต๊ะ/session
  const billRequestsByTable = useMemo(() => {
    // กรองเฉพาะ orders ที่ร้องขอเช็กบิลและ "พร้อมเช็กบิล" เท่านั้น
    // พร้อมเช็กบิล = status เป็น served หรือรายการอาหารทุกตัวถูก mark ว่าเสิร์ฟแล้ว
    const requests = dineInOrders.filter(order => 
      order.bill_requested === true &&
      (() => {
        const status = order.current_status || order.status;
        if (status === 'served') return true;
        const items = order.order_details || order.items || [];
        return items.length > 0 && items.every(item => item.is_served === true);
      })() &&
      order.current_status !== 'cancelled' && 
      order.payment_status !== 'paid'
    );
    const grouped = {};
    
    requests.forEach(order => {
      // จัดกลุ่มระดับ "โต๊ะ" ไม่แยก session เพื่อให้บิลเช็กทั้งโต๊ะจริง
      const key = `${order.table_number || order.table}`;
      if (!grouped[key]) {
        grouped[key] = {
          table_number: order.table_number || order.table,
          session_id: order.session_id,
          orders: []
        };
      }
      grouped[key].orders.push(order);
    });

    return Object.values(grouped).map(group => ({
      ...group,
      totalAmount: group.orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      unpaidAmount: group.orders
        .filter(o => o.payment_status !== 'paid')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    }));
  }, [dineInOrders]);

  // คำนวณสถานะของแต่ละโต๊ะ (แสดงเฉพาะออเดอร์ที่ยังไม่เสร็จ)
  const getTableStatus = (table) => {
    // หา orders ที่เกี่ยวข้องกับโต๊ะนี้และยังไม่เสร็จ (ไม่รวม paid และ cancelled)
    const tableOrders = dineInOrders.filter(order => {
      const orderTableId = order.table?.table_id || order.table_id || order.table;
      const isMatchingTable = orderTableId === table.table_id || order.table_number === table.table_number;
      // กรองเฉพาะออเดอร์ที่ยังไม่เสร็จ (ไม่ paid และไม่ cancelled)
      return isMatchingTable && 
             order.payment_status !== 'paid' && 
             order.current_status !== 'cancelled';
    });

    // ตรวจสอบว่ามี orders ที่ยังไม่เสร็จหรือยังไม่ชำระเงิน
    const hasActiveOrders = tableOrders.some(order => 
      order.current_status !== 'served'
    );

    const hasUnpaidOrders = tableOrders.length > 0;

    // คำนวณยอดรวมที่ยังไม่ชำระ
    const unpaidAmount = tableOrders
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

    return {
      hasActiveOrders,
      hasUnpaidOrders,
      unpaidAmount,
      orderCount: tableOrders.length,
      activeOrderCount: tableOrders.filter(order => 
        order.current_status !== 'served'
      ).length
    };
  };

  // ดึง orders ของโต๊ะที่เลือก (แสดงเฉพาะออเดอร์ที่ยังไม่เสร็จ)
  const getTableOrders = (table) => {
    return dineInOrders
      .filter(order => {
        const orderTableId = order.table?.table_id || order.table_id || order.table;
        const isMatchingTable = orderTableId === table.table_id || order.table_number === table.table_number;
        // กรองเฉพาะออเดอร์ที่ยังไม่เสร็จ (ไม่ paid และไม่ cancelled)
        return isMatchingTable && 
               order.payment_status !== 'paid' && 
               order.current_status !== 'cancelled';
      })
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
  };

  const getFilteredOrders = () => {
    if (filter === 'tables') {
      return []; // แสดง tables แทน orders
    }
    return dineInOrders.filter(order => (order.current_status || order.status) === filter);
  };

  // Fetch dine-in products for add menu modal
  const fetchDineInProducts = async () => {
    try {
      setLoadingMenu(true);
      
      // Get restaurant ID
      let restaurantId = null;
      if (user?.restaurant_info?.id) {
        restaurantId = user.restaurant_info.id;
      } else if (user?.restaurant?.restaurant_id) {
        restaurantId = user.restaurant.restaurant_id;
      } else if (user?.restaurant_id) {
        restaurantId = user.restaurant_id;
      } else {
        const restaurantsResponse = await api.get('/restaurants/');
        const restaurantsList = restaurantsResponse.data.results || restaurantsResponse.data;
        if (restaurantsList && restaurantsList.length > 0) {
          restaurantId = restaurantsList[0].restaurant_id;
        }
      }
      
      if (restaurantId) {
        // Get dine-in products
        const productsResponse = await api.get('/dine-in-products/', {
          params: { 
            restaurant: restaurantId,
            is_available: true 
          }
        });
        const productsData = productsResponse.data.results || productsResponse.data;
        setDineInProducts(Array.isArray(productsData) ? productsData : []);
        
        // Get categories
        const categoriesResponse = await api.get('/categories/');
        const categoriesData = categoriesResponse.data.results || categoriesResponse.data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        toast.error(t('restaurant.orders.error_no_restaurant', 'Restaurant data not found'));
      }
    } catch (error) {
      console.error('Error fetching dine-in products:', error);
      toast.error(t('restaurant.orders.error_load_products', 'Unable to load menu items'));
    } finally {
      setLoadingMenu(false);
    }
  };

  // Filter dine-in products
  const getFilteredDineInProducts = () => {
    let filtered = dineInProducts;
    
    if (menuSearchTerm) {
      const search = menuSearchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.product_name?.toLowerCase().includes(search)
      );
    }
    
    if (menuCategoryFilter) {
      filtered = filtered.filter(product => 
        product.category === parseInt(menuCategoryFilter)
      );
    }
    
    return filtered;
  };

  // Menu cart functions
  const addToMenuCart = (product) => {
    const existingItem = menuCart.find(item => item.dine_in_product_id === product.dine_in_product_id);
    
    if (existingItem) {
      setMenuCart(menuCart.map(item =>
        item.dine_in_product_id === product.dine_in_product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setMenuCart([...menuCart, {
        dine_in_product_id: product.dine_in_product_id,
        product_name: product.product_name,
        price: parseFloat(product.price),
        quantity: 1
      }]);
    }
  };

  const removeFromMenuCart = (productId) => {
    setMenuCart(menuCart.filter(item => item.dine_in_product_id !== productId));
  };

  const updateMenuCartQuantity = (productId, change) => {
    setMenuCart(menuCart.map(item => {
      if (item.dine_in_product_id === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const calculateMenuSubtotal = () => {
    return menuCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const resetMenuForm = () => {
    setMenuCart([]);
    setMenuSearchTerm('');
    setMenuCategoryFilter('');
  };

  const handleCreateMenuOrder = async () => {
    if (menuCart.length === 0) {
      alert(t('restaurant.orders.select_items_required', 'Please select items'));
      return;
    }

    if (!selectedTable) {
      alert(t('restaurant.orders.error_no_table', 'Table data not found'));
      return;
    }

    try {
      setSubmittingMenuOrder(true);

      // Generate session ID
      const sessionId = `restaurant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get restaurant ID
      let restaurantId = null;
      if (user?.restaurant_info?.id) {
        restaurantId = user.restaurant_info.id;
      } else if (user?.restaurant?.restaurant_id) {
        restaurantId = user.restaurant.restaurant_id;
      } else if (user?.restaurant_id) {
        restaurantId = user.restaurant_id;
      } else {
        const restaurantsResponse = await api.get('/restaurants/');
        const restaurantsList = restaurantsResponse.data.results || restaurantsResponse.data;
        if (restaurantsList && restaurantsList.length > 0) {
          restaurantId = restaurantsList[0].restaurant_id;
        }
      }

      if (!restaurantId) {
        alert(t('restaurant.orders.error_no_restaurant', 'Restaurant data not found'));
        return;
      }

      // Create cart
      const qrCodeData = selectedTable.qr_code_data;
      const cartResponse = await api.post('/dine-in-carts/get-or-create/', {
        qr_code_data: qrCodeData,
        session_id: sessionId
      });

      const cart = cartResponse.data.cart;

      // Add items to cart
      for (const item of menuCart) {
        await api.post(`/dine-in-carts/${cart.cart_id}/add-item/`, {
          product_id: item.dine_in_product_id,
          quantity: item.quantity,
          special_instructions: '',
          session_id: sessionId
        }, {
          params: { session_id: sessionId }
        });
      }

      // Checkout cart to create order
      await api.post(`/dine-in-carts/${cart.cart_id}/checkout/`, {
        customer_name: '',
        customer_count: 1,
        special_instructions: '',
        payment_method: 'cash',
        session_id: sessionId
      }, {
        params: { session_id: sessionId }
      });

      toast.success(t('restaurant.orders.create_order_success', 'Order created successfully!'));
      setShowAddMenuModal(false);
      resetMenuForm();
      
      // Refresh orders
      await fetchOrders();
      await fetchTables();
    } catch (error) {
      console.error('Error creating menu order:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || t('restaurant.orders.error_create_order', 'Unable to create order');
      toast.error(t('restaurant.orders.error_with_message', 'Error: {message}', { message: errorMessage }));
    } finally {
      setSubmittingMenuOrder(false);
    }
  };

  const getStatusDisplay = (status) => {
    const translatedStatusMap = {
      pending: { text: t('order.status.pending', 'Pending'), color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: t('order.status.confirmed', 'Confirmed'), color: 'bg-blue-100 text-blue-800' },
      served: { text: t('dine_in.status.served', 'Served'), color: 'bg-emerald-100 text-emerald-800' },
      cancelled: { text: t('order.status.cancelled', 'Cancelled'), color: 'bg-red-100 text-red-800' },
    };

    return translatedStatusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  // ฟังก์ชันพิมพ์ออเดอร์
  // eslint-disable-next-line no-unused-vars
  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    const items = order.order_details || order.items || [];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('restaurant.orders.print.order_title', 'Order #{id}', { id: order.dine_in_order_id })}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
            body {
              font-family: 'Sarabun', 'Kanit', Arial, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .order-info {
              margin-bottom: 25px;
              text-align: center;
            }
            .order-info p {
              margin: 8px 0;
              font-size: 18px;
            }
            .items {
              padding: 15px 0;
              margin: 20px 0;
            }
            .item {
              margin-bottom: 15px;
              font-size: 18px;
              display: flex;
              justify-content: space-between;
            }
            .item-quantity {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t('restaurant.orders.print.order_title', 'Order #{id}', { id: order.dine_in_order_id })}</h1>
          </div>
          <div class="order-info">
            <p><strong>${t('restaurant.orders.print.table_label', 'Table {number}', { number: order.table_number || '-' })}</strong></p>
          </div>
          <div class="items">
            ${items.map(item => `
              <div class="item">
                <span>${item.product_name}</span>
                <span class="item-quantity">${item.quantity}x</span>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // ฟังก์ชันพิมพ์บิล
  const printBill = (billTable) => {
    const printWindow = window.open('', '_blank');
    const orders = billTable.orders || [];
    const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    // รวมรายการทั้งหมดจากทุกออเดอร์ และรวม quantity ของเมนูเดียวกัน
    const itemMap = new Map();
    orders.forEach(order => {
      const items = order.order_details || order.items || [];
      items.forEach(item => {
        const key = item.product_id || item.product_name;
        const itemSubtotal = parseFloat(item.subtotal || item.price_at_order * item.quantity);
        const unitPrice = parseFloat(item.price_at_order || (item.subtotal / item.quantity));
        if (itemMap.has(key)) {
          const existing = itemMap.get(key);
          existing.quantity += item.quantity;
          existing.subtotal += itemSubtotal;
        } else {
          itemMap.set(key, {
            product_name: item.product_name,
            quantity: item.quantity,
            subtotal: itemSubtotal,
            unitPrice: unitPrice
          });
        }
      });
    });
    const allItems = Array.from(itemMap.values());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('restaurant.orders.bill_table_title', 'Bill for table {number}', { number: billTable.table_number })}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
            body {
              font-family: 'Sarabun', 'Kanit', Arial, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .bill-info {
              margin-bottom: 20px;
            }
            .bill-info p {
              margin: 5px 0;
            }
            .items {
              margin: 20px 0;
              padding: 15px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            .items-table th {
              text-align: left;
              padding: 8px 4px;
              border-bottom: 2px solid #000;
              font-weight: bold;
            }
            .items-table th:nth-child(2) {
              text-align: center;
            }
            .items-table th:last-child {
              text-align: right;
            }
            .items-table td {
              padding: 8px 4px;
              border-bottom: 1px solid #eee;
            }
            .items-table td:first-child {
              text-align: left;
            }
            .items-table td:nth-child(2) {
              text-align: center;
            }
            .items-table td:last-child {
              text-align: right;
            }
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .total-section {
              text-align: right;
              font-size: 20px;
              font-weight: bold;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #000;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t('restaurant.orders.bill_table_title', 'Bill for table {number}', { number: billTable.table_number })}</h1>
          </div>
          <div class="bill-info">
            <p><strong>${t('restaurant.orders.print.order_count_label', 'Orders:')}</strong> ${orders.length}</p>
            <p><strong>${t('restaurant.orders.print.date_label', 'Date:')}</strong> ${new Date().toLocaleString('th-TH')}</p>
          </div>
          <div class="items">
            <table class="items-table">
              <thead>
                <tr>
                  <th>${t('restaurant.orders.print.item_label', 'Item')}</th>
                  <th>${t('restaurant.orders.print.quantity_label', 'Qty')}</th>
                  <th>${t('restaurant.orders.print.price_label', 'Price')}</th>
                </tr>
              </thead>
              <tbody>
                ${allItems.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="total-section">
            <div>${t('restaurant.orders.print.total_label', 'Total amount:')} ${totalAmount.toFixed(2)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusActions = (order) => {
    const actions = [];
    const status = order.current_status || order.status;
    const id = order.dine_in_order_id;
    switch (status) {
      case 'pending':
        actions.push(
          <button
            key="confirm"
            onClick={() => updateDineInOrderStatus(id, 'confirmed')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <span className="flex items-center gap-2"><FaCheckCircle /> {t('restaurant.orders.confirm_order', 'Confirm order')}</span>
          </button>,
          <button
            key="cancel"
            onClick={() => setOrderToCancel(order)}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 border border-gray-300 transition-all"
          >
            {t('common.cancel', 'Cancel')}
          </button>
        );
        break;
      case 'confirmed':
        // ไม่มีปุ่มเสิร์ฟแล้วปุ่มใหญ่ - ใช้ปุ่มเล็กที่อยู่ด้านขวาของแต่ละ item แทน
        break;
      case 'served':
        // ไม่มี action สำหรับ served - เป็นสถานะสุดท้ายแล้ว
        break;
    }

    // ลบปุ่มเช็กบิลออกจาก order list เพราะมีในหน้าต่างโต๊ะแล้ว

    return actions;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-6xl text-primary-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">{t('restaurant.orders.loading', 'Loading orders...')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('common.loading', 'Please wait a moment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-white min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t('restaurant.orders.title', 'Manage orders')}</h1>
          </div>
        </div>
      </div>

      {/* Bill Requests Section */}
      {billRequestsByTable.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('restaurant.orders.bill_requests', 'Bill requests ({count} tables)', { count: billRequestsByTable.length })}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {billRequestsByTable.map((billTable, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('restaurant.orders.table_modal.title', 'Table {number}', { number: billTable.table_number })}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{t('restaurant.orders.order_count_label', 'Orders:')} {billTable.orders.length}</p>
                    <p className="font-semibold text-gray-900">{t('restaurant.orders.amount_label', 'Total:')} {formatPrice(billTable.unpaidAmount)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBillTable(billTable)}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium transition-colors"
                >
                  {t('restaurant.orders.check_bill', 'Check bill')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {selectedBillTable && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 sticky top-0 z-10 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('restaurant.orders.bill_table_title', 'Bill for table {number}', { number: selectedBillTable.table_number })}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => printBill(selectedBillTable)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <FaPrint /> {t('restaurant.orders.print_bill', 'Print bill')}
                  </button>
                  <button
                    onClick={() => setSelectedBillTable(null)}
                    className="text-gray-500 hover:text-gray-700 p-1.5 rounded transition-colors text-xl -mt-[5px]"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Summary - แสดงเฉพาะยอดรวม */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('restaurant.orders.unpaid_total', 'Unpaid total')}</span>
                  <span className="text-xl font-semibold text-gray-900">{formatPrice(selectedBillTable.unpaidAmount)}</span>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3 mb-6">
                {selectedBillTable.orders.map((order) => {
                  const items = order.order_details || [];
                  return (
                    <div key={order.dine_in_order_id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">#{order.dine_in_order_id}</span>
                      </div>
                      {/* Order Items */}
                      {items.length > 0 && (
                        <div className="space-y-2 text-sm">
                          {items.map((item, idx) => {
                            const orderStatus = order.current_status || order.status;
                            const canMarkServed = orderStatus !== 'pending' && orderStatus !== 'served' && items.length > 1;
                            return (
                            <div key={item.order_detail_id || idx} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className={item.is_served ? 'text-gray-400 line-through' : 'text-gray-600'}>
                                  {item.product_name} x {item.quantity}
                                </span>
                                {item.is_served && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
{t('dine_in.status.served', 'Served')}
                                  </span>
                                )}
                              </div>
                              {canMarkServed && !item.is_served && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await dineInOrderDetailService.markServed(item.order_detail_id);
                                      await fetchOrders();
                                      await fetchTables();
                                    } catch (error) {
                                      console.error('Error marking item as served:', error);
                                      toast.error(t('restaurant.orders.error_mark_served', 'Unable to mark item as served'));
                                    }
                                  }}
                                  className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                                >
{t('dine_in.status.served', 'Served')}
                                </button>
                              )}
                              {canMarkServed && item.is_served && (
                                <button
                                  onClick={async () => {
                                    try {
                                            await dineInOrderDetailService.markUnserved(item.order_detail_id);
                                            await fetchOrders();
                                            if (filter === 'tables') {
                                              await fetchTables();
                                            }
                                      await fetchTables();
                                    } catch (error) {
                                      console.error('Error marking item as unserved:', error);
                                      toast.error(t('restaurant.orders.error_unserve', 'Unable to undo served status'));
                                    }
                                  }}
                                  className="text-xs bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition-colors"
                                >
{t('restaurant.orders.item_not_served', 'Not served')}
                                </button>
                              )}
                            </div>
                          )})}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const firstOrderId = selectedBillTable.orders[0]?.dine_in_order_id;
                    if (firstOrderId) {
                      await completeBill(firstOrderId);
                    }
                  }}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaCheckCircle /> {t('restaurant.orders.confirm_bill_paid', 'Confirm bill (customer paid)')}
                </button>
                <button
                  onClick={async () => {
                    const firstOrderId = selectedBillTable.orders[0]?.dine_in_order_id;
                    if (firstOrderId) {
                      await dismissBillRequest(firstOrderId);
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium border border-gray-300 transition-all"
                >
                  {t('restaurant.orders.dismiss_request', 'Dismiss request')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('restaurant.orders.cancel_confirm_title', 'Confirm order cancellation')}</h3>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  {t('restaurant.orders.cancel_confirm_message', 'Do you want to cancel order #{id}?', { id: orderToCancel.dine_in_order_id })}
                </p>
                <p className="text-sm text-gray-500">
                  {t('restaurant.orders.cancel_confirm_warning', 'This cancellation cannot be undone')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await updateDineInOrderStatus(orderToCancel.dine_in_order_id, 'cancelled');
                    setOrderToCancel(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all"
                >
                  {t('restaurant.orders.confirm_cancel', 'Confirm cancellation')}
                </button>
                <button
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-200 border border-gray-300 transition-all"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Bill Modal (for individual order checkout from order list - shows all orders in same table/session) */}
      {selectedOrderForBill && filter !== 'tables' && (() => {
        // จัดกลุ่ม orders ในโต๊ะเดียวกัน (session เดียวกัน)
        const tableOrders = dineInOrders.filter(order => 
          order.table_number === selectedOrderForBill.table_number &&
          order.session_id === selectedOrderForBill.session_id &&
          order.current_status !== 'cancelled' &&
          order.payment_status !== 'paid'
        );
        
        const totalAmount = tableOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const unpaidAmount = tableOrders
          .filter(o => o.payment_status !== 'paid')
          .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaReceipt className="text-3xl text-white" />
                    <div>
                      <h2 className="text-2xl font-bold">
                        {t('restaurant.orders.bill_table_title', 'Bill for table {number}', { number: selectedOrderForBill.table_number })}
                      </h2>
                      <p className="text-green-100 text-sm">
                        {t('restaurant.orders.order_count_short', '{count} orders', { count: tableOrders.length })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrderForBill(null)}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Orders List */}
                <div className="space-y-4 mb-6">
                  {tableOrders.map((order) => (
                    <div key={order.dine_in_order_id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {t('restaurant.orders.order_number', 'Order #{id}', { id: order.dine_in_order_id })}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.payment_status === 'paid' ? (
                                <span className="flex items-center gap-1"><FaCheckCircle /> {t('restaurant.orders.payment.paid', 'Paid')}</span>
                              ) : (
                                <span className="flex items-center gap-1"><FaTimesCircle /> {t('restaurant.orders.payment.unpaid', 'Unpaid')}</span>
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {t('common.status', 'Status')}: <span className="font-medium">{getStatusDisplay(order.current_status).text}</span>
                          </p>
                        </div>
                        <span className="text-xl font-bold text-primary-600">{formatPrice(order.total_amount)}</span>
                      </div>
                      {/* Order Items */}
                      <div className="bg-white rounded-lg p-3 mt-3 space-y-2">
                        {(order.order_details || order.items || []).map((item, idx) => {
                          const orderStatus = order.current_status || order.status;
                          const orderItems = order.order_details || order.items || [];
                          const canMarkServed = orderStatus !== 'pending' && orderStatus !== 'served' && orderItems.length > 1;
                          return (
                          <div key={item.order_detail_id || idx} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`font-medium ${item.is_served ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {item.product_name} x {item.quantity}
                              </span>
                              {item.is_served && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
{t('dine_in.status.served', 'Served')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {canMarkServed && !item.is_served && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await dineInOrderDetailService.markServed(item.order_detail_id);
                                      await fetchOrders();
                                    } catch (error) {
                                      console.error('Error marking item as served:', error);
                                      toast.error(t('restaurant.orders.error_mark_served', 'Unable to mark item as served'));
                                    }
                                  }}
                                  className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                                >
{t('dine_in.status.served', 'Served')}
                                </button>
                              )}
                              {canMarkServed && item.is_served && (
                                <button
                                  onClick={async () => {
                                    try {
                                            await dineInOrderDetailService.markUnserved(item.order_detail_id);
                                            await fetchOrders();
                                            if (filter === 'tables') {
                                              await fetchTables();
                                            }
                                    } catch (error) {
                                      console.error('Error marking item as unserved:', error);
                                      toast.error(t('restaurant.orders.error_unserve', 'Unable to undo served status'));
                                    }
                                  }}
                                  className="text-xs bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition-colors"
                                >
{t('restaurant.orders.item_not_served', 'Not served')}
                                </button>
                              )}
                              <span className="text-gray-700 font-semibold">{formatPrice(item.subtotal ?? (item.price_at_order * item.quantity))}</span>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">{t('restaurant.orders.total_amount_label', 'Total amount:')}</span>
                      <span className="text-2xl font-bold text-green-600">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">{t('restaurant.orders.unpaid_amount_label', 'Unpaid:')}</span>
                      <span className="text-2xl font-bold text-red-600">{formatPrice(unpaidAmount)}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await completeBill(selectedOrderForBill.dine_in_order_id);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center gap-2"><FaCheckCircle /> {t('restaurant.orders.confirm_bill_paid', 'Confirm bill (customer paid)')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Table Orders Modal */}
      {selectedTable && (() => {
        const tableOrders = getTableOrders(selectedTable);
        const status = getTableStatus(selectedTable);
        
        // ตรวจสอบว่ารายการสินค้าทั้งหมดเสิร์ฟหมดแล้วหรือไม่ (รวมทุกออเดอร์)
        // ไม่ต้องแยกว่ากดเสิร์ฟทีละเมนูหรือเสิร์ฟพร้อมกัน แค่ตรวจสอบว่าทุกรายการเสิร์ฟหมดแล้ว
        // ตรวจสอบทั้ง order status และ item is_served - ถ้าอย่างใดอย่างหนึ่งบอกว่าเสิร์ฟหมดแล้ว ก็ถือว่าเสิร์ฟหมดแล้ว
        const allItemsServed = tableOrders.length > 0 && tableOrders.every(order => {
          const orderStatus = order.current_status || order.status;
          const items = order.order_details || order.items || [];
          
          // ถ้าไม่มี items ถือว่าเสิร์ฟหมดแล้ว
          if (items.length === 0) return true;
          
          // ถ้า order status เป็น 'served' แล้ว ถือว่าทุก item เสิร์ฟหมดแล้ว
          if (orderStatus === 'served') return true;
          
          // ตรวจสอบว่าทุก item มี is_served === true (รองรับทั้ง boolean, string, และ number)
          // ถ้าทุก item เสิร์ฟหมดแล้ว ก็ถือว่าเสิร์ฟหมดแล้ว
          const allItemsServedInOrder = items.every(item => {
            const isServed = item.is_served === true || item.is_served === 'true' || item.is_served === 1;
            return isServed;
          });
          
          return allItemsServedInOrder;
        });
        
        // แสดงปุ่มพิมพ์บิลและเช็กบิลเมื่อมีออเดอร์ที่ยังไม่ชำระ และรายการสินค้าทั้งหมดเสิร์ฟหมดแล้ว
        const canShowBillButtons = status.hasUnpaidOrders && allItemsServed && !showBillConfirmation;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="border-b border-gray-200 px-6 py-4 sticky top-0 z-10 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('restaurant.orders.table_modal.title', 'Table {number}', { number: selectedTable.table_number })}
                  </h2>
                  <div className="flex items-center gap-4">
                    {/* ปุ่มพิมพ์บิล - แสดงเมื่อมีออเดอร์ที่ยังไม่ชำระ และรายการสินค้าทั้งหมดเสิร์ฟหมดแล้ว */}
                    {canShowBillButtons && (() => {
                      const tableOrders = getTableOrders(selectedTable);
                      const billData = {
                        table_number: selectedTable.table_number,
                        orders: tableOrders
                      };
                      return (
                        <button
                          onClick={() => printBill(billData)}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                          <FaPrint /> {t('restaurant.orders.print_bill', 'Print bill')}
                        </button>
                      );
                    })()}
                    {/* ปุ่มเพิ่มเมนู */}
                    <button
                      onClick={() => {
                        setShowAddMenuModal(true);
                        fetchDineInProducts();
                      }}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <FaPlus /> {t('restaurant.orders.add_menu', 'Add menu')}
                    </button>
                    {/* ปุ่มเช็กบิล - แสดงเฉพาะเมื่อมีออเดอร์ที่ยังไม่ชำระ และรายการสินค้าทั้งหมดเสิร์ฟหมดแล้ว */}
                    {canShowBillButtons && (
                      <button
                        onClick={() => setShowBillConfirmation(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <FaReceipt /> {t('restaurant.orders.check_bill', 'Check bill')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTable(null);
                        setShowBillConfirmation(false);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1.5 rounded transition-colors text-xl -mt-[5px]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Status Summary - แสดงเฉพาะยอดรวม */}
                {status.unpaidAmount > 0 && (
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('restaurant.orders.unpaid_total', 'Unpaid total')}</span>
                      <span className="text-xl font-semibold text-gray-900">{formatPrice(status.unpaidAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Bill Confirmation Buttons - แสดงเมื่อกดปุ่มเช็กบิล */}
                {showBillConfirmation && (
                  <div className="mb-6 flex gap-4">
                    <button
                      onClick={async () => {
                        // หา order แรกที่ยังไม่ชำระเพื่อใช้เช็กบิล
                        const firstUnpaidOrder = tableOrders.find(order => 
                          order.payment_status !== 'paid' && order.current_status !== 'cancelled'
                        );
                        if (firstUnpaidOrder) {
                          await completeBill(firstUnpaidOrder.dine_in_order_id);
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <FaCheckCircle /> {t('restaurant.orders.confirm_bill_paid', 'Confirm bill (customer paid)')}
                    </button>
                    <button
                      onClick={() => setShowBillConfirmation(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium border border-gray-300 transition-all"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </div>
                )}

                {/* Orders List */}
                    {tableOrders.length > 0 ? (
                      <div className="space-y-3">
                        {tableOrders.map((order) => {
                          const statusInfo = getStatusDisplay(order.current_status || order.status);
                          const items = order.order_details || order.items || [];
                          // ตรวจสอบว่ารายการสินค้าทั้งหมดเสิร์ฟหมดแล้วหรือไม่
                          const allItemsServed = items.length === 0 || items.every(item => item.is_served === true);
                          const orderStatus = order.current_status || order.status;
                          // ถ้ารายการสินค้าเสิร์ฟหมดแล้วและ status ยังเป็น 'confirmed' ให้แสดงเป็น 'เสิร์ฟแล้ว'
                          const shouldShowServedStatus = orderStatus === 'confirmed' && allItemsServed;
                          
                          // สำหรับ modal ให้ลบปุ่มเช็กบิลออก (ใช้ปุ่มใน header แทน)
                          const allActions = getStatusActions(order);
                          const actions = allActions.filter(action => {
                            // กรองปุ่มเช็กบิลออก (เช็คจาก key หรือ text)
                            if (action?.key === 'check-bill') return false;
                            // กรองปุ่มเสิร์ฟแล้วออกถ้ารายการสินค้าเสิร์ฟหมดแล้ว
                            if (action?.key === 'served' && allItemsServed) return false;
                            return true;
                          });
                          
                          return (
                            <div key={order.dine_in_order_id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                              {/* Order Header */}
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-gray-900">#{order.dine_in_order_id}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    shouldShowServedStatus 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : statusInfo.color
                                  }`}>
                                    {shouldShowServedStatus ? t('dine_in.status.served', 'Served') : statusInfo.text}
                                  </span>
                                </div>
                                
                                {/* Order Items - แสดงแบบเรียบง่าย */}
                                {items.length > 0 && (
                                  <div className="space-y-2 text-sm">
                                    {items.map((item, index) => {
                                      const orderStatus = order.current_status || order.status;
                                      // แสดงปุ่มเสิร์ฟแล้ว/ยังไม่เสิร์ฟสำหรับทุก item (ไม่ต้องเช็ค items.length > 1)
                                      const canMarkServed = orderStatus !== 'pending' && orderStatus !== 'served';
                                      return (
                                      <div key={item.order_detail_id || index} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className={item.is_served ? 'text-gray-400 line-through' : 'text-gray-600'}>
                                            {item.product_name} x{item.quantity}
                                          </span>
                                          {item.is_served && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
{t('dine_in.status.served', 'Served')}
                                            </span>
                                          )}
                                        </div>
                                        {canMarkServed && !item.is_served && (
                                          <button
                                            onClick={async () => {
                                              try {
                                                await dineInOrderDetailService.markServed(item.order_detail_id);
                                                await fetchOrders();
                                              } catch (error) {
                                                console.error('Error marking item as served:', error);
                                                toast.error(t('restaurant.orders.error_mark_served', 'Unable to mark item as served'));
                                              }
                                            }}
                                            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                                          >
{t('dine_in.status.served', 'Served')}
                                          </button>
                                        )}
                                        {canMarkServed && item.is_served && (
                                          <button
                                            onClick={async () => {
                                              try {
                                            await dineInOrderDetailService.markUnserved(item.order_detail_id);
                                            await fetchOrders();
                                            if (filter === 'tables') {
                                              await fetchTables();
                                            }
                                              } catch (error) {
                                                console.error('Error marking item as unserved:', error);
                                                toast.error(t('restaurant.orders.error_unserve', 'Unable to undo served status'));
                                              }
                                            }}
                                            className="text-xs bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition-colors"
                                          >
{t('restaurant.orders.item_not_served', 'Not served')}
                                          </button>
                                        )}
                                      </div>
                                    )})}
                                  </div>
                                )}

                                {/* Actions */}
                                {actions.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {actions}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('restaurant.orders.empty_orders', 'No orders')}</h3>
                        <p className="text-gray-500">{t('restaurant.orders.empty_table_orders', 'No orders for this table yet')}</p>
                      </div>
                    )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {filterTabs.map((tab) => {
            let count = 0;
            if (tab.key === 'tables') {
              count = tables.length;
            } else {
              count = dineInOrders.filter(
                (order) => (order.current_status || order.status) === tab.key
              ).length;
            }
            
            return (
              <button
                key={tab.key}
                    onClick={() => {
                  setFilter(tab.key);
                  setSelectedTable(null); // รีเซ็ต selected table เมื่อเปลี่ยนแท็บ
                  setShowBillConfirmation(false); // รีเซ็ต bill confirmation
                }}
                className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 relative ${
                  filter === tab.key
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {React.createElement(tab.icon, { className: "text-lg" })}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  filter === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables List */}
      {filter === 'tables' && (
        <>
          {tables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => {
                const status = getTableStatus(table);
                // eslint-disable-next-line no-unused-vars
                const tableOrders = getTableOrders(table);
                
                return (
                  <div 
                    key={table.table_id} 
                    className={`bg-white border-2 rounded-lg cursor-pointer transition-all ${
                      status.hasActiveOrders 
                        ? 'border-orange-400 bg-orange-50 hover:border-orange-500 hover:bg-orange-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{t('restaurant.tables.table_number', 'Table {number}', { number: table.table_number })}</h3>
                        {status.hasActiveOrders && (
                          <span className="text-xs text-orange-600 font-medium">{t('restaurant.orders.table_status.active', 'Has active orders')}</span>
                        )}
                        {!status.hasActiveOrders && status.hasUnpaidOrders && (
                          <span className="text-xs text-yellow-600 font-medium">{t('restaurant.orders.table_status.unpaid', 'Unpaid')}</span>
                        )}
                        {!status.hasActiveOrders && !status.hasUnpaidOrders && (
                          <span className="text-xs text-gray-500 font-medium">{t('restaurant.orders.table_status.empty', 'Available')}</span>
                        )}
                      </div>
                      {status.orderCount > 0 && (
                        <div className="text-sm text-gray-600">
                          <span>{t('restaurant.orders.order_count', 'Orders')}: {status.orderCount}</span>
                          {status.unpaidAmount > 0 && (
                            <span className="ml-3 font-semibold text-gray-900">{t('restaurant.orders.amount', 'Amount')}: {formatPrice(status.unpaidAmount)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-1">{t('restaurant.tables.empty_short', 'No tables')}</h3>
              <p className="text-sm text-gray-500">{t('restaurant.tables.empty_system', 'No tables in the system')}</p>
            </div>
          )}
        </>
      )}

      {/* Orders List */}
      {filter !== 'tables' && filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusDisplay(order.current_status || order.status);
            const actions = getStatusActions(order);
            const items = order.order_details || order.items || [];
            const orderId = order.dine_in_order_id;
            
            return (
              <div key={orderId} className="bg-white border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                {/* Order Header */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">#{orderId}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                    {order.bill_requested && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">
                        {t('restaurant.orders.bill_requested', 'Bill requested')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span>{formatDateTime(order.order_date)}</span>
                    <span>{t('restaurant.tables.table_number', 'Table {number}', { number: order.table_number })}</span>
                  </div>
                </div>

                {/* Order Items */}
                {items.length > 0 && (
                  <div className="mb-3 space-y-2 text-sm">
                    {items.map((item, index) => {
                      const orderStatus = order.current_status || order.status;
                      const canMarkServed = orderStatus !== 'pending' && orderStatus !== 'served' && items.length > 1;
                      return (
                      <div key={item.order_detail_id || index} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className={item.is_served ? 'text-gray-400 line-through' : 'text-gray-600'}>
                            {item.product_name} x {item.quantity}
                          </span>
                          {item.is_served && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
{t('dine_in.status.served', 'Served')}
                            </span>
                          )}
                        </div>
                        {canMarkServed && !item.is_served && (
                          <button
                            onClick={async () => {
                              try {
                                await dineInOrderDetailService.markServed(item.order_detail_id);
                                await fetchOrders();
                              } catch (error) {
                                console.error('Error marking item as served:', error);
                                toast.error(t('restaurant.orders.error_mark_served', 'Unable to mark item as served'));
                              }
                            }}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                          >
{t('dine_in.status.served', 'Served')}
                          </button>
                        )}
                        {canMarkServed && item.is_served && (
                          <button
                            onClick={async () => {
                              try {
                                await dineInOrderDetailService.markUnserved(item.order_detail_id);
                                await fetchOrders();
                                if (filter === 'tables') {
                                  await fetchTables();
                                }
                              } catch (error) {
                                console.error('Error marking item as unserved:', error);
                                toast.error(t('restaurant.orders.error_unserve', 'Unable to undo served status'));
                              }
                            }}
                            className="text-xs bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition-colors"
                          >
{t('restaurant.orders.item_not_served', 'Not served')}
                          </button>
                        )}
                      </div>
                    )})}
                  </div>
                )}

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {actions}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : filter !== 'tables' ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            {filter === 'pending'
              ? t('restaurant.orders.empty_pending', 'No pending orders')
              : t('restaurant.orders.empty_generic', 'No orders')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('restaurant.orders.empty_hint', 'Try another filter to see more orders')}
          </p>
        </div>
      ) : null}

      {/* Add Menu Modal */}
      {showAddMenuModal && selectedTable && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddMenuModal(false);
            resetMenuForm();
          }}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-secondary-800 flex items-center gap-2">
                  <FaShoppingCart className="w-6 h-6 text-primary-600" />
                  {t('restaurant.orders.add_menu_for_table', 'Add menu for table {number}', { number: selectedTable.table_number })}
                </h2>
                <button
                  onClick={() => {
                    setShowAddMenuModal(false);
                    resetMenuForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Main Content: Cart on Left, Products on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Cart - Left Side */}
                <div className="order-2 lg:order-1">
                  <div className="bg-gray-50 rounded-lg p-4 sticky top-0">
                    <h3 className="text-lg font-semibold text-secondary-700 mb-4">
                      {t('restaurant.orders.menu_cart_title', 'Cart ({count} items)', { count: menuCart.length })}
                    </h3>
                    {menuCart.length > 0 ? (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                          {menuCart.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-secondary-800">{item.product_name}</p>
                                <p className="text-sm text-secondary-600">{formatPrice(item.price)} x {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateMenuCartQuantity(item.dine_in_product_id, -1)}
                                  className="w-8 h-8 bg-red-100 text-red-800 rounded hover:bg-red-200"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateMenuCartQuantity(item.dine_in_product_id, 1)}
                                  className="w-8 h-8 bg-green-100 text-green-800 rounded hover:bg-green-200"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeFromMenuCart(item.dine_in_product_id)}
                                  className="ml-2 text-red-600 hover:text-red-800"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-secondary-200">
                          <div className="flex justify-between items-center text-lg font-bold text-primary-600">
                            <span>{t('restaurant.orders.total_amount_label', 'Total amount:')}</span>
                            <span>{formatPrice(calculateMenuSubtotal())}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FaShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>{t('restaurant.orders.menu_cart_empty', 'No items in cart')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Selection - Right Side */}
                <div className="order-1 lg:order-2">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-secondary-700 flex items-center gap-2 mb-4">
                      <FaUtensils className="w-5 h-5" />
                      {t('restaurant.orders.select_items', 'Select items')}
                    </h3>

                    {/* Search and Filter */}
                    <div className="space-y-3 mb-4">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder={t('restaurant.orders.search_items_placeholder', 'Search items...')}
                          value={menuSearchTerm}
                          onChange={(e) => setMenuSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <select
                        value={menuCategoryFilter}
                        onChange={(e) => setMenuCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">{t('restaurant.orders.all_categories', 'All categories')}</option>
                        {categories.map((category) => (
                          <option key={category.category_id} value={category.category_id}>
                            {category.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Products List - Single Column */}
                    {loadingMenu ? (
                      <div className="text-center py-8">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
                        <p className="text-secondary-600">{t('restaurant.orders.loading_products', 'Loading products...')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {getFilteredDineInProducts().map((product) => (
                          <div
                            key={product.dine_in_product_id}
                            className="bg-white border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
                            onClick={() => addToMenuCart(product)}
                          >
                            {product.image_display_url && (
                              <img
                                src={product.image_display_url}
                                alt={product.product_name}
                                className="w-20 h-20 object-cover rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-secondary-800 mb-1 line-clamp-2">
                                {product.product_name}
                              </h4>
                              <p className="text-primary-600 font-bold">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMenuModal(false);
                    resetMenuForm();
                  }}
                  className="flex-1 bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg font-semibold hover:bg-secondary-300 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleCreateMenuOrder}
                  disabled={submittingMenuOrder || menuCart.length === 0}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingMenuOrder
                    ? t('restaurant.orders.creating_order', 'Creating order...')
                    : t('restaurant.orders.create_order', 'Create order')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrders; 

