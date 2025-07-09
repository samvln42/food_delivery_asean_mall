import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; 
import { useLanguage } from '../../contexts/LanguageContext';

const Categories = () => {
  const { translate } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Unable to load categories');
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">{translate('common.categories')}</h1>
        <p className="text-secondary-600">{translate('common.choose_your_favorite_categories')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.category_id}
            to={`/categories/${category.category_id}`}
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
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
              <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white drop-shadow-lg">
                  {category.category_name}
                </h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-secondary-600 text-sm">
                {category.description || translate('common.explore_food_in_this_category')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-primary-500 font-semibold group-hover:text-primary-600">
                  {translate('common.view_menu')} →
                </span>
                <span className="text-xs text-secondary-500">
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
    </div>
  );
};

export default Categories;