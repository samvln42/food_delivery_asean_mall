import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher = () => {
  const { currentLanguage, availableLanguages, changeLanguage, loading } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center text-gray-600">
        <GlobeAltIcon className="h-5 w-5 mr-1" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!availableLanguages || availableLanguages.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center">
      <GlobeAltIcon className="h-5 w-5 text-gray-600 mr-1" />
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none bg-transparent border-0 text-sm text-gray-700 py-1 pl-1 pr-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name || lang.code.toUpperCase()}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};

export default LanguageSwitcher; 