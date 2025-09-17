import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';
import { ErrorHandler } from '../utils/errorHandler';
import { parseApiError } from '../hooks/useNotification';
import { validateAndCleanSession } from '../utils/auth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on app start
  useEffect(() => {
    const sessionData = validateAndCleanSession();
    
    if (sessionData) {
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: { user: sessionData.user, token: sessionData.token },
      });
    } else {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await authService.login(credentials);
      
      const { user, token } = response.data;
      
      // ตรวจสอบว่า user verify email แล้วหรือยัง
      if (!user.is_email_verified && user.role !== 'admin') {
        dispatch({
          type: actionTypes.LOGIN_FAILURE,
          payload: 'Please verify your email before logging in',
        });
        return { 
          success: false, 
          error: 'Please verify your email before logging in',
          needsEmailVerification: true,
          userEmail: user.email
        };
      }
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: { user, token },
      });
      
      return { success: true, user, token };
    } catch (error) {
      // ตรวจสอบ error แบบละเอียดมากขึ้น
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.error_type === 'email_not_verified') {
          dispatch({
            type: actionTypes.LOGIN_FAILURE,
            payload: 'Please verify your email before logging in',
          });
          return { 
            success: false, 
            error: 'Please verify your email before logging in',
            needsEmailVerification: true,
            userEmail: errorData.user_email
          };
        }
      }
      
      // Use centralized error handling
      const { message } = ErrorHandler.handleApiError(error, 'Login');
      
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: message,
      });
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await authService.register(userData);
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      
      return { 
        success: true, 
        message: response.data.message,
        needsEmailVerification: response.data.email_verification_required 
      };
    } catch (error) {
      // Use centralized error handling
      const { message } = ErrorHandler.handleApiError(error, 'Registration');
      
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: message,
      });
      return { success: false, error: message };
    }
  };

  // Google login function
  const googleLogin = async (accessToken) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await authService.googleLogin(accessToken);
      
      const { user, token } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: { user, token },
      });
      
      return { success: true, user, token };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Google login failed';
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch({ type: actionTypes.LOGOUT });
    }
  };

  // Update user profile
  const updateProfile = async () => {
    try {
      const response = await authService.getProfile();
      const user = response.data;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: actionTypes.SET_USER,
        payload: user,
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Email verification failed';
      return { success: false, error: errorMessage };
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      const response = await authService.resendVerification(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to resend verification email';
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const response = await authService.resetPassword(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
    updateProfile,
    clearError,
    verifyEmail,
    resendVerification,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 