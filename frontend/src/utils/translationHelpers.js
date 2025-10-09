/**
 * Translation Helper Functions
 * Helper functions สำหรับจัดการ translations ของ products, categories, และ restaurants
 * รองรับทั้งแบบเก่า (translations array) และแบบใหม่ (optimized single translation)
 */

/**
 * Get translated name from item
 * @param {Object} item - Item with translations (product, category, restaurant)
 * @param {string} currentLanguage - Current language code (th, en, ko)
 * @param {string} defaultName - Default name to return if no translation found
 * @returns {string} Translated name or default name
 */
export const getTranslatedName = (item, currentLanguage, defaultName) => {
  // ถ้าไม่มี item หรือไม่มี translations ให้ return default
  if (!item || !item.translations) {
    return defaultName || '';
  }
  
  // กรณีใหม่: API ส่งแค่ translation เดียว (optimized)
  if (Array.isArray(item.translations) && item.translations.length === 1) {
    return item.translations[0]?.translated_name || defaultName || '';
  }
  
  // กรณีเก่า: API ส่งทุก translation (backward compatible)
  if (Array.isArray(item.translations) && item.translations.length > 0) {
    const translation = item.translations.find(t => t.language_code === currentLanguage);
    return translation?.translated_name || defaultName || '';
  }
  
  return defaultName || '';
};

/**
 * Get translated description from item
 * @param {Object} item - Item with translations (product, category, restaurant)
 * @param {string} currentLanguage - Current language code (th, en, ko)
 * @param {string} defaultDescription - Default description to return if no translation found
 * @returns {string} Translated description or default description
 */
export const getTranslatedDescription = (item, currentLanguage, defaultDescription) => {
  // ถ้าไม่มี item หรือไม่มี translations ให้ return default
  if (!item || !item.translations) {
    return defaultDescription || '';
  }
  
  // กรณีใหม่: API ส่งแค่ translation เดียว (optimized)
  if (Array.isArray(item.translations) && item.translations.length === 1) {
    return item.translations[0]?.translated_description || defaultDescription || '';
  }
  
  // กรณีเก่า: API ส่งทุก translation (backward compatible)
  if (Array.isArray(item.translations) && item.translations.length > 0) {
    const translation = item.translations.find(t => t.language_code === currentLanguage);
    return translation?.translated_description || defaultDescription || '';
  }
  
  return defaultDescription || '';
};

/**
 * Check if item has translation for current language
 * @param {Object} item - Item with translations
 * @param {string} currentLanguage - Current language code
 * @returns {boolean} True if translation exists
 */
export const hasTranslation = (item, currentLanguage) => {
  if (!item || !item.translations || !Array.isArray(item.translations)) {
    return false;
  }
  
  return item.translations.some(t => t.language_code === currentLanguage);
};

/**
 * Get all available languages from translations
 * @param {Object} item - Item with translations
 * @returns {Array<string>} Array of language codes
 */
export const getAvailableLanguages = (item) => {
  if (!item || !item.translations || !Array.isArray(item.translations)) {
    return [];
  }
  
  return item.translations.map(t => t.language_code);
};

