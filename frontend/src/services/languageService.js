import api from './api';

export const languageService = {
  getTranslations: async (langCode, options = {}) => {
    let url = `/translations/by_language/?lang=${langCode}`;
    
    // เพิ่ม option สำหรับเช็ค version เท่านั้น (ไม่ดึงข้อมูลทั้งหมด)
    if (options.only_check_version) {
      url += '&only_check_version=true';
    }
    
    return await api.get(url);
  },
  
  getAvailableLanguages: async () => {
    return await api.get('/languages/');
  },
  
  updateUserLanguage: async (langCode) => {
    return await api.patch('/users/me/', { preferred_language: langCode });
  }
}; 