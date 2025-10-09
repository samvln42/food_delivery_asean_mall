import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
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
      const cachedTranslations = localStorage.getItem(localStorageKey);
      
      if (cachedTranslations) {
        try {
          const parsed = JSON.parse(cachedTranslations);
          console.log(`✅ Using localStorage translations for ${currentLanguage}`);
          translationsCache.current[currentLanguage] = parsed;
          setTranslations(parsed);
          return;
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
          
          // เก็บใน localStorage
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(formattedTranslations));
            console.log(`✅ Cached ${response.data.length} translations for ${currentLanguage}`);
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

  // ฟังก์ชันสำหรับล้าง cache (สำหรับ admin ที่อัพเดทแปลภาษา)
  const clearCache = () => {
    translationsCache.current = {};
    const languages = ['en', 'th', 'ko'];
    languages.forEach(lang => {
      localStorage.removeItem(`translations_${lang}`);
    });
    console.log('🗑️ Cleared all translation caches');
  };

  const value = useMemo(() => ({
    currentLanguage,
    availableLanguages,
    changeLanguage,
    translate,
    isLoadingTranslations,
    clearCache
  }), [currentLanguage, availableLanguages, translate, isLoadingTranslations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 