import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { languageService } from '../services/languageService';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('language') || 'en');
  const [translations, setTranslations] = useState({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'th', name: 'ไทย' },
    { code: 'ko', name: '한국어' }
  ]);

  // Cache สำหรับเก็บ translations ทุกภาษาที่โหลดแล้ว
  const translationsCache = useRef({});
  
  // Cache management - ใช้ timestamp จาก API แทน hard-coded version
  // ไม่ต้อง manual update อีกต่อไป! 🎉
  const CACHE_EXPIRY_DAYS = 7; // Cache หมดอายุใน 7 วัน

  // Fetch available languages and default language
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await languageService.getAvailableLanguages();
        
        // API ส่งกลับข้อมูลในรูปแบบ paginated response
        if (response?.data?.results) {
          const formattedLanguages = response.data.results.map(lang => ({
            code: lang.code,
            name: lang.name === 'Thai' ? 'ไทย' : lang.name,
            is_default: lang.is_default
          }));
          setAvailableLanguages(formattedLanguages);

          // ถ้าไม่มีภาษาที่เลือกไว้ใน localStorage ให้ใช้ภาษาเริ่มต้นจาก API
          if (!localStorage.getItem('language')) {
            const defaultLang = formattedLanguages.find(lang => lang.is_default);
            if (defaultLang) {
              setCurrentLanguage(defaultLang.code);
              localStorage.setItem('language', defaultLang.code);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  // Fetch translations when language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      // ตรวจสอบว่ามีใน cache หรือไม่
      if (translationsCache.current[currentLanguage]) {
        console.log(`✅ Using cached translations for ${currentLanguage}`);
        setTranslations(translationsCache.current[currentLanguage]);
        return;
      }

      // ตรวจสอบ localStorage ก่อน
      const localStorageKey = `translations_${currentLanguage}`;
      const cachedData = localStorage.getItem(localStorageKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          
          // ตรวจสอบวันหมดอายุ
          const cacheDate = parsed.timestamp ? new Date(parsed.timestamp) : new Date(0);
          const now = new Date();
          const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
          const isNotExpired = daysDiff < CACHE_EXPIRY_DAYS;
          
          if (isNotExpired && parsed.translations && parsed.lastUpdated) {
            // ใช้ cache ชั่วคราวและตรวจสอบ version ใน background
            console.log(`✅ Using localStorage translations for ${currentLanguage} (${Math.floor(daysDiff)} days old)`);
            translationsCache.current[currentLanguage] = parsed.translations;
            setTranslations(parsed.translations);
            
            // ตรวจสอบ version ใน background (ไม่ block UI)
            checkAndUpdateCache(currentLanguage, parsed.lastUpdated, localStorageKey);
            return;
          } else {
            console.log(`🔄 Cache expired for ${currentLanguage}. Days: ${Math.floor(daysDiff)}`);
            localStorage.removeItem(localStorageKey);
          }
        } catch (error) {
          console.error('Error parsing cached translations:', error);
          localStorage.removeItem(localStorageKey);
        }
      }

      // ถ้าไม่มีใน cache ให้โหลดจาก API
      setIsLoadingTranslations(true);
      try {
        console.log(`🔄 Fetching translations from API for ${currentLanguage}...`);
        const response = await languageService.getTranslations(currentLanguage);
        
        // API ส่งกลับข้อมูลเป็น array โดยตรง
        if (response?.data && Array.isArray(response.data)) {
          const formattedTranslations = {};
          response.data.forEach(translation => {
            formattedTranslations[translation.key] = translation.value;
          });
          
          // เก็บใน memory cache
          translationsCache.current[currentLanguage] = formattedTranslations;
          
          // เก็บใน localStorage พร้อม lastUpdated timestamp จาก server
          try {
            // ดึง lastUpdated จาก response header หรือจาก data
            const lastUpdated = response.headers?.['x-translations-last-updated'] || 
                               response.data[0]?.updated_at ||
                               new Date().toISOString();
            
            const cacheData = {
              timestamp: new Date().toISOString(),
              lastUpdated: lastUpdated,
              translations: formattedTranslations
            };
            localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
            console.log(`✅ Cached ${response.data.length} translations for ${currentLanguage} (last updated: ${lastUpdated})`);
          } catch (storageError) {
            console.warn('Failed to cache translations in localStorage:', storageError);
          }
          
          setTranslations(formattedTranslations);
        }
      } catch (error) {
        console.error('Error fetching translations:', error);
      } finally {
        setIsLoadingTranslations(false);
      }
    };

    fetchTranslations();
  }, [currentLanguage]);

  // ฟังก์ชันตรวจสอบและอัพเดท cache ใน background
  const checkAndUpdateCache = async (langCode, cachedLastUpdated, storageKey) => {
    try {
      // เรียก API เพื่อเช็ค version เท่านั้น (ไม่ดึง translations ทั้งหมด)
      const response = await languageService.getTranslations(langCode, { only_check_version: true });
      
      if (response?.data?.last_updated) {
        const serverLastUpdated = response.data.last_updated;
        
        // ถ้า server มี version ใหม่กว่า cache
        if (serverLastUpdated !== cachedLastUpdated) {
          console.log(`🔄 New translations available for ${langCode}. Updating cache...`);
          
          // โหลด translations ใหม่
          const fullResponse = await languageService.getTranslations(langCode);
          
          if (fullResponse?.data && Array.isArray(fullResponse.data)) {
            const formattedTranslations = {};
            fullResponse.data.forEach(translation => {
              formattedTranslations[translation.key] = translation.value;
            });
            
            // อัพเดท cache
            const cacheData = {
              timestamp: new Date().toISOString(),
              lastUpdated: serverLastUpdated,
              translations: formattedTranslations
            };
            
            localStorage.setItem(storageKey, JSON.stringify(cacheData));
            translationsCache.current[langCode] = formattedTranslations;
            
            // อัพเดท UI ถ้าเป็นภาษาปัจจุบัน
            if (langCode === currentLanguage) {
              setTranslations(formattedTranslations);
              console.log(`✅ Translations updated for ${langCode} (background refresh)`);
            }
          }
        } else {
          console.log(`✅ Cache is up-to-date for ${langCode}`);
        }
      }
    } catch (error) {
      console.error('Error checking translation version:', error);
      // ไม่ต้องทำอะไร ใช้ cache เดิมต่อ
    }
  };

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  // ใช้ useMemo เพื่อลด re-renders
  const translate = useMemo(() => {
    return (key, variables = {}) => {
      let text = translations[key] || key;
      
      Object.keys(variables).forEach(varKey => {
        const placeholder = `{${varKey}}`;
        const replacement = variables[varKey];
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), replacement);
      });
      
      return text;
    };
  }, [translations]);

  // ฟังก์ชันสำหรับล้าง cache (สำหรับ admin ที่อัพเดทแปลภาษา หรือ user ที่เจอปัญหา)
  const clearCache = useCallback(() => {
    translationsCache.current = {};
    const languages = ['en', 'th', 'ko'];
    languages.forEach(lang => {
      localStorage.removeItem(`translations_${lang}`);
    });
    console.log('🗑️ Cleared all translation caches');
    
    // โหลด translations ภาษาปัจจุบันใหม่
    setTranslations({});
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);
  
  // ฟังก์ชันตรวจสอบ cache info
  const getCacheInfo = useCallback(() => {
    const info = {};
    const languages = ['en', 'th', 'ko'];
    languages.forEach(lang => {
      const cachedData = localStorage.getItem(`translations_${lang}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheDate = parsed.timestamp ? new Date(parsed.timestamp) : null;
          const lastUpdated = parsed.lastUpdated ? new Date(parsed.lastUpdated) : null;
          info[lang] = {
            lastUpdated: lastUpdated ? lastUpdated.toLocaleString() : 'unknown',
            timestamp: cacheDate ? cacheDate.toLocaleString() : 'unknown',
            entries: parsed.translations ? Object.keys(parsed.translations).length : 0,
            daysOld: cacheDate ? Math.floor((new Date() - cacheDate) / (1000 * 60 * 60 * 24)) : null
          };
        } catch (e) {
          info[lang] = { error: 'Invalid cache data' };
        }
      } else {
        info[lang] = { status: 'No cache' };
      }
    });
    return info;
  }, []);

  const value = useMemo(() => ({
    currentLanguage,
    availableLanguages,
    changeLanguage,
    translate,
    isLoadingTranslations,
    clearCache,
    getCacheInfo
  }), [currentLanguage, availableLanguages, translate, isLoadingTranslations, clearCache, getCacheInfo]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 