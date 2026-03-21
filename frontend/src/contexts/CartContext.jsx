import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { appSettingsService, deliveryFeeService } from '../services/api';

const DEFAULT_DELIVERY_VALIDATION = {
  isOutOfRange: false,
  message: '',
  distanceKm: null,
  maxDistanceKm: null,
  details: null,
};

const DELIVERY_FEE_DEBOUNCE_MS = 150;

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  deliveryFee: 0,
  discount: 0,
  promoCode: '',
  restaurants: {},
  deliverySettings: null,
  deliveryLocation: null,
  deliveryValidation: DEFAULT_DELIVERY_VALIDATION,
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
  SET_DELIVERY_VALIDATION: 'SET_DELIVERY_VALIDATION',
};

// Reducer
const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_ITEM: {
      const { product, restaurant } = action.payload;
      console.log('Adding item from restaurant:', restaurant.name);
      console.log('Product restaurant status:', product.restaurant_status);


      const restaurantStatus =
        product.restaurant_status ?? restaurant.status ?? 'open';

      if (restaurantStatus !== 'open') {
        console.warn('Cannot add item from closed restaurant');
        throw new Error('This restaurant is closed. Cannot add items to cart.');
      }

      const currentItems = Array.isArray(state?.items) ? state.items : [];
      const existingItemIndex = currentItems.findIndex(
        (item) => item.product_id === product.product_id
      );
      
      let newItems;
      if (existingItemIndex >= 0) {

        newItems = currentItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {

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

        console.log("Created new item:", newItem);
        newItems = [...currentItems, newItem];
      }
      

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
        return cartReducer(state, { type: actionTypes.REMOVE_ITEM, payload: { itemId } });
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

      const newStateWithUpdatedSettings = { ...state, deliverySettings: action.payload };
      return calculateTotalsSync(newStateWithUpdatedSettings); // Re-calculate totals after settings update
    
    case actionTypes.SET_DELIVERY_LOCATION:
      const newStateWithLocation = { ...state, deliveryLocation: action.payload };
      return calculateTotalsSync(newStateWithLocation);

    case actionTypes.SET_DELIVERY_VALIDATION:
      return { ...state, deliveryValidation: action.payload || DEFAULT_DELIVERY_VALIDATION };
    
    default:
      return state;
  }
};


const toOutOfRangeValidation = (data) => {
  const maxDistanceKm = data?.max_delivery_distance_km ?? null;
  const distanceKm = data?.distance_km ?? data?.max_distance_km ?? null;
  return {
    isOutOfRange: true,
    message:
      data?.error ||
      (maxDistanceKm !== null
        ? `Delivery location is out of range. Maximum distance is ${maxDistanceKm} km.`
        : 'Delivery location is out of range.'),
    distanceKm,
    maxDistanceKm,
    details: data || null,
  };
};

