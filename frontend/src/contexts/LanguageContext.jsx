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
      const localStorageKey = `translations_${currentLanguage}`;

      // 1. ตรวจสอบ memory cache ก่อน
      if (translationsCache.current[currentLanguage]) {
        console.log(`✅ Using memory cache for ${currentLanguage}`);
        setTranslations(translationsCache.current[currentLanguage]);
        return; // มี memory cache = ใช้เลย ไม่ต้องเรียก API
      }

      // 2. ถ้าไม่มีใน memory, เช็ค localStorage
      const cachedData = localStorage.getItem(localStorageKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheDate = parsed.timestamp ? new Date(parsed.timestamp) : new Date(0);
          const daysDiff = (new Date() - cacheDate) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < CACHE_EXPIRY_DAYS && parsed.translations) {
            console.log(`✅ Using localStorage cache for ${currentLanguage}`);
            translationsCache.current[currentLanguage] = parsed.translations;
            setTranslations(parsed.translations);
            
            // ดึงข้อมูลใหม่ใน background เพื่ออัพเดท cache (ไม่บล็อก UI)
            setTimeout(async () => {
              try {
                console.log(`🔄 Background refresh for ${currentLanguage}...`);
                const response = await languageService.getTranslations(currentLanguage);
                
                if (response?.data && Array.isArray(response.data)) {
                  const formattedTranslations = {};
                  response.data.forEach(translation => {
                    formattedTranslations[translation.key] = translation.value;
                  });
                  
                  // อัพเดท cache
                  const lastUpdated = response.headers?.['x-translations-last-updated'] || 
                                     response.data[0]?.updated_at ||
                                     new Date().toISOString();
                  
                  const cacheData = {
                    timestamp: new Date().toISOString(),
                    lastUpdated: lastUpdated,
                    translations: formattedTranslations
                  };
                  localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
                  translationsCache.current[currentLanguage] = formattedTranslations;
                  
                  // เช็คว่ามีการเปลี่ยนแปลงหรือไม่
                  const hasChanges = JSON.stringify(parsed.translations) !== JSON.stringify(formattedTranslations);
                  if (hasChanges) {
                    console.log(`✨ Cache updated with new translations for ${currentLanguage}`);
                    // อัพเดท UI แบบ smooth (เฉพาะถ้ายังอยู่ที่ภาษานี้)
                    if (currentLanguage === localStorage.getItem('language')) {
                      setTranslations(formattedTranslations);
                    }
                  }
                }
              } catch (error) {
                console.error('Background fetch error:', error);
              }
            }, 500);
            
            return;
          } else {
            localStorage.removeItem(localStorageKey);
          }
        } catch (error) {
          console.error('Error parsing cache:', error);
          localStorage.removeItem(localStorageKey);
        }
      }

      // 3. ไม่มี cache - โหลดจาก API (แสดง loading)
      setIsLoadingTranslations(true);
      try {
        console.log(`🔄 Fetching translations from API for ${currentLanguage}...`);
        const response = await languageService.getTranslations(currentLanguage);
        
        if (response?.data && Array.isArray(response.data)) {
          const formattedTranslations = {};
          response.data.forEach(translation => {
            formattedTranslations[translation.key] = translation.value;
          });
          
          // เก็บใน cache
          const lastUpdated = response.headers?.['x-translations-last-updated'] || 
                             response.data[0]?.updated_at ||
                             new Date().toISOString();
          
          const cacheData = {
            timestamp: new Date().toISOString(),
            lastUpdated: lastUpdated,
            translations: formattedTranslations
          };
          localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
          translationsCache.current[currentLanguage] = formattedTranslations;
          
          // แสดงผล
          setTranslations(formattedTranslations);
          console.log(`✅ Fetched ${response.data.length} translations for ${currentLanguage}`);
        }
      } catch (error) {
        console.error('Error fetching translations:', error);
      } finally {
        setIsLoadingTranslations(false);
      }
    };

    fetchTranslations();
  }, [currentLanguage]);


  const changeLanguage = useCallback((langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('language', langCode);
  }, []);

  // ใช้ useCallback เพื่อลด re-renders (stable function reference)
  const translate = useCallback((key, variables = {}) => {
    let text = translations[key] || key;
    
    Object.keys(variables).forEach(varKey => {
      const placeholder = `{${varKey}}`;
      const replacement = variables[varKey];
      text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), replacement);
    });
    
    return text;
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

  // Memoize context value เพื่อลด re-renders ของ child components
  const value = useMemo(() => ({
    currentLanguage,
    availableLanguages,
    changeLanguage,
    translate,
    isLoadingTranslations,
    clearCache,
    getCacheInfo
  }), [currentLanguage, availableLanguages, changeLanguage, translate, isLoadingTranslations, clearCache, getCacheInfo]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 