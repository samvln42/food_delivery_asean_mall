import axios from 'axios';
import { API_CONFIG } from '../config/api.js';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token and language parameter
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // เพิ่ม lang parameter สำหรับ API ที่ต้องการ translations
    // เพื่อลดขนาดข้อมูลและเพิ่มความเร็ว
    // ยกเว้นหน้าที่ต้องการทุกภาษา (เช่น หน้าแก้ไข) โดยส่ง skipLangFilter: true
    const currentLanguage = localStorage.getItem('language');
    if (currentLanguage && config.method === 'get' && !config.skipLangFilter) {
      // เพิ่ม lang parameter สำหรับ endpoints ที่มี translations
      const needsLanguage = [
        '/products',
        '/categories',
        '/restaurants',
        '/entertainment-venues'
      ].some(endpoint => config.url.includes(endpoint));
      
      if (needsLanguage) {
        // ตรวจสอบว่ามี params อยู่แล้วหรือไม่
        if (!config.params) {
          config.params = {};
        }
        // เพิ่ม lang parameter ถ้ายังไม่มี และไม่ได้บอกให้ข้าม
        if (!config.params.lang) {
          config.params.lang = currentLanguage;
        }
      }
    }
    
    // Debug logging for specific API calls
    // if (config.url.includes('/notifications/') || config.url.includes('/app-settings/')) {
      // console.log('🔍 API Request:', {
      //   method: config.method.toUpperCase(),
      //   url: config.url,
      //   baseURL: config.baseURL,
      //   fullURL: `${config.baseURL}${config.url}`,
      //   hasToken: !!token,
      //   token: token ? `${token.substring(0, 10)}...` : null
      // });
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Debug logging for notifications API responses
    // if (response.config.url.includes('/notifications/') || response.config.url.includes('/app-settings/')) {
    //   console.log('✅ API Response:', {
    //     method: response.config.method.toUpperCase(),
    //     url: response.config.url,
    //     status: response.status,
    //     data: response.data
    //   });
    // }
    return response;
  },
  (error) => {
    // Debug logging for notifications API errors
    if (error.config?.url.includes('/notifications/') || error.config?.url.includes('/app-settings/')) {
      console.log('❌ API Error:', {
        method: error.config.method.toUpperCase(),
        url: error.config.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Handle authentication errors globally
    if (error.response?.status === 401) {
      // Token expired or invalid - clear session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // รายการ endpoint ที่ไม่ควร redirect guest ไป login
      const publicEndpoints = [
        '/restaurants/',
        '/products/',
        '/categories/',
        '/reviews/',
        '/search/',
        '/app-settings/public/',
        '/languages/',
        '/translations/',
        '/guest-orders/track/'
      ];
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        error.config.url.includes(endpoint)
      );
      
      const currentPath = window.location.pathname;
      // Only redirect if not a public endpoint and not already on login/register pages
      if (!isPublicEndpoint && !['/login', '/register', '/'].includes(currentPath)) {
        // Store current path for redirect after login
        localStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      
      // ถ้าเป็น email verification error
      if (errorData?.error_type === 'email_not_verified') {
        console.warn('🚫 Email not verified:', errorData);
        // Clear invalid session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Store email for verification page
        if (errorData.user_email) {
          localStorage.setItem('pendingVerificationEmail', errorData.user_email);
        }
        
        // Redirect to email verification page
        const currentPath = window.location.pathname;
        if (!['/verify-email', '/login', '/register'].includes(currentPath)) {
          window.location.href = '/verify-email';
        }
      } else {
        // Other 403 errors - unauthorized access
        console.warn('🚫 Access denied:', errorData);
        const currentPath = window.location.pathname;
        
        // Get user role from localStorage to redirect to appropriate dashboard
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.role) {
              // Redirect to user's dashboard instead of unauthorized page
              const dashboardRoutes = {
                'admin': '/admin',
                'general_restaurant': '/restaurant',
                'special_restaurant': '/restaurant',
                'customer': '/'
              };
              const dashboardRoute = dashboardRoutes[user.role] || '/';
              if (!['/unauthorized', '/login', dashboardRoute].includes(currentPath)) {
                window.location.href = dashboardRoute;
                return Promise.reject(error);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
        
        // Fallback to unauthorized page if user data not available
        if (!['/unauthorized', '/login'].includes(currentPath)) {
          window.location.href = '/unauthorized';
        }
      }
    }
    
    // Handle network errors with user-friendly messages
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
      console.error('🌐 Network error:', error.message);
      // Don't show alert for every network error, let components handle it
    }
    
    // For other errors, let individual components handle them
    // This allows for context-specific error handling
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register/', userData),
  login: (credentials) => api.post('/auth/login/', credentials),
  googleLogin: (accessToken) => api.post('/auth/google-login/', { access_token: accessToken }),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/me/'),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification/', { email }),
  resetPassword: (email) => api.post('/auth/reset-password/', { email }),
  resetPasswordConfirm: (data) => api.post('/auth/reset-password-confirm/', data),
};

// Restaurant services
export const restaurantService = {
  getAll: (params = {}) => api.get('/restaurants/', { params }),
  getById: (id) => api.get(`/restaurants/${id}/`),
  getProducts: (id, params = {}) => api.get(`/restaurants/${id}/products/`, { params }),
  getReviews: (id, params = {}) => api.get(`/restaurants/${id}/reviews/`, { params }),
  getSpecial: (params = {}) => api.get('/restaurants/special/', { params }),
  getNearby: (params = {}) => api.get('/restaurants/nearby/', { params }),
  getAnalytics: (id, params = {}) => api.get(`/restaurants/${id}/analytics/`, { params }),
  create: (data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.post('/restaurants/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/restaurants/', data);
  },
  update: (id, data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.put(`/restaurants/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/restaurants/${id}/`, data);
  },
  partialUpdate: (id, data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.patch(`/restaurants/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.patch(`/restaurants/${id}/`, data);
  },
  uploadImage: (id, formData) => {
    return api.post(`/restaurants/${id}/upload_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/restaurants/${id}/`),
};

export const countryService = {
  getAll: (params = {}) => api.get('/countries/', { params }),
  create: (data) => api.post('/countries/', data),
  partialUpdate: (id, data) => api.patch(`/countries/${id}/`, data),
  delete: (id) => api.delete(`/countries/${id}/`),
  uploadFlag: (id, formData) =>
    api.post(`/countries/${id}/upload_flag/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const cityService = {
  getAll: (params = {}) => api.get('/cities/', { params }),
  create: (data) => api.post('/cities/', data),
  partialUpdate: (id, data) => api.patch(`/cities/${id}/`, data),
  delete: (id) => api.delete(`/cities/${id}/`),
};

// Product services
export const productService = {
  getAll: (params = {}) => api.get('/products/', { params }),
  getById: (id, options = {}) => {
    // options.allLanguages = true จะดึงทุกภาษา (สำหรับหน้าแก้ไข)
    const config = options.allLanguages ? { skipLangFilter: true } : {};
    return api.get(`/products/${id}/`, config);
  },
  getReviews: (id, params = {}) => api.get(`/products/${id}/reviews/`, { params }),
  create: (data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.post('/products/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/products/', data);
  },
  update: (id, data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.put(`/products/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/products/${id}/`, data);
  },
  partialUpdate: (id, data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.patch(`/products/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.patch(`/products/${id}/`, data);
  },
  uploadImage: (id, formData) => {
    return api.post(`/products/${id}/upload_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/products/${id}/`),
};

// Category services
export const categoryService = {
  getAll: (params = {}) => api.get('/categories/', { params }),
  getById: (id, options = {}) => {
    // options.allLanguages = true จะดึงทุกภาษา (สำหรับหน้าแก้ไข)
    const config = options.allLanguages ? { skipLangFilter: true } : {};
    return api.get(`/categories/${id}/`, config);
  },
  create: (data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.post('/categories/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/categories/', data);
  },
  update: (id, data) => {
    // Use FormData for file uploads
    if (data instanceof FormData) {
      return api.put(`/categories/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/categories/${id}/`, data);
  },
  delete: (id) => api.delete(`/categories/${id}/`),
};

// Order services
export const orderService = {
  getAll: (params = {}) => api.get('/orders/', { params }),
  getById: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post('/orders/', data),
  update: (id, data) => api.put(`/orders/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/orders/${id}/`, data),
  cancel: (id) => api.patch(`/orders/${id}/`, { current_status: 'cancelled' }),
  delete: (id) => api.delete(`/orders/${id}/`),
};

// Review services
export const reviewService = {
  getAll: (params = {}) => api.get('/reviews/', { params }),
  getById: (id) => api.get(`/reviews/${id}/`),
  create: (data) => api.post('/reviews/', data),
  update: (id, data) => api.put(`/reviews/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/reviews/${id}/`, data),
  delete: (id) => api.delete(`/reviews/${id}/`),
  getByRestaurant: (restaurantId, params = {}) => api.get('/reviews/', { params: { restaurant_id: restaurantId, ...params } }),
};

// Product review services
export const productReviewService = {
  getAll: (params = {}) => api.get('/product-reviews/', { params }),
  getById: (id) => api.get(`/product-reviews/${id}/`),
  create: (data) => api.post('/product-reviews/', data),
  update: (id, data) => api.put(`/product-reviews/${id}/`, data),
  delete: (id) => api.delete(`/product-reviews/${id}/`),
};

// Search services
export const searchService = {
  restaurants: (query, params = {}) => api.get('/search/restaurants/', { params: { q: query, ...params } }),
  products: (query, params = {}) => api.get('/search/products/', { params: { q: query, ...params } }),
  getHistory: () => api.get('/search/history/'),
  getPopular: () => api.get('/search/popular/'),
};

// Notification services
export const notificationService = {
  getAll: (params = {}) => api.get('/notifications/', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-read/`),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
  markOrderAsRead: (orderId, orderType) => api.post('/notifications/mark-order-read/', { 
    order_id: orderId, 
    order_type: orderType 
  }),
  getUnreadCount: () => {
    console.log('🔍 API: Calling getUnreadCount endpoint...');
    return api.get('/notifications/unread-count/');
  },
  getBadgeCounts: () => {
    console.log('🔍 API: Calling getBadgeCounts endpoint...');
    return api.get('/notifications/badge-counts/');
  },
};

// Favorite services
export const favoriteService = {
  getAll: () => api.get('/favorites/'),
  getRestaurants: () => api.get('/favorites/restaurants/'),
  getProducts: () => api.get('/favorites/products/'),
  toggleRestaurant: (restaurantId) => api.post('/favorites/toggle-restaurant/', { restaurant_id: restaurantId }),
  toggleProduct: (productId) => api.post('/favorites/toggle-product/', { product_id: productId }),
};

// User services
export const userService = {
  getAll: (params = {}) => api.get('/users/', { params }),
  getById: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  upgradeToSpecial: (id) => api.post(`/users/${id}/upgrade-to-special/`),
  downgradeToGeneral: (id) => api.post(`/users/${id}/downgrade-to-general/`),
  syncAllRoles: () => api.post('/users/sync-all-roles/'),
};

// Analytics services
export const analyticsService = {
  getDaily: (params = {}) => api.get('/analytics/daily/', { params }),
  getRestaurant: (params = {}) => api.get('/analytics/restaurant/', { params }),
  getProduct: (params = {}) => api.get('/analytics/product/', { params }),
};

// Dashboard services
export const dashboardService = {
  getAdmin: () => api.get('/dashboard/admin/'),
  getRestaurant: () => api.get('/dashboard/restaurant/'),
  getCustomer: () => api.get('/dashboard/customer/'),
};

// Delivery Fee Calculation Service
export const deliveryFeeService = {
  // Calculate delivery fee for single restaurant
  calculate: (data, config = {}) => api.post('/calculate-delivery-fee/', data, {
    timeout: API_CONFIG.DELIVERY_FEE_TIMEOUT || API_CONFIG.TIMEOUT,
    ...config,
  }),
  // Calculate delivery fee for multi-restaurant order
  calculateMulti: (data, config = {}) => api.post('/calculate-multi-restaurant-delivery-fee/', data, {
    timeout: API_CONFIG.DELIVERY_FEE_TIMEOUT || API_CONFIG.TIMEOUT,
    ...config,
  }),
};

// App Settings Service
export const appSettingsService = {
  // Get public settings (no authentication required)
  getPublic: (params = {}) => api.get('/app-settings/public/', { params }),
  
  // Get all settings (admin only)
  getAll: () => api.get('/app-settings/'),
  
  // Get specific settings record (admin only)
  get: (id) => api.get(`/app-settings/${id}/`),
  
  // Update settings (admin only)
  update: (id, data) => {
    // Use FormData for file uploads
    if (data.app_logo instanceof File || data.app_banner instanceof File || data.qr_code_image instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return api.put(`/app-settings/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/app-settings/${id}/`, data);
  },
  
  // Partial update settings (admin only)
  patch: (id, data) => {
    // Use FormData for file uploads
    if (data.app_logo instanceof File || data.app_banner instanceof File || data.qr_code_image instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return api.patch(`/app-settings/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.patch(`/app-settings/${id}/`, data);
  },

  getLanguages: async () => {
    return await api.get('/languages/');
  },
};

// Advertisement Service
// Dine-in services
export const dineInOrderService = {
  getAll: (params = {}) => api.get('/dine-in-orders/', { params }),
  getById: (id) => api.get(`/dine-in-orders/${id}/`),
  getBySession: (sessionId, params = {}) => {
    return api.get('/dine-in-orders/', { 
      params: { session_id: sessionId, ...params } 
    });
  },
  cancelItem: (sessionId, orderId, orderDetailId) => api.post('/dine-in-orders/cancel-item/', {
    session_id: sessionId,
    order_id: orderId,
    order_detail_id: orderDetailId
  }),
  canRequestBill: (sessionId) => api.get('/dine-in-orders/can-request-bill/', { params: { session_id: sessionId } }),
  updateStatus: (id, status, note = '') => api.post(`/dine-in-orders/${id}/update-status/`, { status, note }),
  updatePaymentStatus: (id, payment_status, payment_method = '') => api.post(`/dine-in-orders/${id}/update-payment-status/`, { payment_status, payment_method }),
  requestBill: (sessionId) => api.post('/dine-in-orders/request-bill/', { session_id: sessionId }),
  dismissBillRequest: (id) => api.post(`/dine-in-orders/${id}/dismiss-bill-request/`),
  completeBill: (id) => api.post(`/dine-in-orders/${id}/complete-bill/`),
};

// Dine-in order detail services
export const dineInOrderDetailService = {
  markServed: (orderDetailId) => api.post(`/dine-in-order-details/${orderDetailId}/mark-served/`),
  markUnserved: (orderDetailId) => api.post(`/dine-in-order-details/${orderDetailId}/mark-unserved/`),
};

// Entertainment Venue services
export const entertainmentVenueService = {
  getAll: (params = {}) => api.get('/entertainment-venues/', { params }),
  getById: (id, options = {}) => {
    const config = options.allLanguages ? { skipLangFilter: true } : {};
    return api.get(`/entertainment-venues/${id}/`, config);
  },
  getImages: (id) => api.get(`/entertainment-venues/${id}/images/`),
  getNearby: (params = {}) => api.get('/entertainment-venues/nearby/', { params }),
  search: (query, params = {}) => api.get('/entertainment-venues/', { params: { search: query, ...params } }),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        if (key === 'image' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (key === 'translations') {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'category' && data[key] === null) {
          // Skip null category
        } else if (key !== 'image') {
          const value = data[key];
          if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        }
      }
    });
    return api.post('/entertainment-venues/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'image' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (key !== 'image') {
          formData.append(key, data[key]);
        }
      }
    });
    return api.put(`/entertainment-venues/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  partialUpdate: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        if (key === 'image' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (key === 'translations') {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'category' && data[key] === null) {
          // Skip null category for PATCH
        } else if (key !== 'image') {
          const value = data[key];
          if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        }
      }
    });
    return api.patch(`/entertainment-venues/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/entertainment-venues/${id}/`),
  uploadImage: (id, formData) => api.post(`/entertainment-venues/${id}/upload_image/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateImage: (venueId, imageId, data) => api.patch(`/entertainment-venues/${venueId}/images/${imageId}/`, data),
  deleteImage: (venueId, imageId) => api.delete(`/entertainment-venues/${venueId}/images/${imageId}/`),
  batchUpdateImages: (venueId, imagesData) => api.post(`/entertainment-venues/${venueId}/images/batch-update/`, { images: imagesData }),
  bulkCreate: (venues) => api.post('/entertainment-venues/bulk_create/', { venues }),
};

// Venue Review services
export const venueReviewService = {
  getAll: (params = {}) => api.get('/venue-reviews/', { params }),
  getById: (id) => api.get(`/venue-reviews/${id}/`),
  create: (data) => api.post('/venue-reviews/', data),
  update: (id, data) => api.put(`/venue-reviews/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/venue-reviews/${id}/`, data),
  delete: (id) => api.delete(`/venue-reviews/${id}/`),
  getByVenue: (venueId) => api.get('/venue-reviews/', { params: { venue_id: venueId } }),
};

// Venue Category services
export const venueCategoryService = {
  getAll: (params = {}) => api.get('/venue-categories/', { params }),
  getById: (id) => api.get(`/venue-categories/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'icon' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (key !== 'icon') {
          formData.append(key, data[key]);
        }
      }
    });
    return api.post('/venue-categories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'icon' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (key !== 'icon') {
          formData.append(key, data[key]);
        }
      }
    });
    return api.put(`/venue-categories/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  partialUpdate: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'icon' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (key !== 'icon') {
          formData.append(key, data[key]);
        }
      }
    });
    return api.patch(`/venue-categories/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/venue-categories/${id}/`),
  deleteIcon: (id) => api.post(`/venue-categories/${id}/delete_icon/`),
};

export const advertisementService = {
  // Get all advertisements (admin only)
  getAll: (params = {}) => {
    return api.get('/advertisements/', { params });
  },
  
  // Get active advertisements (public)
  getActive: () => {
    return api.get('/advertisements/active/');
  },
  
  // Get single advertisement
  get: (id) => {
    return api.get(`/advertisements/${id}/`);
  },
  
  // Create new advertisement (admin only)
  create: (data) => {
    const formData = new FormData();
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }
    formData.append('sort_order', data.sort_order || 0);
    formData.append('is_active', data.is_active !== undefined ? data.is_active : true);
    
    return api.post('/advertisements/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update advertisement (admin only)
  update: (id, data) => {
    const formData = new FormData();
    
    // Only append image if it's a new file
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }
    
    formData.append('sort_order', data.sort_order || 0);
    formData.append('is_active', data.is_active !== undefined ? data.is_active : true);
    
    
    return api.patch(`/advertisements/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete advertisement (admin only)
  delete: (id) => {
    return api.delete(`/advertisements/${id}/`);
  },
};

export default api; 
