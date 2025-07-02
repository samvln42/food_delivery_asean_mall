import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.duration || 5000);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      title: options.title || 'Success',
      message,
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      title: options.title || 'Error',
      message,
      duration: options.duration || 8000, // Error shows longer
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      title: options.title || 'Warning',
      message,
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      title: options.title || 'Information',
      message,
      ...options
    });
  }, [addNotification]);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification
  };
};

// Updated toast object for better UX with English messages
export const toast = {
  success: (message, options = {}) => {
    // Use proper toast notification if available
    if (window.showNotification) {
      return window.showNotification('success', message, options);
    }
    
    // Fallback for better UX
    console.log('✅ Success:', message);
    
    // Create temporary visual notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">✅</span>
        <div>
          <div class="font-semibold">Success</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, options.duration || 3000);
  },

  error: (message, options = {}) => {
    if (window.showNotification) {
      return window.showNotification('error', message, options);
    }
    
    console.error('❌ Error:', message);
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">❌</span>
        <div>
          <div class="font-semibold">Error</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, options.duration || 5000);
  },

  warning: (message, options = {}) => {
    if (window.showNotification) {
      return window.showNotification('warning', message, options);
    }
    
    console.warn('⚠️ Warning:', message);
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">⚠️</span>
        <div>
          <div class="font-semibold">Warning</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, options.duration || 4000);
  },

  info: (message, options = {}) => {
    if (window.showNotification) {
      return window.showNotification('info', message, options);
    }
    
    console.info('ℹ️ Information:', message);
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">ℹ️</span>
        <div>
          <div class="font-semibold">Information</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, options.duration || 3000);
  }
};

// Helper function to parse API errors with English messages
export const parseApiError = (error) => {
  let message = 'An unknown error occurred';
  let details = null;

  if (error.response?.data) {
    const data = error.response.data;
    
    // If API sends clear error structure
    if (data.success === false) {
      message = data.message || data.error || message;
      details = data.details;
    }
    // If API sends simple error message
    else if (data.error) {
      message = data.error;
    }
    else if (data.message) {
      message = data.message;
    }
    // If API sends validation errors
    else if (data.detail) {
      message = data.detail;
    }
    // If API sends field validation errors
    else if (typeof data === 'object') {
      const errors = [];
      Object.entries(data).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          errors.push(`${field}: ${messages.join(', ')}`);
        } else {
          errors.push(`${field}: ${messages}`);
        }
      });
      if (errors.length > 0) {
        message = `Invalid data:\n${errors.join('\n')}`;
      }
    }
  }
  // Network errors
  else if (error.code === 'NETWORK_ERROR' || !error.response) {
    message = 'Unable to connect to server. Please check your internet connection';
  }
  // HTTP status error messages
  else if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        message = 'Invalid request data';
        break;
      case 401:
        message = 'Unauthorized access. Please login again';
        break;
      case 403:
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        message = 'Requested resource not found';
        break;
      case 409:
        message = 'Data already exists in the system';
        break;
      case 500:
        message = 'Internal server error occurred';
        break;
      default:
        message = `Error occurred (${error.response.status})`;
    }
  }

  return { message, details, statusCode: error.response?.status };
};

export default useNotification; 