import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Loading from '../../components/common/Loading';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const { translate } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // ดึงอีเมลจาก state หรือ URL params
  const email = location.state?.email || searchParams.get('email') || '';

  // ไม่ต้องยืนยันอัตโนมัติจาก URL แล้ว
  // useEffect(() => {
  //   if (token) {
  //     handleVerification(token);
  //   }
  // }, [token]);

  useEffect(() => {
    // Countdown timer สำหรับ resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerification = async (verificationToken) => {
    if (!verificationToken || !verificationToken.trim()) {
      setMessage(translate('verify_email.enter_code_error'));
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationStatus('verifying');
      setMessage(translate('verify_email.verifying'));
      
      const result = await verifyEmail(verificationToken.trim());
      
      if (result.success) {
        setVerificationStatus('success');
        setMessage(translate('verify_email.success_message'));
      } else {
        setVerificationStatus('error');
        setMessage(result.error || translate('verify_email.failed_to_verify'));
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage(translate('verify_email.failed_to_verify'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleVerification(tokenInput);
  };

  const handleResendVerification = async () => {
    if (!email) {
      setMessage(translate('verify_email.email_not_found'));
      return;
    }

    try {
      setIsResending(true);
      const result = await resendVerification(email);
      
      if (result.success) {
        setMessage(translate('verify_email.resend_success', { email }));
        setCanResend(false);
        setCountdown(60); // 60 วินาทีก่อนส่งใหม่ได้
      } else {
        setMessage(result.error || translate('verify_email.resend_failed'));
      }
    } catch (error) {
      setMessage(translate('verify_email.resend_error'));
    } finally {
      setIsResending(false);
    }
  };

  // กรณีที่กำลังยืนยัน
  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Loading size="small" text="" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
              {translate('verify_email.verifying')}
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // กรณียืนยันสำเร็จ
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
              {translate('verify_email.success_title')}
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600">
              {message}
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

  // กรณียืนยันล้มเหลวหรือรอยืนยัน
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 flex items-center justify-center rounded-full ${
            verificationStatus === 'error' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <span className="text-2xl">
              {verificationStatus === 'error' ? '❌' : '📧'}
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            {verificationStatus === 'error' ? translate('verify_email.error_title') : translate('verify_email.pending_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            {message || (email 
              ? translate('verify_email.sent_to_email', { email })
              : translate('verify_email.check_email')
            )}
          </p>
          
          {/* Token Input Form */}
          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-secondary-700 mb-2">
                {translate('verify_email.verification_code')}
              </label>
              <input
                id="token"
                name="token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder={translate('verify_email.enter_code')}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                maxLength={36}
                disabled={isVerifying}
                required
              />
              <p className="mt-1 text-xs text-secondary-500">
                {translate('verify_email.code_format')}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isVerifying || !tokenInput.trim()}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium ${
                isVerifying || !tokenInput.trim()
                  ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                  : 'text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loading size="small" text="" />
                  <span className="ml-2">{translate('verify_email.verifying_button')}</span>
                </>
              ) : (
                translate('verify_email.verify_button')
              )}
            </button>
          </form>
          
          {verificationStatus === 'error' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">
                {translate('verify_email.error_help')}
              </p>
            </div>
          )}
          
          <div className="mt-6 space-y-4">
            {email && (
              <button
                onClick={handleResendVerification}
                disabled={isResending || !canResend}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium ${
                  isResending || !canResend
                    ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                    : 'text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
              >
                {isResending ? (
                  <>
                    <Loading size="small" text="" />
                    <span className="ml-2">{translate('verify_email.resending_button')}</span>
                  </>
                ) : !canResend ? (
                  translate('verify_email.resend_countdown', { seconds: countdown })
                ) : (
                  translate('verify_email.resend_button')
                )}
              </button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex-1 flex justify-center py-3 px-4 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {translate('common.login')}
              </Link>
              <Link
                to="/register"
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {translate('common.register')}
              </Link>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {translate('verify_email.tip_spam')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 