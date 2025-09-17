import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; 
import { useLanguage } from '../../contexts/LanguageContext';

const Categories = () => {
  const { translate } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // โหลดหน้าแรกและเก็บ next URL ไว้สำหรับ Load more
      const response = await api.get('/categories/?page_size=12');
      const data = response.data;
      if (Array.isArray(data)) {
        setCategories(data);
        setNextUrl(null);
      } else {
        setCategories(data.results || []);
        setNextUrl(data.next || null);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Unable to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextUrl) return;
    try {
      setLoadingMore(true);
      const response = await api.get(nextUrl);
      const data = response.data;
      if (Array.isArray(data)) {
        setCategories(prev => [...prev, ...data]);
        setNextUrl(null);
      } else {
        const newItems = data.results || [];
        setCategories(prev => [...prev, ...newItems]);
        setNextUrl(data.next || null);
      }
    } catch (err) {
      console.error('Error loading more categories:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">{translate('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{translate('common.unable_to_load_categories')}</p>
          <button
            onClick={fetchCategories}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            {translate('common.try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <nav className="text-sm mb-6">
        <Link to="/" className="text-primary-500 hover:text-primary-600">{translate('common.home')}</Link>
        <span className="mx-2 text-secondary-400">&gt;</span>
        <span className="text-secondary-600">{translate('common.categories')}</span>
      </nav>

      <div className="text-left sm:text-center mb-4 sm:mb-8">
        <h1 className="hidden sm:block text-xl sm:text-3xl font-bold text-secondary-800 mb-2">{translate('common.categories')}</h1>
        <p className="hidden sm:block text-sm sm:text-base text-secondary-600">{translate('common.choose_your_favorite_categories')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.category_id}
            to={`/categories/${category.category_id}`}
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="relative h-32 sm:h-48 bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-200 overflow-hidden">
              {category.image_display_url ? (
                <img
                  src={category.image_display_url}
                  alt={category.category_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl opacity-30">🍽️</div>
                </div>
              )}
              <div className="absolute top-2 left-2 sm:bottom-auto bg-white backdrop-blur-sm rounded-lg p-1.5">
                <h3 className="text-sm sm:text-xl font-bold text-black">
                  {category.category_name}
                </h3>
              </div>
            </div>
            <div className="p-2 sm:p-4">
              <p className="text-secondary-600 text-xs sm:text-sm hidden sm:block">
                {category.description || translate('common.explore_food_in_this_category')}
              </p>
              <div className="mt-1 sm:mt-2 flex items-center justify-between">
                <span className="text-primary-500 font-semibold group-hover:text-primary-600 text-xs sm:text-sm">
                  <span className="hidden sm:inline">{translate('common.view_menu')} →</span>
                  <span className="sm:hidden">→</span>
                </span>
                <span className="text-xs text-secondary-500 hidden sm:block">
                  {category.products_count || 0} {translate('order.items_count')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">🍽️</div>
          <h3 className="text-xl font-semibold text-secondary-700 mb-2">
            {translate('common.no_categories_found')}
          </h3>
          <p className="text-secondary-500">
            {translate('common.please_try_again_later')}
          </p>
        </div>
      )}

      {/* Load more */}
      {nextUrl && categories.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {loadingMore ? (translate('common.loading') || 'Loading...') : (translate('common.load_more') || 'Load more')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Categories;