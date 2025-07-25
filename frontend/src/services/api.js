import axios from 'axios';
import { API_CONFIG } from '../config/api.js';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Debug logging for specific API calls
    if (config.url.includes('/notifications/') || config.url.includes('/app-settings/')) {
      console.log('🔍 API Request:', {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
        token: token ? `${token.substring(0, 10)}...` : null
      });
    }
    
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
    if (response.config.url.includes('/notifications/') || response.config.url.includes('/app-settings/')) {
      console.log('✅ API Response:', {
        method: response.config.method.toUpperCase(),
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
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

// Product services
export const productService = {
  getAll: (params = {}) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}/`),
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
  delete: (id) => api.delete(`/products/${id}/`),
};

// Category services
export const categoryService = {
  getAll: (params = {}) => api.get('/categories/', { params }),
  getById: (id) => api.get(`/categories/${id}/`),
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
};

// Review services
export const reviewService = {
  getAll: (params = {}) => api.get('/reviews/', { params }),
  getById: (id) => api.get(`/reviews/${id}/`),
  create: (data) => api.post('/reviews/', data),
  update: (id, data) => api.put(`/reviews/${id}/`, data),
  delete: (id) => api.delete(`/reviews/${id}/`),
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
  getUnreadCount: () => {
    console.log('🔍 API: Calling getUnreadCount endpoint...');
    return api.get('/notifications/unread-count/');
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
    return await api.get('/api/languages/');
  },
};

export default api; 