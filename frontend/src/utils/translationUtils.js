// Helper functions สำหรับการแปลชื่อสินค้าและหมวดหมู่
export const getTranslatedName = (item, currentLanguage, fallbackName) => {
  console.log('🔧 getTranslatedName called with:', {
    item: item,
    currentLanguage: currentLanguage,
    fallbackName: fallbackName,
    translations: item?.translations
  });
  
  if (!item?.translations || !currentLanguage || currentLanguage === 'en') {
    console.log('🔧 Returning fallback name:', fallbackName);
    return fallbackName || '';
  }
  
  const translation = item.translations.find(t => t.language_code === currentLanguage);
  console.log('🔧 Found translation:', translation);
  const result = translation?.translated_name || fallbackName || '';
  console.log('🔧 Returning result:', result);
  return result;
};

export const getTranslatedDescription = (item, currentLanguage, fallbackDescription) => {
  if (!item?.translations || !currentLanguage || currentLanguage === 'en') {
    return fallbackDescription || '';
  }
  
  const translation = item.translations.find(t => t.language_code === currentLanguage);
  return translation?.translated_description || fallbackDescription || '';
};
