// API Configuration - Remove trailing slash to prevent double slash
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  
  // แสดง debug info เฉพาะใน development mode
  if (import.meta.env.DEV) {
    console.log('🔧 Environment VITE_API_URL:', url);
    console.log('🔧 All env vars:', import.meta.env);
  }
  
  // ✅ Fallback (ช่วยเวลาทดสอบบนมือถือ/เครื่องอื่น)
  // - ถ้าไม่กำหนด VITE_API_URL จะใช้ host ปัจจุบัน และชี้ไปที่ port 8000 (/api)
  // - ถ้ากำหนด VITE_API_URL ก็ใช้ตามนั้น (เหมาะกับ prod/docker)
  if (!url) {
    if (typeof window !== 'undefined') {
      const fallback = `${window.location.protocol}//${window.location.hostname}:8000/api`;
      if (import.meta.env.DEV) {
        console.warn('⚠️ VITE_API_URL is not set. Falling back to:', fallback);
      }
      return fallback;
    }

    console.error('❌ VITE_API_URL is not defined and window is not available.');
    throw new Error('VITE_API_URL environment variable is required');
  }

  const finalUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return finalUrl;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000, // default timeout for general requests
  DELIVERY_FEE_TIMEOUT: 30000, // longer timeout for routing-based delivery fee calls
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // หมายเหตุ: Accept-Encoding จะถูกตั้งค่าโดยเบราว์เซอร์อัตโนมัติ
    // ไม่ต้องตั้งค่าเองเพราะถือว่าเป็น "unsafe header"
  },
  // เพิ่ม retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000, // 1 วินาที
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

  // Languages
  LANGUAGES: {
    LIST: '/languages/',
    DEFAULT: '/languages/default/',
    TRANSLATIONS: '/translations/by_language/',
  },

  // Guest Orders
  GUEST_ORDERS: {
    LIST: '/guest-orders/',
    TRACK: (temporaryId) => `/guest-orders/track/?temporary_id=${temporaryId}`,
    MULTI: '/guest-orders/multi/',
  },
}; 
