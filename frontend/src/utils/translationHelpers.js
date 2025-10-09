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
  // ถ้าไม่มี item ให้ return default
  if (!item) {
    return defaultName || '';
  }
  
  // ถ้าไม่มี translations หรือเป็น array ว่าง ให้ return default
  if (!item.translations || !Array.isArray(item.translations) || item.translations.length === 0) {
    return defaultName || '';
  }
  
  // กรณีใหม่: API ส่ง filtered แค่ภาษาเดียว (optimized - มี lang parameter)
  // translations: [{ language_code: "th", translated_name: "ผัดไทย" }]
  if (item.translations.length === 1) {
    const trans = item.translations[0];
    // ถ้า translation มีข้อมูลและตรงกับภาษาที่ต้องการ หรือมีแค่ภาษาเดียว
    if (trans && trans.translated_name) {
      return trans.translated_name;
    }
  }
  
  // กรณีเก่า: API ส่งทุก translation (backward compatible - ไม่มี lang parameter)
  // translations: [{ language_code: "th", ... }, { language_code: "en", ... }]
  const translation = item.translations.find(t => t.language_code === currentLanguage);
  if (translation && translation.translated_name) {
    return translation.translated_name;
  }
  
  // ถ้าไม่เจอเลย ให้ return default
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
  // ถ้าไม่มี item ให้ return default
  if (!item) {
    return defaultDescription || '';
  }
  
  // ถ้าไม่มี translations หรือเป็น array ว่าง ให้ return default
  if (!item.translations || !Array.isArray(item.translations) || item.translations.length === 0) {
    return defaultDescription || '';
  }
  
  // กรณีใหม่: API ส่ง filtered แค่ภาษาเดียว (optimized - มี lang parameter)
  if (item.translations.length === 1) {
    const trans = item.translations[0];
    if (trans && trans.translated_description) {
      return trans.translated_description;
    }
  }
  
  // กรณีเก่า: API ส่งทุก translation (backward compatible - ไม่มี lang parameter)
  const translation = item.translations.find(t => t.language_code === currentLanguage);
  if (translation && translation.translated_description) {
    return translation.translated_description;
  }
  
  // ถ้าไม่เจอเลย ให้ return default
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

