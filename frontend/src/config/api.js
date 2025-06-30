// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register/',
    LOGIN: '/auth/login/',
    GOOGLE_LOGIN: '/auth/google-login/',
    LOGOUT: '/auth/logout/',
    ME: '/auth/me/',
    VERIFY_EMAIL: '/auth/verify-email/',
    RESEND_VERIFICATION: '/auth/resend-verification/',
    RESET_PASSWORD: '/auth/reset-password/',
    RESET_PASSWORD_CONFIRM: '/auth/reset-password-confirm/',
  },

  // Users
  USERS: {
    LIST: '/users/',
    DETAIL: (id) => `/users/${id}/`,
    UPGRADE_TO_SPECIAL: (id) => `/users/${id}/upgrade-to-special/`,
    DOWNGRADE_TO_GENERAL: (id) => `/users/${id}/downgrade-to-general/`,
  },

  // Restaurants
  RESTAURANTS: {
    LIST: '/restaurants/',
    DETAIL: (id) => `/restaurants/${id}/`,
    PRODUCTS: (id) => `/restaurants/${id}/products/`,
    REVIEWS: (id) => `/restaurants/${id}/reviews/`,
    SPECIAL: '/restaurants/special/',
    NEARBY: '/restaurants/nearby/',
    ANALYTICS: (id) => `/restaurants/${id}/analytics/`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories/',
    DETAIL: (id) => `/categories/${id}/`,
  },

  // Products
  PRODUCTS: {
    LIST: '/products/',
    DETAIL: (id) => `/products/${id}/`,
    REVIEWS: (id) => `/products/${id}/reviews/`,
    CREATE: '/products/',
  },

  // Orders
  ORDERS: {
    LIST: '/orders/',
    DETAIL: (id) => `/orders/${id}/`,
    CREATE: '/orders/',
    UPDATE_STATUS: (id) => `/orders/${id}/update_status/`,
  },

  // Reviews
  REVIEWS: {
    LIST: '/reviews/',
    CREATE: '/reviews/',
    DETAIL: (id) => `/reviews/${id}/`,
  },

  // Product Reviews
  PRODUCT_REVIEWS: {
    LIST: '/product-reviews/',
    CREATE: '/product-reviews/',
    DETAIL: (id) => `/product-reviews/${id}/`,
  },

  // Search
  SEARCH: {
    RESTAURANTS: '/search/restaurants/',
    PRODUCTS: '/search/products/',
    HISTORY: '/search/history/',
    POPULAR: '/search/popular/',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications/',
    MARK_READ: (id) => `/notifications/${id}/mark-read/`,
    MARK_ALL_READ: '/notifications/mark-all-read/',
    UNREAD_COUNT: '/notifications/unread-count/',
  },

  // Favorites
  FAVORITES: {
    LIST: '/favorites/',
    TOGGLE_RESTAURANT: '/favorites/toggle-restaurant/',
    TOGGLE_PRODUCT: '/favorites/toggle-product/',
    RESTAURANTS: '/favorites/restaurants/',
    PRODUCTS: '/favorites/products/',
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard/',
    DAILY: '/analytics/daily/',
  },

  // App Settings
  APP_SETTINGS: {
    LIST: '/app-settings/',
    DETAIL: (id) => `/app-settings/${id}/`,
    PUBLIC: '/app-settings/public/',
  },
}; 