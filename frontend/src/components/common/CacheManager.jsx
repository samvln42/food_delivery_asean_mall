import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Cache Manager Component
 * สำหรับ Admin หรือ Settings page เพื่อจัดการ translation cache
 * ใช้เมื่อมีการอัพเดทคำแปลในฐานข้อมูล
 */
const CacheManager = () => {
  const { translate, clearCache, getCacheInfo } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);

  const handleShowInfo = () => {
    const info = getCacheInfo();
    setCacheInfo(info);
    setShowInfo(!showInfo);
  };

  const handleClearCache = () => {
    if (window.confirm(translate('settings.confirm_clear_cache') || 'Clear all translation cache? The page will reload.')) {
      clearCache();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {translate('settings.cache_management') || 'Translation Cache Management'}
      </h3>
      
      <div className="space-y-4">
        {/* Info */}
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-800">
            ✨ <strong>Auto-sync enabled!</strong> Cache will automatically update when translations change.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShowInfo}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {showInfo ? '🔼 Hide' : '🔍 Show'} Cache Info
          </button>
          
          <button
            onClick={handleClearCache}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            🗑️ Clear Cache
          </button>
        </div>

        {/* Cache Info */}
        {showInfo && cacheInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <h4 className="font-semibold mb-3">Cache Information:</h4>
            {Object.entries(cacheInfo).map(([lang, info]) => (
              <div key={lang} className="mb-3 p-3 bg-white rounded border">
                <div className="font-semibold text-lg mb-2">
                  {lang === 'th' ? '🇹🇭 Thai' : lang === 'en' ? '🇬🇧 English' : '🇰🇷 Korean'}
                </div>
                {info.status ? (
                  <p className="text-gray-500 text-sm">{info.status}</p>
                ) : info.error ? (
                  <p className="text-red-500 text-sm">{info.error}</p>
                ) : (
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Last Updated (Server):</span>{' '}
                      <span className="text-green-600">
                        {info.lastUpdated || 'Unknown'}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Entries:</span> {info.entries} translations
                    </p>
                    <p>
                      <span className="font-medium">Cached on:</span> {info.timestamp}
                    </p>
                    <p>
                      <span className="font-medium">Age:</span>{' '}
                      <span className={info.daysOld > 7 ? 'text-orange-600' : 'text-green-600'}>
                        {info.daysOld} days old
                        {info.daysOld > 7 && ' ⚠️'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <p className="font-semibold mb-1">💡 When to use:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>After updating translations in the database</li>
            <li>When users report seeing old translations</li>
            <li>When translations are not updating correctly</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
          <p className="font-semibold mb-1">⚠️ Note:</p>
          <p>
            Clearing cache will reload the page and all users will need to reload 
            to see new translations (or wait for cache expiry).
          </p>
        </div>
      </div>
    </div>
  );
};

export default CacheManager;

