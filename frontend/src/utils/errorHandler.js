import { toast, parseApiError } from '../hooks/useNotification';

/**
 * Global Error Handler for centralized error management
 */
export class ErrorHandler {
  /**
   * Handle API Error and show toast notification
   * @param {Error} error - Error object from API call
   * @param {string} context - Error context (e.g. 'Login', 'Order')
   * @param {object} options - Additional options
   */
  static handleApiError(error, context = '', options = {}) {
    const { message, details, statusCode } = parseApiError(error);
    
    let finalMessage = message;
    if (context) {
      finalMessage = `${context}: ${message}`;
    }

    // Log error for debugging
    console.error(`[API Error] ${context}:`, {
      message: finalMessage,
      statusCode,
      details,
      originalError: error
    });

    // Show toast notification
    if (!options.silent) {
      toast.error(finalMessage, {
        duration: options.duration || (statusCode >= 500 ? 8000 : 5000)
      });
    }

    return { message: finalMessage, statusCode, details };
  }

  /**
   * Handle Network Error
   * @param {string} context - Error context
   * @param {object} options - Additional options
   */
  static handleNetworkError(context = '', options = {}) {
    const message = context 
      ? `${context}: Unable to connect to server`
      : 'Unable to connect to server';

    console.error(`[Network Error] ${context}`);
    
    if (!options.silent) {
      toast.error(message, { duration: 6000 });
    }

    return { message, statusCode: null };
  }

  /**
   * Handle Validation Error
   * @param {object} validationErrors - Object with field validation errors
   * @param {string} context - Error context
   */
  static handleValidationError(validationErrors, context = 'Data validation') {
    const errors = [];
    
    Object.entries(validationErrors).forEach(([field, messages]) => {
      const fieldName = this.translateFieldName(field);
      if (Array.isArray(messages)) {
        errors.push(`${fieldName}: ${messages.join(', ')}`);
      } else {
        errors.push(`${fieldName}: ${messages}`);
      }
    });

    const message = `${context}:\n${errors.join('\n')}`;
    
    console.error(`[Validation Error] ${context}:`, validationErrors);
    toast.error(message, { duration: 7000 });

    return { message, errors: validationErrors };
  }

  /**
   * Translate field names to English (human-readable)
   * @param {string} fieldName - Field name in English
   * @returns {string} Human-readable field name
   */
  static translateFieldName(fieldName) {
    const translations = {
      'username': 'Username',
      'email': 'Email',
      'password': 'Password',
      'confirm_password': 'Confirm Password',
      'phone_number': 'Phone Number',
      'address': 'Address',
      'role': 'Role',
      'restaurant_name': 'Restaurant Name',
      'description': 'Description',
      'product_name': 'Product Name',
      'price': 'Price',
      'category': 'Category',
      'quantity': 'Quantity',
      'delivery_address': 'Delivery Address',
      'payment_method': 'Payment Method',
      'amount': 'Amount'
    };

    return translations[fieldName] || fieldName;
  }

  /**
   * Handle Authentication Error
   * @param {Error} error - Error object
   * @param {function} logoutCallback - Function for logout
   */
  static handleAuthError(error, logoutCallback) {
    const statusCode = error.response?.status;
    
    if (statusCode === 401) {
      toast.error('Session expired. Please login again');
      if (logoutCallback) {
        setTimeout(() => logoutCallback(), 2000);
      }
    } else if (statusCode === 403) {
      toast.error('You do not have permission to access this page');
    } else {
      this.handleApiError(error, 'Authentication');
    }
  }

  /**
   * Handle Error for food ordering
   * @param {Error} error - Error object
   */
  static handleOrderError(error) {
    const { message, statusCode } = parseApiError(error);
    
    let userMessage = '';
    
    switch (statusCode) {
      case 400:
        userMessage = 'Invalid order data. Please check and try again';
        break;
      case 409:
        userMessage = 'Product or restaurant is not available for service';
        break;
      case 422:
        userMessage = 'Unable to process order. Please try again';
        break;
      default:
        userMessage = `Order failed: ${message}`;
    }

    console.error('[Order Error]:', { message, statusCode, error });
    toast.error(userMessage, { duration: 6000 });

    return { message: userMessage, statusCode };
  }

  /**
   * Handle File Upload Error
   * @param {Error} error - Error object
   * @param {string} fileType - File type (e.g. 'image', 'document')
   */
  static handleFileUploadError(error, fileType = 'file') {
    const { message, statusCode } = parseApiError(error);
    
    let userMessage = '';
    
    switch (statusCode) {
      case 413:
        userMessage = `${fileType} size is too large`;
        break;
      case 415:
        userMessage = `${fileType} format is not supported`;
        break;
      default:
        userMessage = `${fileType} upload failed: ${message}`;
    }

    console.error('[File Upload Error]:', { message, statusCode, error });
    toast.error(userMessage);

    return { message: userMessage, statusCode };
  }
}

/**
 * Simple function to handle error
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {object} options - Additional options
 */
export const handleError = (error, context = '', options = {}) => {
  if (!error.response) {
    return ErrorHandler.handleNetworkError(context, options);
  }
  
  return ErrorHandler.handleApiError(error, context, options);
};

/**
 * Function to handle async operations with error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {string} context - Operation context
 * @param {object} options - Additional options
 */
export const withErrorHandling = async (asyncFn, context = '', options = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context, options);
    
    if (options.rethrow) {
      throw error;
    }
    
    return null;
  }
};

/**
 * Higher-order function to wrap async functions with error handling
 * @param {Function} asyncFn - Async function
 * @param {string} context - Operation context
 * @param {object} defaultOptions - Default options
 */
export const withAsyncErrorHandler = (asyncFn, context = '', defaultOptions = {}) => {
  return async (...args) => {
    const options = { ...defaultOptions, ...args[args.length - 1] };
    return withErrorHandling(() => asyncFn(...args), context, options);
  };
};

export default ErrorHandler; 