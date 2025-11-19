import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { appSettingsService, deliveryFeeService } from '../services/api';

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
  deliveryLocation: null, // เก็บพิกัดที่อยู่จัดส่ง { lat, lng, address }
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
  SET_DELIVERY_LOCATION: 'SET_DELIVERY_LOCATION',
};

// Reducer
const guestCartReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_ITEM: {
      const { product, restaurant } = action.payload;
      console.log('Adding item from restaurant:', restaurant.name);
      console.log('Product restaurant status:', product.restaurant_status);

      // ตรวจสอบสถานะร้าน (ถือว่า open หากไม่ส่งสถานะมา)
      const restaurantStatus =
        product.restaurant_status ?? restaurant.status ?? 'open';

      if (restaurantStatus !== 'open') {
        console.warn('Cannot add item from closed restaurant');
        throw new Error('This restaurant is closed. Cannot add items to cart.');
      }
      // เพิ่มสินค้าจากร้านใดก็ได้ (ไม่จำกัดร้านเดียว)
      const currentItems = Array.isArray(state?.items) ? state.items : [];
      const existingItemIndex = currentItems.findIndex(
        (item) => item.product_id === product.product_id
      );
      
      let newItems;
      if (existingItemIndex >= 0) {
        // อัพเดทจำนวนสินค้าที่มีอยู่
        newItems = currentItems.map((item, index) =>
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
          special_instructions: "",
          translations: product.translations || [], // เพิ่มข้อมูล translations
        };

        console.log("Created new item:", newItem);
        newItems = [...currentItems, newItem];
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
      return calculateTotalsSync(newState);
    }
    
    case actionTypes.UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return guestCartReducer(state, { type: actionTypes.REMOVE_ITEM, payload: { itemId } });
      }
      
      const newItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      const newState = { ...state, items: newItems };
      return calculateTotalsSync(newState);
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
      return calculateTotalsSync(newState);
    }
    
    case actionTypes.CLEAR_CART:
      return { ...initialState };
    
    case actionTypes.SET_DELIVERY_FEE:
      const newStateWithDelivery = { ...state, deliveryFee: action.payload };
      return calculateTotalsSync(newStateWithDelivery);
    
    case actionTypes.SET_DISCOUNT:
      const newStateWithDiscount = { ...state, discount: action.payload };
      return calculateTotalsSync(newStateWithDiscount);
    
    case actionTypes.SET_PROMO_CODE:
      return { ...state, promoCode: action.payload };
    
    case actionTypes.LOAD_CART: {
      const payload = action.payload || {};
      const loadedItems = Array.isArray(payload.items) ? payload.items : [];
      const loadedRestaurants = payload.restaurants && typeof payload.restaurants === 'object' ? payload.restaurants : {};
      const loadedState = {
        ...state,
        ...payload,
        items: loadedItems,
        restaurants: loadedRestaurants
      };
      return calculateTotalsSync(loadedState);
    }
    
    case actionTypes.UPDATE_DELIVERY_SETTINGS:
      // console.log('GuestCartContext - UPDATE_DELIVERY_SETTINGS payload:', action.payload);
      const newStateWithUpdatedSettings = { ...state, deliverySettings: action.payload };
      return calculateTotalsSync(newStateWithUpdatedSettings);
    
    case actionTypes.SET_DELIVERY_LOCATION:
      const newStateWithLocation = { ...state, deliveryLocation: action.payload };
      // ใช้ sync version ก่อน แล้วจะคำนวณใหม่ใน useEffect
      return calculateTotalsSync(newStateWithLocation);
    
    default:
      return state;
  }
};

