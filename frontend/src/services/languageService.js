import api from './api';

export const languageService = {
  getTranslations: async (langCode) => {
    return await api.get(`/translations/by_language/?lang=${langCode}`);
  },
  
  getAvailableLanguages: async () => {
    return await api.get('/languages/');
  },
  
  updateUserLanguage: async (langCode) => {
    return await api.patch('/users/me/', { preferred_language: langCode });
  }
}; 