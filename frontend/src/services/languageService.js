import api from './api';
import { API_ENDPOINTS } from '../config/api';

// Create a public API instance without auth interceptor
const publicApi = api.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: API_ENDPOINTS.TIMEOUT,
  headers: API_ENDPOINTS.HEADERS,
});

export const languageService = {
  // Get all available languages (public endpoint)
  getLanguages: async () => {
    const response = await publicApi.get('/public/languages/');
    return response.data;
  },

  // Get default language (public endpoint)
  getDefaultLanguage: async () => {
    const response = await publicApi.get('/public/languages/default/');
    return response.data;
  },

  // Get translations for specific language (public endpoint)
  getTranslations: async (langCode, groupBy = 'group') => {
    const response = await publicApi.get(`/public/translations/by_language/`, {
      params: { lang: langCode, group_by: groupBy }
    });
    return response.data;
  }
};

export default languageService; 