// คำนวณค่าจัดส่งตามระยะทาง (ใช้ API)
const calculateDeliveryFeeByDistance = async (restaurants, deliveryLocation) => {
  if (!deliveryLocation || !deliveryLocation.lat || !deliveryLocation.lng) {
    return 0;
  }

  const restaurantIds = Object.keys(restaurants);
  if (restaurantIds.length === 0) return 0;

  try {
    if (restaurantIds.length === 1) {
      // Single restaurant
      const restaurantId = parseInt(restaurantIds[0], 10);
      const restaurant = restaurants[restaurantId];

      if (!restaurant) {
        console.warn(`GuestCartContext - Restaurant ${restaurantId} not found in state`);
        return 0;
      }

      const response = await deliveryFeeService.calculate({
        restaurant_id: restaurantId,
        delivery_latitude: parseFloat(deliveryLocation.lat.toFixed(12)),
        delivery_longitude: parseFloat(deliveryLocation.lng.toFixed(12))
      });

      return response.data.delivery_fee || 0;
    } else {
      // Multi-restaurant - คำนวณค่าจัดส่งจากร้านที่ไกลที่สุด
      const response = await deliveryFeeService.calculateMulti({
        restaurant_ids: restaurantIds.map(id => parseInt(id, 10)),
        delivery_latitude: parseFloat(deliveryLocation.lat.toFixed(12)),
        delivery_longitude: parseFloat(deliveryLocation.lng.toFixed(12))
      });

      // เก็บข้อมูล delivery fee breakdown สำหรับแสดงผล
      const responseData = response.data;
      if (responseData.fee_breakdown) {
        // บันทึกข้อมูล breakdown ไว้ใน localStorage หรือ context state
        localStorage.setItem('guest_delivery_fee_breakdown', JSON.stringify({
          breakdown: responseData.fee_breakdown,
          explanation: responseData.explanation,
          restaurants: responseData.restaurants,
          calculation_method: responseData.calculation_method
        }));
      }
      
      return responseData.total_delivery_fee || 0;
    }
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return 0;
  }
};

// ไม่ใช้ค่าจัดส่งแบบหลายร้านแล้ว ใช้เฉพาะค่าจัดส่งตามระยะทาง

