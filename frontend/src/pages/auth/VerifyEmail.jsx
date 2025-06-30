import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
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
      setMessage('กรุณากรอกรหัสยืนยัน');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationStatus('verifying');
      setMessage('กำลังยืนยันอีเมล...');
      
      const result = await verifyEmail(verificationToken.trim());
      
      if (result.success) {
        setVerificationStatus('success');
        setMessage('ยืนยันอีเมลสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว');
      } else {
        setVerificationStatus('error');
        setMessage(result.error || 'ไม่สามารถยืนยันอีเมลได้');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('เกิดข้อผิดพลาดในการยืนยันอีเมล');
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
      setMessage('ไม่พบที่อยู่อีเมล');
      return;
    }

    try {
      setIsResending(true);
      const result = await resendVerification(email);
      
      if (result.success) {
        setMessage(`ส่งอีเมลยืนยันใหม่ไปยัง ${email} แล้ว`);
        setCanResend(false);
        setCountdown(60); // 60 วินาทีก่อนส่งใหม่ได้
      } else {
        setMessage(result.error || 'ไม่สามารถส่งอีเมลยืนยันได้');
      }
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการส่งอีเมล');
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
              กำลังยืนยันอีเมล
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
              ยืนยันอีเมลสำเร็จ!
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600">
              {message}
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                เข้าสู่ระบบ
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
            {verificationStatus === 'error' ? 'เกิดข้อผิดพลาด' : 'ยืนยันอีเมลของคุณ'}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            {message || (email 
              ? `เราได้ส่งรหัสยืนยันไปยัง ${email} แล้ว กรุณาตรวจสอบอีเมลและกรอกรหัสยืนยันด้านล่าง`
              : 'กรุณาตรวจสอบอีเมลและกรอกรหัสยืนยันด้านล่าง'
            )}
          </p>
          
          {/* Token Input Form */}
          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-secondary-700 mb-2">
                รหัสยืนยัน
              </label>
              <input
                id="token"
                name="token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="กรอกรหัสยืนยันจากอีเมล"
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                maxLength={36}
                disabled={isVerifying}
                required
              />
              <p className="mt-1 text-xs text-secondary-500">
                รหัสยืนยันจะมีลักษณะเป็น: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
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
                  <span className="ml-2">กำลังยืนยัน...</span>
                </>
              ) : (
                'ยืนยันอีเมล'
              )}
            </button>
          </form>
          
          {verificationStatus === 'error' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">
                หากคุณมีปัญหาในการยืนยันอีเมล กรุณาลองส่งรหัสยืนยันใหม่ หรือติดต่อฝ่ายสนับสนุน
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
                    <span className="ml-2">กำลังส่ง...</span>
                  </>
                ) : !canResend ? (
                  `ส่งใหม่ได้ใน ${countdown} วินาที`
                ) : (
                  'ส่งรหัสยืนยันใหม่'
                )}
              </button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex-1 flex justify-center py-3 px-4 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                สมัครใหม่
              </Link>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 เคล็ดลับ:</strong> ตรวจสอบโฟลเดอร์ Spam หรือ Junk Mail 
              หากไม่พบอีเมลรหัสยืนยันในกล่องรับปกติ รหัสยืนยันจะมีลักษณะเป็นตัวอักษรและตัวเลข
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 