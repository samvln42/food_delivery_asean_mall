import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../services/api';
import Loading from '../../components/common/Loading';

const ForgotPassword = () => {
  const { translate } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // State for Request Reset (Step 1)
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, success, error
  const [requestMessage, setRequestMessage] = useState('');
  
  // State for Confirm Reset (Step 2)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState('idle'); // idle, success, error
  const [resetMessage, setResetMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validate password match
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError(translate('forgot_password.password_mismatch'));
    } else {
      setPasswordError('');
    }
  }, [newPassword, confirmPassword, translate]);

  // Handle Request Password Reset (Step 1)
  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setRequestMessage(translate('forgot_password.email_required'));
      return;
    }

    try {
      setIsSubmitting(true);
      setRequestStatus('idle');
      
      const response = await authService.resetPassword(email);
      
      if (response.data) {
        setRequestStatus('success');
        setRequestMessage(translate('forgot_password.reset_email_sent', { email }));
        setEmail('');
      }
    } catch (error) {
      setRequestStatus('error');
      setRequestMessage(error.response?.data?.message || translate('forgot_password.reset_email_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Password Reset (Step 2)
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setResetMessage(translate('forgot_password.all_fields_required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage(translate('forgot_password.password_mismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setResetMessage(translate('forgot_password.password_too_short'));
      return;
    }

    try {
      setIsResetting(true);
      setResetStatus('idle');
      
      const response = await authService.resetPasswordConfirm({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      if (response.data) {
        setResetStatus('success');
        setResetMessage(translate('forgot_password.reset_success'));
      }
    } catch (error) {
      setResetStatus('error');
      setResetMessage(error.response?.data?.message || translate('forgot_password.reset_error'));
    } finally {
      setIsResetting(false);
    }
  };

  // If token exists, show password reset form (Step 2)
  if (token) {
    // Success state
    if (resetStatus === 'success') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
                {translate('forgot_password.reset_success_title')}
              </h2>
              <p className="mt-2 text-center text-sm text-secondary-600">
                {resetMessage}
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {translate('common.login')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Reset password form
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
              {translate('forgot_password.reset_password_title')}
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600">
              {translate('forgot_password.enter_new_password')}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleConfirmReset}>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('forgot_password.new_password')}
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-secondary-300 placeholder-secondary-500 text-secondary-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={translate('forgot_password.new_password_placeholder')}
                  required
                  minLength={8}
                  disabled={isResetting}
                />
                <p className="mt-1 text-xs text-secondary-500">
                  {translate('forgot_password.password_requirements')}
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('forgot_password.confirm_password')}
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    passwordError ? 'border-red-300' : 'border-secondary-300'
                  } placeholder-secondary-500 text-secondary-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder={translate('forgot_password.confirm_password_placeholder')}
                  required
                  disabled={isResetting}
                />
                {passwordError && (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            {resetMessage && (
              <div className={`rounded-lg p-4 ${
                resetStatus === 'error' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  resetStatus === 'error' ? 'text-red-600' : 'text-blue-800'
                }`}>
                  {resetMessage}
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isResetting || passwordError}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                  isResetting || passwordError
                    ? 'bg-secondary-300 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
              >
                {isResetting ? (
                  <>
                    <Loading size="small" text="" />
                    <span className="ml-2">{translate('forgot_password.resetting_button')}</span>
                  </>
                ) : (
                  translate('forgot_password.reset_password_button')
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {translate('forgot_password.back_to_login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Request password reset form (Step 1)
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            {translate('forgot_password.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            {translate('forgot_password.subtitle')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('auth.email')}
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-3 border border-secondary-300 placeholder-secondary-500 text-secondary-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={translate('forgot_password.email_placeholder')}
              required
              disabled={isSubmitting}
            />
          </div>

          {requestMessage && (
            <div className={`rounded-lg p-4 ${
              requestStatus === 'error' 
                ? 'bg-red-50 border border-red-200' 
                : requestStatus === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                requestStatus === 'error' 
                  ? 'text-red-600' 
                  : requestStatus === 'success'
                  ? 'text-green-800'
                  : 'text-blue-800'
              }`}>
                {requestMessage}
              </p>
            </div>
          )}

          {requestStatus === 'success' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {translate('forgot_password.check_email_tip')}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isSubmitting
                  ? 'bg-secondary-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loading size="small" text="" />
                  <span className="ml-2">{translate('forgot_password.sending_button')}</span>
                </>
              ) : (
                translate('forgot_password.send_reset_link')
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {translate('forgot_password.back_to_login')}
            </Link>
            <Link
              to="/register"
              className="font-medium text-secondary-600 hover:text-secondary-500"
            >
              {translate('forgot_password.create_account')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

