import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Unauthorized = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-red-500 mb-4">403</div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-secondary-600">
            ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
          {user && (
            <p className="text-sm text-secondary-500 mt-2">
              คุณเข้าสู่ระบบในฐานะ: <span className="font-medium">{user.role}</span>
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary inline-block"
          >
            กลับสู่หน้าแรก
          </Link>
          <br />
          {user ? (
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              ออกจากระบบ
            </button>
          ) : (
            <Link
              to="/login"
              className="btn-secondary inline-block"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
        
        <div className="mt-12 text-sm text-secondary-500">
          <p>หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณา <Link to="/contact" className="text-primary-600 hover:underline">ติดต่อแอดมิน</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 