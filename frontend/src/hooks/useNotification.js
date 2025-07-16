import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const { translate } = useLanguage();

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
      title: options.title || translate('notification.success'),
      message,
      ...options
    });
  }, [addNotification, translate]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      title: options.title || translate('notification.error'),
      message,
      duration: options.duration || 8000, // Error shows longer
      ...options
    });
  }, [addNotification, translate]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      title: options.title || translate('notification.warning'),
      message,
      ...options
    });
  }, [addNotification, translate]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      title: options.title || translate('notification.info'),
      message,
      ...options
    });
  }, [addNotification, translate]);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification
  };
};

// Updated toast object for better UX with translation support
export const toast = {
  success: (message, options = {}) => {
    // Use proper toast notification if available
    if (window.showNotification) {
      return window.showNotification('success', message, options);
    }
    
    // Create temporary visual notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-0 left-0 right-0 bg-green-500 text-white p-4 flex items-center justify-between z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </span>
        <span>${message}</span>
      </div>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    if (options.duration !== 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, options.duration || 5000);
    }
  },

  error: (message, options = {}) => {
    if (window.showNotification) {
      return window.showNotification('error', message, options);
    }
    
    // Create temporary visual notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white p-4 flex items-center justify-between z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </span>
        <span>${message}</span>
      </div>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    if (options.duration !== 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, options.duration || 5000);
    }
  },

  warning: (message, options = {}) => {
    if (window.showNotification) {
      return window.showNotification('warning', message, options);
    }
    
    // Create temporary visual notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-white p-4 flex items-center justify-between z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </span>
        <span>${message}</span>
      </div>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    if (options.duration !== 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, options.duration || 5000);
    }
  },

  info: (message, options = {}) => {
    if (window.showNotification) {
      return window.showNotification('info', message, options);
    }
    
    // Create temporary visual notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-0 left-0 right-0 bg-blue-500 text-white p-4 flex items-center justify-between z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </span>
        <span>${message}</span>
      </div>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    if (options.duration !== 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, options.duration || 5000);
    }
  }
};

// Helper function to parse API errors with translation support
export const parseApiError = (error, translate) => {
  let message = translate ? translate('error.unknown') : 'An unknown error occurred';
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
        message = translate 
          ? translate('error.invalid_data') + `:\n${errors.join('\n')}`
          : `Invalid data:\n${errors.join('\n')}`;
      }
    }
  }
  // Network errors
  else if (error.code === 'NETWORK_ERROR' || !error.response) {
    message = translate ? translate('error.network') : 'Unable to connect to server. Please check your internet connection';
  }
  // HTTP status error messages
  else if (error.response?.status) {
    const statusMessages = {
      400: translate ? translate('error.bad_request') : 'Invalid request data',
      401: translate ? translate('error.unauthorized') : 'Unauthorized access. Please login again',
      403: translate ? translate('error.forbidden') : 'You do not have permission to perform this action',
      404: translate ? translate('error.not_found') : 'Requested resource not found',
      409: translate ? translate('error.conflict') : 'Data already exists in the system',
      500: translate ? translate('error.server_error') : 'Internal server error occurred'
    };
    
    message = statusMessages[error.response.status] || 
              (translate ? translate('error.http_error', { status: error.response.status }) : `Error occurred (${error.response.status})`);
  }

  return { message, details, statusCode: error.response?.status };
};

export default useNotification; 