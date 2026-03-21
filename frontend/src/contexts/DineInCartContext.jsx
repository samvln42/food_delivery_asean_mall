import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const DineInCartContext = createContext();

export const useDineInCart = () => {
  const context = useContext(DineInCartContext);
  if (!context) {
    throw new Error('useDineInCart must be used within a DineInCartProvider');
  }
  return context;
};

export const DineInCartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);

  // สร้าง session ID เมื่อเริ่มต้น
  useEffect(() => {
    const storedSessionId = localStorage.getItem('dine_in_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('dine_in_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // ดึงข้อมูลตะกร้า
  const fetchCart = useCallback(async () => {
    if (!sessionId || !qrCodeData) return;

    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/dine-in-carts/`, {
        params: { session_id: sessionId }
      });

      if (response.data.results && response.data.results.length > 0) {
        setCart(response.data.results[0]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, [sessionId, qrCodeData]);

  // Restore qrCodeData and info from localStorage on mount
  useEffect(() => {
    const storedQrCodeData = localStorage.getItem('dine_in_qr_code_data');
    if (storedQrCodeData) {
      setQrCodeData(storedQrCodeData);
    }
    
    // Restore restaurant and table info if available
    const storedRestaurantInfo = localStorage.getItem('dine_in_restaurant_info');
    const storedTableInfo = localStorage.getItem('dine_in_table_info');
    if (storedRestaurantInfo) {
      try {
        setRestaurantInfo(JSON.parse(storedRestaurantInfo));
      } catch (e) {
        console.error('Error parsing restaurant info:', e);
      }
    }
    if (storedTableInfo) {
      try {
        setTableInfo(JSON.parse(storedTableInfo));
      } catch (e) {
        console.error('Error parsing table info:', e);
      }
    }
  }, []);

  // ดึงข้อมูลตะกร้าเมื่อมี session ID และ qrCodeData
  useEffect(() => {
    if (sessionId && qrCodeData) {
      fetchCart();
    }
  }, [sessionId, qrCodeData, fetchCart]);

  // ตั้งค่า QR Code และดึงข้อมูลร้าน
  const initializeDineIn = async (qrCode) => {
    try {
      setLoading(true);
      setError(null);
      setQrCodeData(qrCode);
      setRestaurantInfo(null);
      setTableInfo(null);

      // ล้าง cache เก่าก่อนโหลดใหม่เสมอ เพื่อไม่ให้ข้อมูลโต๊ะที่ลบไปค้าง
      localStorage.removeItem('dine_in_qr_code_data');
      localStorage.removeItem('dine_in_restaurant_info');
      localStorage.removeItem('dine_in_table_info');

      // ดึงข้อมูลโต๊ะและร้าน
      const response = await axios.get(`${API_CONFIG.BASE_URL}/restaurant-tables/by-qr-code/`, {
        params: { qr_code_data: qrCode }
      });

      setTableInfo(response.data.table);
      setRestaurantInfo(response.data.restaurant);

      // Save qrCodeData and info to localStorage
      localStorage.setItem('dine_in_qr_code_data', qrCode);
      localStorage.setItem('dine_in_restaurant_info', JSON.stringify(response.data.restaurant));
      localStorage.setItem('dine_in_table_info', JSON.stringify(response.data.table));

      // สร้างหรือดึงตะกร้า
      await getOrCreateCart(qrCode);

      return response.data;
    } catch (err) {
      console.error('Error initializing dine-in:', err);
      const errMsg = err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลร้านได้';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // สร้างหรือดึงตะกร้า
  const getOrCreateCart = async (qrCode) => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/dine-in-carts/get-or-create/`, {
        qr_code_data: qrCode || qrCodeData,
        session_id: sessionId
      });

      setCart(response.data.cart);
      return response.data.cart;
    } catch (err) {
      console.error('Error getting cart:', err);
      throw err;
    }
  };

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = async (productId, quantity = 1, specialInstructions = '') => {
    if (!cart) {
      throw new Error('Cart not initialized. Please scan QR code first.');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/dine-in-carts/${cart.cart_id}/add-item/`,
        {
          product_id: productId,
          quantity: quantity,
          special_instructions: specialInstructions,
          session_id: sessionId
        },
        {
          params: { session_id: sessionId }
        }
      );

      setCart(response.data.cart);
      return response.data;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err.response?.data?.error || 'ไม่สามารถเพิ่มสินค้าได้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตรายการในตะกร้า
  const updateCartItem = async (itemId, quantity, specialInstructions = '') => {
    if (!cart) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/dine-in-carts/${cart.cart_id}/update-item/${itemId}/`,
        {
          quantity: quantity,
          special_instructions: specialInstructions,
          session_id: sessionId
        },
        {
          params: { session_id: sessionId }
        }
      );

      setCart(response.data.cart);
      return response.data;
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError(err.response?.data?.error || 'ไม่สามารถอัปเดตสินค้าได้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = async (itemId) => {
    if (!cart) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}/dine-in-carts/${cart.cart_id}/remove-item/${itemId}/`,
        {
          params: { session_id: sessionId }
        }
      );

      setCart(response.data.cart);
      return response.data;
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.response?.data?.error || 'ไม่สามารถลบสินค้าได้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ล้างตะกร้า
  const clearCart = async () => {
    if (!cart) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/dine-in-carts/${cart.cart_id}/clear/`,
        { session_id: sessionId },
        { params: { session_id: sessionId } }
      );

      setCart(response.data.cart);
      return response.data;
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.response?.data?.error || 'ไม่สามารถล้างตะกร้าได้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // สั่งอาหาร (Checkout)
  const checkout = async (customerName, customerCount = 1, specialInstructions = '', paymentMethod = 'cash') => {
    if (!cart) {
      throw new Error('Cart is empty');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/dine-in-carts/${cart.cart_id}/checkout/`,
        {
          customer_name: customerName,
          customer_count: customerCount,
          special_instructions: specialInstructions,
          payment_method: paymentMethod,
          session_id: sessionId
        },
        {
          params: { session_id: sessionId }
        }
      );

      // ล้างตะกร้าหลังสั่งอาหารสำเร็จ
      setCart(null);
      
      return response.data;
    } catch (err) {
      console.error('Error during checkout:', err);
      setError(err.response?.data?.error || 'ไม่สามารถสั่งอาหารได้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // รีเซ็ต Dine-in session
  const resetDineIn = () => {
    setCart(null);
    setQrCodeData(null);
    setRestaurantInfo(null);
    setTableInfo(null);
    setError(null);
    // Clear localStorage
    localStorage.removeItem('dine_in_qr_code_data');
    localStorage.removeItem('dine_in_restaurant_info');
    localStorage.removeItem('dine_in_table_info');
  };

  // คำนวณจำนวนสินค้าทั้งหมด
  const getTotalItems = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    error,
    sessionId,
    qrCodeData,
    restaurantInfo,
    tableInfo,
    initializeDineIn,
    getOrCreateCart,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout,
    resetDineIn,
    getTotalItems
  };

  return (
    <DineInCartContext.Provider value={value}>
      {children}
    </DineInCartContext.Provider>
  );
};

export default DineInCartContext;
