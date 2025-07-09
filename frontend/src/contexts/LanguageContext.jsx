import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'th', name: 'ไทย' },
    { code: 'ko', name: '한국어' }
  ]);

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
      try {
        const response = await languageService.getTranslations(currentLanguage);
        
        // API ส่งกลับข้อมูลเป็น array โดยตรง
        if (response?.data && Array.isArray(response.data)) {
          const formattedTranslations = {};
          response.data.forEach(translation => {
            formattedTranslations[translation.key] = translation.value;
          });
          setTranslations(formattedTranslations);
        }
      } catch (error) {
        console.error('Error fetching translations:', error);
      }
    };

    fetchTranslations();
  }, [currentLanguage]);

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  const translate = (key, variables = {}) => {
    let text = translations[key] || key;
    
    Object.keys(variables).forEach(varKey => {
      const placeholder = `{${varKey}}`;
      const replacement = variables[varKey];
      text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), replacement);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, availableLanguages, changeLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 