const calculateDeliveryFeeByDistance = async (
  restaurants,
  deliveryLocation,
  orderSubtotal = 0,
  requestConfig = {}
) => {
  if (!deliveryLocation || !deliveryLocation.lat || !deliveryLocation.lng) {
    return { fee: 0, validation: DEFAULT_DELIVERY_VALIDATION };
  }

  const restaurantIds = Object.keys(restaurants);
  if (restaurantIds.length === 0) return { fee: 0, validation: DEFAULT_DELIVERY_VALIDATION };

  try {
    if (restaurantIds.length === 1) {
      const restaurantId = parseInt(restaurantIds[0], 10);
      const restaurant = restaurants[restaurantId];

      if (!restaurant) {
        console.warn(`CartContext - Restaurant ${restaurantId} not found in state`);
        return { fee: 0, validation: DEFAULT_DELIVERY_VALIDATION };
      }

      const response = await deliveryFeeService.calculate(
        {
          restaurant_id: restaurantId,
          delivery_latitude: parseFloat(deliveryLocation.lat.toFixed(12)),
          delivery_longitude: parseFloat(deliveryLocation.lng.toFixed(12)),
          order_subtotal: parseFloat(Number(orderSubtotal).toFixed(2))
        },
        requestConfig
      );

      const responseData = response.data || {};
      if (
        responseData.error_code === 'out_of_delivery_range' ||
        responseData.within_delivery_range === false
      ) {
        localStorage.removeItem('delivery_fee_breakdown');
        return {
          fee: 0,
          validation: toOutOfRangeValidation(responseData)
        };
      }

      return {
        fee: responseData.delivery_fee || 0,
        validation: DEFAULT_DELIVERY_VALIDATION
      };
    }

    const response = await deliveryFeeService.calculateMulti(
      {
        restaurant_ids: restaurantIds.map(id => parseInt(id, 10)),
        delivery_latitude: parseFloat(deliveryLocation.lat.toFixed(12)),
        delivery_longitude: parseFloat(deliveryLocation.lng.toFixed(12)),
        order_subtotal: parseFloat(Number(orderSubtotal).toFixed(2))
      },
      requestConfig
    );

    const responseData = response.data;
    if (
      responseData?.error_code === 'out_of_delivery_range' ||
      responseData?.within_delivery_range === false
    ) {
      localStorage.removeItem('delivery_fee_breakdown');
      return {
        fee: 0,
        validation: toOutOfRangeValidation(responseData)
      };
    }

    if (responseData.fee_breakdown) {
      localStorage.setItem('delivery_fee_breakdown', JSON.stringify({
        breakdown: responseData.fee_breakdown,
        explanation: responseData.explanation,
        restaurants: responseData.restaurants,
        calculation_method: responseData.calculation_method
      }));
    }

    return {
      fee: responseData.total_delivery_fee || 0,
      validation: DEFAULT_DELIVERY_VALIDATION
    };
  } catch (error) {
    const isCanceledError =
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      error?.message === 'canceled';
    if (isCanceledError) {
      throw error;
    }

    const errorData = error?.response?.data;
    if (errorData?.error_code === 'out_of_delivery_range') {
      localStorage.removeItem('delivery_fee_breakdown');
      return {
        fee: 0,
        validation: toOutOfRangeValidation(errorData)
      };
    }

    console.error('Error calculating delivery fee:', error);
    localStorage.removeItem('delivery_fee_breakdown');
    return { fee: 0, validation: DEFAULT_DELIVERY_VALIDATION };
  }
};




const calculateTotals = async (state) => {
  const itemsArray = Array.isArray(state.items) ? state.items : [];
  const subtotal = itemsArray.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  

  let deliveryFee = 0;
  if (itemsArray.length > 0) {

    if (state.deliveryLocation && state.deliveryLocation.lat && state.deliveryLocation.lng) {
      deliveryFee = await calculateDeliveryFeeByDistance(state.restaurants, state.deliveryLocation);
    }

  }
  
  const total = subtotal + deliveryFee - state.discount;
  const itemCount = itemsArray.reduce((count, item) => count + item.quantity, 0);
  
  const result = {
    ...state,
    total: Math.max(0, total),
    itemCount,
    subtotal,
    deliveryFee,
  };
  
  
  return result;
};


const calculateTotalsSync = (state) => {
  const itemsArray = Array.isArray(state.items) ? state.items : [];
  const subtotal = itemsArray.reduce((total, item) => total + (item.price * item.quantity), 0);
  

  const deliveryFee = state.deliveryFee || 0;
  
  const total = subtotal + deliveryFee - state.discount;
  const itemCount = itemsArray.reduce((count, item) => count + item.quantity, 0);
  
  const result = {
    ...state,
    total: Math.max(0, total),
    itemCount,
    subtotal,
    deliveryFee,
  };
  
  
  return result;
};


