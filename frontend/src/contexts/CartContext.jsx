import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { appSettingsService } from '../services/api';

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  deliveryFee: 0,
  discount: 0,
  promoCode: '',
  restaurants: {}, // เก็บข้อมูลร้านต่างๆ ที่มีสินค้าในตะกร้า
  deliverySettings: null, // เก็บการตั้งค่าค่าจัดส่ง
};

// Action types
const actionTypes = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_DELIVERY_FEE: 'SET_DELIVERY_FEE',
  SET_DISCOUNT: 'SET_DISCOUNT',
  SET_PROMO_CODE: 'SET_PROMO_CODE',
  LOAD_CART: 'LOAD_CART',
  UPDATE_DELIVERY_SETTINGS: 'UPDATE_DELIVERY_SETTINGS',
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_ITEM: {
      const { product, restaurant } = action.payload;
      
      console.log('Adding item from restaurant:', restaurant.name);
      console.log('Product restaurant status:', product.restaurant_status);
      
      // ตรวจสอบสถานะร้าน
      if (product.restaurant_status !== 'open') {
        console.warn('Cannot add item from closed restaurant');
        throw new Error('This restaurant is closed. Cannot add items to cart.');
      }
      
      // เพิ่มสินค้าจากร้านใดก็ได้ (ไม่จำกัดร้านเดียว)
      const existingItemIndex = state.items.findIndex(
        item => item.product_id === product.product_id
      );
      
      let newItems;
      if (existingItemIndex >= 0) {
        // อัพเดทจำนวนสินค้าที่มีอยู่
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // เพิ่มสินค้าใหม่
        const restaurantId = restaurant.id || restaurant.restaurant_id;
        console.log('Creating new item with restaurant_id:', restaurantId);
        
        const newItem = {
          id: Date.now(),
          product_id: product.product_id,
          product_name: product.product_name,
          price: parseFloat(product.price),
          quantity: 1,
          restaurant_id: restaurantId,
          restaurant_name: restaurant.name,
          image_url: product.image_url,
          image_display_url: product.image_display_url,
          special_instructions: '',
        };
        
        console.log('Created new item:', newItem);
        newItems = [...state.items, newItem];
      }
      
      // อัพเดทข้อมูลร้าน
      const restaurantId = restaurant.id || restaurant.restaurant_id;
      const newRestaurants = {
        ...state.restaurants,
        [restaurantId]: {
          id: restaurantId,
          name: restaurant.name,
          address: restaurant.address || '',
          phone: restaurant.phone_number || '',
        }
      };
      
      const newState = {
        ...state,
        items: newItems,
        restaurants: newRestaurants,
      };
      return calculateTotals(newState);
    }
    
    case actionTypes.UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: actionTypes.REMOVE_ITEM, payload: { itemId } });
      }
      
      const newItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }
    
    case actionTypes.REMOVE_ITEM: {
      const { itemId } = action.payload;
      const newItems = state.items.filter(item => item.id !== itemId);
      
      // อัพเดทข้อมูลร้าน - ลบร้านที่ไม่มีสินค้าแล้ว
      const restaurantIds = [...new Set(newItems.map(item => item.restaurant_id))];
      const newRestaurants = {};
      restaurantIds.forEach(id => {
        if (state.restaurants[id]) {
          newRestaurants[id] = state.restaurants[id];
        }
      });
      
      const newState = {
        ...state,
        items: newItems,
        restaurants: newRestaurants,
      };
      return calculateTotals(newState);
    }
    
    case actionTypes.CLEAR_CART:
      return { ...initialState };
    
    case actionTypes.SET_DELIVERY_FEE:
      const newStateWithDelivery = { ...state, deliveryFee: action.payload };
      return calculateTotals(newStateWithDelivery);
    
    case actionTypes.SET_DISCOUNT:
      const newStateWithDiscount = { ...state, discount: action.payload };
      return calculateTotals(newStateWithDiscount);
    
    case actionTypes.SET_PROMO_CODE:
      return { ...state, promoCode: action.payload };
    
    case actionTypes.LOAD_CART:
      const loadedState = { ...state, ...action.payload };
      return calculateTotals(loadedState);
    
    case actionTypes.UPDATE_DELIVERY_SETTINGS:
      console.log('CartContext - UPDATE_DELIVERY_SETTINGS payload:', action.payload); // เพิ่ม log
      const newStateWithUpdatedSettings = { ...state, deliverySettings: action.payload };
      return calculateTotals(newStateWithUpdatedSettings); // Re-calculate totals after settings update
    
    default:
      return state;
  }
};

