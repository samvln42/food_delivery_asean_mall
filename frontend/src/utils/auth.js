/**
 * Authentication utility functions
 */

/**
 * ตรวจสอบว่า token ยังใช้งานได้หรือไม่
 * @param {string} token - Authentication token
 * @returns {boolean} - true ถ้า token ยังใช้งานได้
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // ตรวจสอบรูปแบบของ token (Django Token มักจะเป็น 40 characters)
    if (token.length !== 40) return false;
    
    // ตรวจสอบว่าเป็น hex string หรือไม่
    const hexRegex = /^[a-f0-9]+$/i;
    return hexRegex.test(token);
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * ตรวจสอบว่า user data ถูกต้องหรือไม่
 * @param {Object} user - User object
 * @returns {boolean} - true ถ้า user data ถูกต้อง
 */
export const isUserDataValid = (user) => {
  if (!user || typeof user !== 'object') return false;
  
  // ตรวจสอบ required fields
  const requiredFields = ['id', 'username', 'email', 'role'];
  const hasRequiredFields = requiredFields.every(field => 
    Object.prototype.hasOwnProperty.call(user, field) && user[field] !== null && user[field] !== undefined
  );
  
  if (!hasRequiredFields) return false;
  
  // ตรวจสอบว่า role ถูกต้องหรือไม่
  const validRoles = ['admin', 'special_restaurant', 'general_restaurant', 'customer'];
  if (!validRoles.includes(user.role)) return false;
  
  // ตรวจสอบ email verification สำหรับ non-admin users
  if (user.role !== 'admin' && !user.is_email_verified) {
    console.warn('User email not verified:', user.email);
    return false;
  }
  
  return true;
};

/**
 * ทำความสะอาด invalid session data
 */
export const clearInvalidSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('redirectAfterLogin');
  // console.info('🧹 Cleared invalid session data');
};

/**
 * ตรวจสอบและทำความสะอาด session ถ้าจำเป็น
 * @returns {Object|null} - Valid session data หรือ null
 */
export const validateAndCleanSession = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    clearInvalidSession();
    return null;
  }
  
  if (!isTokenValid(token)) {
    console.warn('🚫 Invalid token detected');
    clearInvalidSession();
    return null;
  }
  
  let user;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    console.error('🚫 Invalid user data in localStorage:', error);
    clearInvalidSession();
    return null;
  }
  
  if (!isUserDataValid(user)) {
    console.warn('🚫 Invalid user data detected');
    clearInvalidSession();
    return null;
  }
  
  return { user, token };
};

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง route หรือไม่
 * @param {string} path - Route path
 * @param {string} userRole - User role
 * @returns {boolean} - true ถ้ามีสิทธิ์เข้าถึง
 */
export const canAccessRoute = (path, userRole) => {
  // Admin routes
  if (path.startsWith('/admin')) {
    return userRole === 'admin';
  }
  
  // Restaurant routes
  if (path.startsWith('/restaurant')) {
    return userRole === 'general_restaurant' || userRole === 'special_restaurant';
  }
  
  // Protected customer routes
  const protectedCustomerRoutes = ['/cart', '/orders', '/profile', '/notifications', '/settings'];
  if (protectedCustomerRoutes.some(route => path.startsWith(route))) {
    return ['customer', 'general_restaurant', 'special_restaurant', 'admin'].includes(userRole);
  }
  
  // Public routes
  return true;
};

export default {
  isTokenValid,
  isUserDataValid,
  clearInvalidSession,
  validateAndCleanSession,
  canAccessRoute
}; 