// Synchronous version สำหรับ reducer (ใช้ค่าจัดส่งจาก state)
const calculateTotalsSync = (state) => {
  const itemsArray = Array.isArray(state.items) ? state.items : [];
  const subtotal = itemsArray.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // ใช้ค่าจัดส่งจาก state (จะถูกคำนวณใน useEffect)
  const deliveryFee = state.deliveryFee || 0;
  
  const total = subtotal + deliveryFee - state.discount;
  const itemCount = itemsArray.reduce((count, item) => count + item.quantity, 0);
  
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
  const itemsArray = Array.isArray(items) ? items : [];
  
  itemsArray.forEach(item => {
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

// Context
const GuestCartContext = createContext();

// Provider
export const GuestCartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(guestCartReducer, initialState);

  // ฟังก์ชันสำหรับรีเฟรชการตั้งค่าค่าจัดส่ง (เรียกใช้จากภายนอก)
  const refreshDeliverySettings = useCallback(async () => {
    try {
      // console.log('GuestCartContext - รีเฟรชการตั้งค่าค่าจัดส่ง...');
      const response = await appSettingsService.getPublic();
      
      if (response?.data) {
        const data = response.data;
        // console.log('GuestCartContext - ข้อมูลใหม่ที่ได้รับ:', data);
        dispatch({ type: actionTypes.UPDATE_DELIVERY_SETTINGS, payload: data });
        // console.log('GuestCartContext - การตั้งค่าค่าจัดส่งได้รับการอัปเดทแล้ว');
      }
    } catch (error) {
      console.error('GuestCartContext - Error refreshing delivery settings:', error);
    }
  }, [dispatch]);

  // โหลดการตั้งค่าค่าจัดส่ง
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        // console.log('GuestCartContext - เริ่มดึงข้อมูลการตั้งค่าค่าจัดส่ง...');
        const response = await appSettingsService.getPublic();
        // console.log('GuestCartContext - Response:', response);
        
        // if (response?.data) {
        //   const data = response.data;
        //   console.log('GuestCartContext - ข้อมูลที่ได้รับจาก API:', data);
        //   console.log('GuestCartContext - multi_restaurant_base_fee:', data.multi_restaurant_base_fee);
        //   console.log('GuestCartContext - multi_restaurant_additional_fee:', data.multi_restaurant_additional_fee);
        //   console.log('GuestCartContext - ประเภทข้อมูล base_fee:', typeof data.multi_restaurant_base_fee);
        //   console.log('GuestCartContext - ประเภทข้อมูล additional_fee:', typeof data.multi_restaurant_additional_fee);
          
        //   dispatch({ type: actionTypes.UPDATE_DELIVERY_SETTINGS, payload: data });
        // } else {
        //   console.error('GuestCartContext - ไม่มีข้อมูลใน response');
        // }
      } catch (error) {
        console.error('GuestCartContext - Error fetching delivery settings:', error);
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

  const itemsCount = Array.isArray(state.items) ? state.items.length : 0;
  const restaurantsKey = state.restaurants ? Object.keys(state.restaurants).join(',') : '';

  // คำนวณค่าจัดส่งตามระยะทางเมื่อ deliveryLocation เปลี่ยน
  useEffect(() => {
    const calculateFee = async () => {
      // ถ้าไม่มี deliveryLocation ให้ reset deliveryFee เป็น 0
      if (!state.deliveryLocation || !state.deliveryLocation.lat || !state.deliveryLocation.lng) {
        if (state.deliveryFee !== 0) {
          dispatch({
            type: actionTypes.SET_DELIVERY_FEE,
            payload: 0
          });
        }
        return;
      }

      // ถ้ามี items และ deliveryLocation ให้คำนวณค่าจัดส่ง
      if (itemsCount > 0 && Object.keys(state.restaurants || {}).length > 0) {
        try {
          const fee = await calculateDeliveryFeeByDistance(state.restaurants, state.deliveryLocation);
          
          // อัปเดต deliveryFee เสมอ
          dispatch({
            type: actionTypes.SET_DELIVERY_FEE,
            payload: fee
          });
        } catch (error) {
          console.error('GuestCartContext - Error calculating delivery fee:', error);
          // ถ้ามี error ให้ reset เป็น 0
          dispatch({
            type: actionTypes.SET_DELIVERY_FEE,
            payload: 0
          });
        }
      }
    };

    calculateFee();
  }, [
    state.deliveryLocation?.lat, 
    state.deliveryLocation?.lng, 
    itemsCount, 
    restaurantsKey
  ]);

  // โหลดตะกร้าจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedCart = localStorage.getItem('guest_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        // console.log('GuestCartContext - Loading from localStorage:', cartData);
        dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
      } catch (error) {
        console.error('Error loading guest cart from localStorage:', error);
      }
    }
  }, []);

  // อัพเดท localStorage เมื่อ state เปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem('guest_cart', JSON.stringify(state));
      // console.log('GuestCartContext - Saved to localStorage:', state);
    } catch (error) {
      console.error('GuestCartContext - Error saving to localStorage:', error);
    }
  }, [state]);

  // Functions
  const addItem = (product, restaurant) => {
    // console.log('GuestCartContext - Adding item:', { product, restaurant });
    // console.log('GuestCartContext - Restaurant ID from restaurant object:', restaurant.id || restaurant.restaurant_id);
    try {
      dispatch({
        type: actionTypes.ADD_ITEM,
        payload: { product, restaurant }
      });
      // console.log('GuestCartContext - Item added successfully');
      return { success: true };
    } catch (error) {
      console.error('GuestCartContext - Error adding item:', error);
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
    try {
      localStorage.removeItem('guest_cart');
      // console.log('GuestCartContext - Cleared localStorage');
    } catch (error) {
      console.error('GuestCartContext - Error clearing localStorage:', error);
    }
  };

  const setDeliveryFee = (fee) => {
    dispatch({
      type: actionTypes.SET_DELIVERY_FEE,
      payload: fee
    });
  };

  const setDeliveryLocation = (location) => {
    // ล้าง delivery fee breakdown เก่าเมื่อเปลี่ยนตำแหน่ง
    localStorage.removeItem('guest_delivery_fee_breakdown');
    
    dispatch({
      type: actionTypes.SET_DELIVERY_LOCATION,
      payload: location
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
    return groupItemsByRestaurant(state.items || [], state.restaurants || {});
  };

  // ได้จำนวนร้านในตะกร้า
  const getRestaurantCount = () => {
    const restaurants = state.restaurants || {};
    return Object.keys(restaurants).length;
  };

  const value = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDeliveryFee,
    setDeliveryLocation,
    setDiscount,
    setPromoCode,
    applyPromoCode,
    getItemsByRestaurant,
    getRestaurantCount,
    refreshDeliverySettings,
  };

  return <GuestCartContext.Provider value={value}>{children}</GuestCartContext.Provider>;
};

// Custom hook to use guest cart context
export const useGuestCart = () => {
  const context = useContext(GuestCartContext);
  if (!context) {
    throw new Error('useGuestCart must be used within a GuestCartProvider');
  }
  return context;
};

export default GuestCartContext; 