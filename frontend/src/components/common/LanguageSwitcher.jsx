import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { languageService } from '../../services/languageService';

const LanguageSwitcher = () => {
  const { currentLanguage, availableLanguages, changeLanguage, isLoadingTranslations } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);

    // TODO: Implement server-side language preference storage
    // Currently language is stored only in localStorage/context
    // if (isAuthenticated) {
    //   try {
    //     await languageService.updateUserLanguage(langCode);
    //   } catch (error) {
    //     console.error('Error updating user language:', error);
    //   }
    // }
  };

  const getCurrentLanguageName = () => {
    if (!Array.isArray(availableLanguages)) {
      return 'Language';
    }
    const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);
    return currentLang?.name || 'Language';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingTranslations}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoadingTranslations ? (
          <>
            <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <span>{getCurrentLanguageName()}</span>
            <svg
              className={`h-5 w-5 transform ${isOpen ? 'rotate-180' : ''} transition-transform duration-200`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>

      {isOpen && Array.isArray(availableLanguages) && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentLanguage === language.code
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }`}
                role="menuitem"
              >
                {language.name || language.code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 