// คำนวณค่าจัดส่งสำหรับหลายร้าน
const calculateMultiRestaurantDeliveryFee = (restaurants, settings = null) => {
  const restaurantCount = Object.keys(restaurants).length;
  if (restaurantCount === 0) return 0;
  
  console.log('calculateMultiRestaurantDeliveryFee - settings:', settings);
  console.log('calculateMultiRestaurantDeliveryFee - settings?.multi_restaurant_base_fee:', settings?.multi_restaurant_base_fee);
  console.log('calculateMultiRestaurantDeliveryFee - settings?.multi_restaurant_additional_fee:', settings?.multi_restaurant_additional_fee);
  
  // ใช้ค่าจาก settings ถ้ามี และแปลงเป็น float ให้แน่ใจ
  const baseFee = parseFloat(settings?.multi_restaurant_base_fee) || 0;
  const additionalFee = parseFloat(settings?.multi_restaurant_additional_fee) || 0;

  console.log('calculateMultiRestaurantDeliveryFee - restaurantCount:', restaurantCount);
  console.log('calculateMultiRestaurantDeliveryFee - baseFee:', baseFee, 'type:', typeof baseFee);
  console.log('calculateMultiRestaurantDeliveryFee - additionalFee:', additionalFee, 'type:', typeof additionalFee);

  const result = restaurantCount === 1 ? baseFee : baseFee + ((restaurantCount - 1) * additionalFee);
  console.log('calculateMultiRestaurantDeliveryFee - result:', result);
  
  return result;
};

// คำนวณยอดรวม
const calculateTotals = (state) => {
  const subtotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // คำนวณค่าจัดส่ง
  const deliveryFee = state.items.length === 0 ? 0 : calculateMultiRestaurantDeliveryFee(state.restaurants, state.deliverySettings);
  
  const total = subtotal + deliveryFee - state.discount;
  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
  
  return {
    ...state,
    total: Math.max(0, total),
    itemCount,
    subtotal,
    deliveryFee,
  };
};

