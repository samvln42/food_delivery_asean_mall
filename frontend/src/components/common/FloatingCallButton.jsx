import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { appSettingsService } from '../../services/api';

const FloatingActionButtons = () => {
  const { currentLanguage } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [hideTimeout, setHideTimeout] = useState(null);
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    const fetchAppSettings = async () => {
      const response = await appSettingsService.getPublic();
      setAppSettings(response.data);
    };
    fetchAppSettings();
  }, []);

  const handleCall = () => {
    // เบอร์โทรสำหรับติดต่อร้านอาหาร
    const phoneNumber = appSettings?.contact_phone;
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleChat = () => {
    // เปิด Line หรือ WhatsApp หรือ Facebook Messenger - สามารถปรับเปลี่ยนได้
    // ตัวอย่าง: Line Official Account
    // const lineId = '@yourlineid'; // เปลี่ยนเป็น Line ID ของร้าน
    // window.open(`https://line.me/R/ti/p/${lineId}`, '_blank');
    
    // หรือใช้ WhatsApp
    const whatsappNumber = appSettings?.contact_phone; // เปลี่ยนเป็นเบอร์ WhatsApp
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  // ข้อความในภาษาต่างๆ สำหรับปุ่มโทร
  const getCallText = () => {
    switch (currentLanguage) {
      case 'th':
        return 'โทรหาเรา';
      case 'ko':
        return '전화하기';
      case 'en':
      default:
        return 'Call Us';
    }
  };

  // ข้อความในภาษาต่างๆ สำหรับปุ่มแชท
  const getChatText = () => {
    switch (currentLanguage) {
      case 'th':
        return 'แชทกับเรา';
      case 'ko':
        return '채팅하기';
      case 'en':
      default:
        return 'Chat with Us';
    }
  };

  // Auto-hide after 5 seconds of inactivity (initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // แสดงปุ่มเป็นเวลา 5 วินาทีแล้วซ่อน
    setHideTimeout(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsVisible(true);
    if (hideTimeout) clearTimeout(hideTimeout);
  };

  const handleMouseLeave = () => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
    setHideTimeout(timer);
  };

  return (
    <>
      {/* ปุ่มลูกศรเล็กๆ เมื่อซ่อนปุ่มหลัก */}
      {!isVisible && (
        <div 
          className="fixed bottom-20 right-0 z-50 cursor-pointer"
          onClick={handleMouseEnter}
          style={{ marginRight: '16px' }}
        >
          <div className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg transition-all duration-300 transform hover:scale-110">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* ปุ่มหลัก */}
      <div 
        className={`fixed bottom-20 right-0 z-50 flex flex-col items-end space-y-3 transition-all duration-500 transform ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ปุ่มแชท - ลอยอยู่ตลอด */}
        <div 
          className="group relative transition-all duration-300 transform translate-x-0 opacity-100"
          style={{ marginRight: '16px' }}
        >
        <button
          onClick={handleChat}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          title={getChatText()}
          aria-label={getChatText()}
        >
          {/* ไอคอนแชท */}
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path>
          </svg>
        </button>
        
        {/* ข้อความแสดงเมื่อ hover สำหรับปุ่มแชท */}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            {getChatText()}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800"></div>
          </div>
          </div>
        </div>

        {/* ปุ่มโทร - ลอยอยู่ตลอด */}
        <div 
          className="group relative transition-all duration-300 transform translate-x-0 opacity-100"
          style={{ marginRight: '16px' }}
        >
        <button
          onClick={handleCall}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
          title={getCallText()}
          aria-label={getCallText()}
        >
          {/* ไอคอนโทรศัพท์ */}
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
          </svg>
        </button>
        
        {/* ข้อความแสดงเมื่อ hover สำหรับปุ่มโทร */}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            {getCallText()}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800"></div>
          </div>
          </div>
        </div>

        {/* ปุ่มลูกศรเพื่อเก็บ - แสดงเมื่อปุ่มแสดงอยู่ */}
        <div 
          className="cursor-pointer"
          onClick={() => setIsVisible(false)}
          style={{ marginRight: '16px' }}
        >
          <div className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg transition-all duration-300 transform hover:scale-110">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

      </div>
    </>
  );
};

export default FloatingActionButtons;