const groupItemsByRestaurant = (items, restaurants) => {
  const grouped = {};
  const itemsArray = Array.isArray(items) ? items : [];
  
  itemsArray.forEach(item => {
    const restaurantId = item.restaurant_id;
    if (!grouped[restaurantId]) {
      grouped[restaurantId] = {
        restaurant: restaurants[restaurantId] || {
          id: restaurantId,
          name: item.restaurant_name || 'Unknown restaurant',
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

  const authContext = useAuth();
  const user = authContext?.user;
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const deliveryFeeAbortControllerRef = useRef(null);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const skipNextDebounceRef = useRef(false);


  useEffect(() => {
    const userId = user?.id || user?.user_id || 'guest';
    // console.log('CartContext - User:', user, 'userId:', userId);
    
    const savedCart = localStorage.getItem(`cart_${userId}`);
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        // console.log('CartContext - Loading from localStorage:', cartData);
        dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, [user]);


  const refreshDeliverySettings = useCallback(async () => {
    try {

      const response = await appSettingsService.getPublic();
      
      if (response?.data) {
        const data = response.data;

        dispatch({ type: actionTypes.UPDATE_DELIVERY_SETTINGS, payload: data });

      }
    } catch (error) {
      console.error('CartContext - Error refreshing delivery settings:', error);
    }
  }, [dispatch]);


  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {

        const response = await appSettingsService.getPublic();
        // console.log('CartContext - Response:', response);
        
        if (response?.data) {
          const data = response.data;

          // console.log('CartContext - multi_restaurant_base_fee:', data.multi_restaurant_base_fee);
          // console.log('CartContext - multi_restaurant_additional_fee:', data.multi_restaurant_additional_fee);


          
          dispatch({ type: actionTypes.UPDATE_DELIVERY_SETTINGS, payload: data });
        } else {
          console.error('CartContext - No data in response');
        }
      } catch (error) {
        console.error('CartContext - Error fetching delivery settings:', error);
      }
    };

    fetchDeliverySettings();
  }, []);


  useEffect(() => {
    const handleFocus = () => {
      refreshDeliverySettings();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshDeliverySettings]);

  const itemsCount = Array.isArray(state.items) ? state.items.length : 0;
  const orderSubtotal = useMemo(() => {
    const itemsArray = Array.isArray(state.items) ? state.items : [];
    return itemsArray.reduce(
      (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)),
      0
    );
  }, [state.items]);
  const restaurantsKey = state.restaurants ? Object.keys(state.restaurants).join(',') : '';


  useEffect(() => {
    let isDisposed = false;
    const timeoutId = window.setTimeout(async () => {
      if (skipNextDebounceRef.current) {
        skipNextDebounceRef.current = false;
        return;
      }

      if (!state.deliveryLocation || !state.deliveryLocation.lat || !state.deliveryLocation.lng) {
        setDeliveryFeeLoading(false);
        if (state.deliveryFee !== 0) {
          dispatch({
            type: actionTypes.SET_DELIVERY_FEE,
            payload: 0
          });
        }
        dispatch({
          type: actionTypes.SET_DELIVERY_VALIDATION,
          payload: DEFAULT_DELIVERY_VALIDATION
        });
        return;
      }


      if (itemsCount > 0 && Object.keys(state.restaurants || {}).length > 0) {
        let controller = null;
        setDeliveryFeeLoading(true);
        try {
          if (deliveryFeeAbortControllerRef.current) {
            deliveryFeeAbortControllerRef.current.abort();
          }

          controller = new AbortController();
          deliveryFeeAbortControllerRef.current = controller;

          const { fee, validation } = await calculateDeliveryFeeByDistance(
            state.restaurants,
            state.deliveryLocation,
            orderSubtotal,
            { signal: controller.signal }
          );

          if (isDisposed || deliveryFeeAbortControllerRef.current !== controller) {
            return;
          }


          dispatch({
            type: actionTypes.SET_DELIVERY_FEE,
            payload: fee
          });
          dispatch({
            type: actionTypes.SET_DELIVERY_VALIDATION,
            payload: validation || DEFAULT_DELIVERY_VALIDATION
          });
        } catch (error) {
          const isCanceledError =
            error?.code === 'ERR_CANCELED' ||
            error?.name === 'CanceledError' ||
            error?.message === 'canceled';
          if (isCanceledError || isDisposed) {
            return;
          }

          console.error('CartContext - Error calculating delivery fee:', error);

          dispatch({
            type: actionTypes.SET_DELIVERY_FEE,
            payload: 0
          });
          dispatch({
            type: actionTypes.SET_DELIVERY_VALIDATION,
            payload: DEFAULT_DELIVERY_VALIDATION
          });
        } finally {
          if (!isDisposed) setDeliveryFeeLoading(false);
          if (controller && deliveryFeeAbortControllerRef.current === controller) {
            deliveryFeeAbortControllerRef.current = null;
          }
        }
      } else {
        setDeliveryFeeLoading(false);
        dispatch({
          type: actionTypes.SET_DELIVERY_VALIDATION,
          payload: DEFAULT_DELIVERY_VALIDATION
        });
      }
    }, DELIVERY_FEE_DEBOUNCE_MS);

    return () => {
      isDisposed = true;
      window.clearTimeout(timeoutId);
      if (deliveryFeeAbortControllerRef.current) {
        deliveryFeeAbortControllerRef.current.abort();
        deliveryFeeAbortControllerRef.current = null;
      }
    };
  }, [
    state.deliveryLocation?.lat, 
    state.deliveryLocation?.lng, 
    itemsCount, 
    restaurantsKey,
    orderSubtotal
  ]);


  useEffect(() => {
    const userId = user?.id || user?.user_id || 'guest';
    try {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(state));
      
    } catch (error) {
      console.error('CartContext - Error saving to localStorage:', error);
    }
  }, [state, user]);

  // Functions
  const addItem = (product, restaurant) => {

    const userId = user?.id || user?.user_id;
    if (!user || !userId) {
      const shouldRedirect = window.confirm(
        'Please login before adding items to cart\n\nClick "OK" to go to the login page'
      );
      
      if (shouldRedirect) {

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

    // console.log('CartContext - Adding item:', { product, restaurant });
    // console.log('CartContext - Restaurant ID from restaurant object:', restaurant.id || restaurant.restaurant_id);
    try {
      dispatch({
        type: actionTypes.ADD_ITEM,
        payload: { product, restaurant }
      });
      // console.log('CartContext - Item added successfully');
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
      // console.log('CartContext - Cleared localStorage');
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

  const setDeliveryLocation = (location) => {

    localStorage.removeItem('delivery_fee_breakdown');
    dispatch({
      type: actionTypes.SET_DELIVERY_VALIDATION,
      payload: DEFAULT_DELIVERY_VALIDATION
    });
    
    dispatch({
      type: actionTypes.SET_DELIVERY_LOCATION,
      payload: location
    });
  };

  const recalculateDeliveryFeeNow = useCallback(async (location) => {
    if (!location?.lat || !location?.lng || itemsCount === 0 || Object.keys(state.restaurants || {}).length === 0) return;
    skipNextDebounceRef.current = true;
    if (deliveryFeeAbortControllerRef.current) {
      deliveryFeeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    deliveryFeeAbortControllerRef.current = controller;
    setDeliveryFeeLoading(true);
    try {
      const { fee, validation } = await calculateDeliveryFeeByDistance(
        state.restaurants,
        location,
        orderSubtotal,
        { signal: controller.signal }
      );
      if (deliveryFeeAbortControllerRef.current !== controller) return;
      dispatch({ type: actionTypes.SET_DELIVERY_FEE, payload: fee });
      dispatch({ type: actionTypes.SET_DELIVERY_VALIDATION, payload: validation || DEFAULT_DELIVERY_VALIDATION });
    } catch (error) {
      const isCanceled = error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.message === 'canceled';
      if (!isCanceled) {
        console.error('CartContext - Error recalculating delivery fee:', error);
        dispatch({ type: actionTypes.SET_DELIVERY_FEE, payload: 0 });
        dispatch({ type: actionTypes.SET_DELIVERY_VALIDATION, payload: DEFAULT_DELIVERY_VALIDATION });
      }
    } finally {
      setDeliveryFeeLoading(false);
      if (deliveryFeeAbortControllerRef.current === controller) {
        deliveryFeeAbortControllerRef.current = null;
      }
    }
  }, [itemsCount, state.restaurants, orderSubtotal]);

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


  const getItemsByRestaurant = () => {
    return groupItemsByRestaurant(state.items || [], state.restaurants || {});
  };


  const getRestaurantCount = () => {
    const restaurants = state.restaurants || {};
    return Object.keys(restaurants).length;
  };

  const value = {
    ...state,
    deliveryFeeLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDeliveryFee,
    setDeliveryLocation,
    recalculateDeliveryFeeNow,
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

