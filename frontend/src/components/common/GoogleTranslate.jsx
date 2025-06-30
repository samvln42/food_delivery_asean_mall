import React, { useState, useRef, useEffect } from 'react';

const GoogleTranslate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('th');
  const [isTranslating, setIsTranslating] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'th', name: 'ไทย', flag: '🇹🇭', nativeName: 'ไทย' },
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
    // { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
    // { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
    // { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
    // { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
    // { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
    // { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
    // { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' }
  ];

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ดึงข้อมูลภาษาปัจจุบัน
  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLang) || languages[0];
  };

  // ฟังก์ชันแปลหน้าเว็บ (วิธีง่ายที่ทำงานได้แน่นอน)
  const translatePage = (langCode) => {
    // ป้องกันการคลิกซ้ำขณะกำลังแปล
    if (isTranslating) return;

    // ตรวจสอบภาษาปัจจุบัน
    const currentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('googtrans='));
    
    let currentLangFromCookie = 'th';
    if (currentCookie) {
      try {
        const cookieValue = currentCookie.split('=')[1];
        const parts = cookieValue.split('/');
        if (parts.length >= 3) {
          currentLangFromCookie = parts[2];
        }
      } catch (e) {
        // ignore error
      }
    }

    // ถ้าเป็นภาษาเดิม ไม่ต้องทำอะไร
    if (currentLangFromCookie === langCode) {
      console.log(`Already in ${langCode}, no action needed`);
      return;
    }

    // เริ่มแสดง loading
    setIsTranslating(true);
    console.log(`Starting translation to ${langCode}`);

    if (langCode === 'th') {
      // กลับไปภาษาต้นฉบับ - ลบ cookie และ reload
      console.log('Clearing cookies and returning to Thai');
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
      
      setTimeout(() => {
        window.location.reload();
      }, 800);
      return;
    }

    // ใช้วิธี cookie + reload เป็นวิธีหลัก (เชื่อถือได้ที่สุด)
    console.log(`Setting up translation to ${langCode} using cookie method`);
    
    // ลบ cookie เก่าก่อน
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
    
    // รอสักครู่แล้วตั้ง cookie ใหม่
    setTimeout(() => {
      const googTransCookie = `/auto/${langCode}`;
      console.log(`Setting cookie: googtrans=${googTransCookie}`);
      
      // ตั้ง cookie หลายแบบเพื่อให้แน่ใจ
      document.cookie = `googtrans=${googTransCookie}; path=/; max-age=3600`;
      document.cookie = `googtrans=${googTransCookie}; domain=${window.location.hostname}; path=/; max-age=3600`;
      
      // Reload หน้าเพื่อให้ Google Translate ทำงาน
      setTimeout(() => {
        console.log('Reloading page for translation...');
        window.location.reload();
      }, 300);
    }, 200);
  };



  // จัดการการเลือกภาษา
  const handleLanguageSelect = (langCode) => {
    if (isTranslating) return; // ป้องกันการคลิกซ้ำ
    
    setCurrentLang(langCode);
    setIsOpen(false);
    translatePage(langCode);
  };

  // ตรวจสอบว่าหน้าเว็บถูกแปลอยู่หรือไม่
  useEffect(() => {
    const checkTranslatedPage = () => {
      // ตรวจสอบ cookie
      const googTransCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('googtrans='));
      
      if (googTransCookie) {
        try {
          const cookieValue = googTransCookie.split('=')[1];
          const parts = cookieValue.split('/');
          if (parts.length >= 3) {
            const langCode = parts[2];
            if (langCode && langCode !== 'th' && langCode !== 'auto') {
              setCurrentLang(langCode);
              return;
            }
          }
        } catch (error) {
          console.log('Error parsing cookie:', error);
        }
      }
      
      // ถ้าไม่เจออะไร ให้เป็นภาษาไทย
      setCurrentLang('th');
    };

    checkTranslatedPage();
    
    // สร้าง Google Translate widget จริงเพื่อให้แปลได้
    initializeGoogleTranslate();
    
  }, []);

  // สร้าง Google Translate widget จริง
  const initializeGoogleTranslate = () => {
    // ตรวจสอบว่ามี element สำหรับ widget หรือยัง
    if (document.getElementById('google_translate_element_main')) {
      return;
    }

    // สร้าง element สำหรับ Google Translate
    const translateDiv = document.createElement('div');
    translateDiv.id = 'google_translate_element_main';
    translateDiv.style.position = 'fixed';
    translateDiv.style.top = '-1000px';
    translateDiv.style.left = '-1000px';
    translateDiv.style.visibility = 'hidden';
    document.body.appendChild(translateDiv);

    // โหลด Google Translate script
    if (!window.google || !window.google.translate) {
      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement({
          pageLanguage: 'th',
          includedLanguages: 'th,en,ko,ja,zh-CN,fr,de,es,vi,ru',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true
        }, 'google_translate_element_main');
        
        console.log('Google Translate widget created');
        
        // ซ่อน Google branding
        setTimeout(() => {
          const banner = document.querySelector('.goog-te-banner-frame');
          if (banner) banner.style.display = 'none';
          document.body.style.top = '0px';
        }, 1000);
      };

      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    } else {
      window.googleTranslateElementInit();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ปุ่มเปิด dropdown */}
      <button
        onClick={() => !isTranslating && setIsOpen(!isOpen)}
        disabled={isTranslating}
        className={`flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm ${
          isTranslating 
            ? 'opacity-75 cursor-not-allowed' 
            : 'hover:bg-gray-50 cursor-pointer'
        }`}
        title={isTranslating ? "กำลังแปลภาษา..." : "เลือกภาษา"}
      >
        <span className="text-lg">{getCurrentLanguage().flag}</span>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {isTranslating ? 'กำลังแปล...' : getCurrentLanguage().nativeName}
        </span>
        {isTranslating ? (
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        ) : (
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !isTranslating && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          <div className="py-2">
            {/* หัวข้อ */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                เลือกภาษา
              </p>
            </div>
            
            {/* รายการภาษา */}
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                  currentLang === lang.code 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                    : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium">{lang.nativeName}</p>
                  <p className="text-xs text-gray-500">{lang.name}</p>
                </div>
                {currentLang === lang.code && (
                  <span className="text-blue-500 font-bold">✓</span>
                )}
              </button>
            ))}
            
            {/* ข้อมูลเพิ่มเติม */}
            <div className="border-t border-gray-100 px-4 py-3 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">⚡ Powered by Google Translate</span>
              </div>
              {currentLang !== 'th' && (
                <div className="mt-2">
                  <p className="text-xs text-blue-600 font-medium">
                    🌐 หน้านี้กำลังแสดงเป็นภาษา {getCurrentLanguage().nativeName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* สถานะการแปล */}
      {currentLang !== 'th' && !isTranslating && (
        <div className="absolute -top-1 -right-1">
          <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
            T
          </span>
        </div>
      )}

      {/* ข้อความแจ้งเตือนขณะแปล */}
      {isTranslating && (
        <div className="absolute top-full right-0 mt-2 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-sm text-blue-800 whitespace-nowrap z-50 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>กำลังแปลหน้าเว็บ...</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            กรุณารอสักครู่
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate; 