// จัดกลุ่มสินค้าตามร้าน
const groupItemsByRestaurant = (items, restaurants) => {
  const grouped = {};
  
  items.forEach(item => {
    const restaurantId = item.restaurant_id;
    if (!grouped[restaurantId]) {
      grouped[restaurantId] = {
        restaurant: restaurants[restaurantId] || { 
          id: restaurantId, 
          name: item.restaurant_name || 'ไม่ระบุร้าน' 
        },
        items: [],
        subtotal: 0,
      };
    }
    grouped[restaurantId].items.push(item);
    grouped[restaurantId].subtotal += item.price * item.quantity;
  });
  
  return grouped;
};

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // โหลดตะกร้าจาก localStorage เมื่อเข้าสู่ระบบ
  useEffect(() => {
    const userId = user?.id || user?.user_id || 'guest';
    console.log('CartContext - User:', user, 'userId:', userId);
    
    const savedCart = localStorage.getItem(`cart_${userId}`);
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        console.log('CartContext - Loading from localStorage:', cartData);
        dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, [user]);

  // ฟังก์ชันสำหรับรีเฟรชการตั้งค่าค่าจัดส่ง (เรียกใช้จากภายนอก)
  const refreshDeliverySettings = useCallback(async () => {
    try {
      console.log('CartContext - รีเฟรชการตั้งค่าค่าจัดส่ง...');
      const response = await appSettingsService.getPublic();
      
      if (response?.data) {
        const data = response.data;
        console.log('CartContext - ข้อมูลใหม่ที่ได้รับ:', data);
        dispatch({ type: actionTypes.UPDATE_DELIVERY_SETTINGS, payload: data });
        console.log('CartContext - การตั้งค่าค่าจัดส่งได้รับการอัปเดทแล้ว');
      }
    } catch (error) {
      console.error('CartContext - Error refreshing delivery settings:', error);
    }
  }, [dispatch]);

  // โหลดการตั้งค่าค่าจัดส่ง
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        console.log('CartContext - เริ่มดึงข้อมูลการตั้งค่าค่าจัดส่ง...');
        const response = await appSettingsService.getPublic();
        console.log('CartContext - Response:', response);
        
        if (response?.data) {
          const data = response.data;
          console.log('CartContext - ข้อมูลที่ได้รับจาก API:', data);
          console.log('CartContext - multi_restaurant_base_fee:', data.multi_restaurant_base_fee);
          console.log('CartContext - multi_restaurant_additional_fee:', data.multi_restaurant_additional_fee);
          console.log('CartContext - ประเภทข้อมูล base_fee:', typeof data.multi_restaurant_base_fee);
          console.log('CartContext - ประเภทข้อมูล additional_fee:', typeof data.multi_restaurant_additional_fee);
          
          dispatch({ type: actionTypes.UPDATE_DELIVERY_SETTINGS, payload: data });
        } else {
          console.error('CartContext - ไม่มีข้อมูลใน response');
        }
      } catch (error) {
        console.error('CartContext - Error fetching delivery settings:', error);
      }
    };

    fetchDeliverySettings();
  }, []); // เรียกครั้งเดียวเมื่อ component mount

  // รีเฟรชการตั้งค่าเมื่อผู้ใช้กลับมาที่หน้าเว็บ
  useEffect(() => {
    const handleFocus = () => {
      refreshDeliverySettings();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshDeliverySettings]);

  // อัพเดท localStorage เมื่อ state เปลี่ยนแปลง
  useEffect(() => {
    const userId = user?.id || user?.user_id || 'guest';
    try {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(state));
      console.log('CartContext - Saved to localStorage:', state);
    } catch (error) {
      console.error('CartContext - Error saving to localStorage:', error);
    }
  }, [state, user]);

  // Functions
  const addItem = (product, restaurant) => {
    // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
    if (!user || !user.id) {
      const shouldRedirect = window.confirm(
        'Please login before adding items to cart\n\nClick "OK" to go to the login page'
      );
      
      if (shouldRedirect) {
        // เก็บ URL ปัจจุบันเพื่อกลับมาหลังจากล็อกอิน
        const currentPath = window.location.pathname;
        localStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login';
      }
      
      return { 
        success: false, 
        error: 'Please login before adding items to cart',
        requiresLogin: true
      };
    }

    console.log('CartContext - Adding item:', { product, restaurant });
    console.log('CartContext - Restaurant ID from restaurant object:', restaurant.id || restaurant.restaurant_id);
    try {
      dispatch({
        type: actionTypes.ADD_ITEM,
        payload: { product, restaurant }
      });
      console.log('CartContext - Item added successfully');
      return { success: true };
    } catch (error) {
      console.error('CartContext - Error adding item:', error);
      return { success: false, error: error.message };
    }
  };

  const removeItem = (itemId) => {
    dispatch({
      type: actionTypes.REMOVE_ITEM,
      payload: { itemId }
    });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({
      type: actionTypes.UPDATE_QUANTITY,
      payload: { itemId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: actionTypes.CLEAR_CART });
    const userId = user?.id || user?.user_id || 'guest';
    try {
      localStorage.removeItem(`cart_${userId}`);
      console.log('CartContext - Cleared localStorage');
    } catch (error) {
      console.error('CartContext - Error clearing localStorage:', error);
    }
  };

  const setDeliveryFee = (fee) => {
    dispatch({
      type: actionTypes.SET_DELIVERY_FEE,
      payload: fee
    });
  };

  const setDiscount = (discount) => {
    dispatch({
      type: actionTypes.SET_DISCOUNT,
      payload: discount
    });
  };

  const setPromoCode = (code) => {
    dispatch({
      type: actionTypes.SET_PROMO_CODE,
      payload: code
    });
  };

  const applyPromoCode = (code) => {
    const validPromoCodes = {
      'WELCOME20': 20,
      'SAVE10': 10,
      'FIRST50': 50,
      'STUDENT15': 15,
      'FREE30': 30,
    };

    const upperCode = code.toUpperCase();
    if (validPromoCodes[upperCode]) {
      setDiscount(validPromoCodes[upperCode]);
      setPromoCode(upperCode);
      return { success: true, discount: validPromoCodes[upperCode] };
    }
    return { success: false, error: 'Invalid promo code' };
  };

  // จัดกลุ่มสินค้าตามร้าน
  const getItemsByRestaurant = () => {
    return groupItemsByRestaurant(state.items, state.restaurants);
  };

  // ได้จำนวนร้านในตะกร้า
  const getRestaurantCount = () => {
    return Object.keys(state.restaurants).length;
  };

  const value = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDeliveryFee,
    setDiscount,
    setPromoCode,
    applyPromoCode,
    getItemsByRestaurant,
    getRestaurantCount,
    refreshDeliverySettings,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 