import { useState, useCallback } from 'react';

const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((message) => addNotification(message, 'success'), [addNotification]);
  const error = useCallback((message) => addNotification(message, 'error'), [addNotification]);
  const warning = useCallback((message) => addNotification(message, 'warning'), [addNotification]);
  const info = useCallback((message) => addNotification(message, 'info'), [addNotification]);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification,
  };
};

// Simple toast object for backward compatibility
export const toast = {
  success: (message) => {
    // Simple browser notification for now
    console.log('✅ Success:', message);
    if (window.alert) {
      setTimeout(() => alert(`✅ ${message}`), 100);
    }
  },
  error: (message) => {
    console.error('❌ Error:', message);
    if (window.alert) {
      setTimeout(() => alert(`❌ ${message}`), 100);
    }
  },
  warning: (message) => {
    console.warn('⚠️ Warning:', message);
    if (window.alert) {
      setTimeout(() => alert(`⚠️ ${message}`), 100);
    }
  },
  info: (message) => {
    console.info('ℹ️ Info:', message);
    if (window.alert) {
      setTimeout(() => alert(`ℹ️ ${message}`), 100);
    }
  }
};

export default useNotification; 