import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; 
import { useLanguage } from '../../contexts/LanguageContext';

const Categories = () => {
  const { translate } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage]);

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);
      // โหลดหมวดหมู่แบบ pagination
      const response = await api.get(`/categories/?page=${page}&page_size=20&ordering=sort_order,category_name`);
      const data = response.data;
      if (Array.isArray(data)) {
        setCategories(data);
        setTotalPages(1);
        setTotalCategories(data.length);
      } else {
        setCategories(data.results || []);
        setTotalPages(Math.ceil((data.count || 0) / 20));
        setTotalCategories(data.count || 0);
      }
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
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <nav className="text-sm mb-6">
        <Link to="/" className="text-primary-500 hover:text-primary-600">{translate('common.home')}</Link>
        <span className="mx-2 text-secondary-400">&gt;</span>
        <span className="text-secondary-600">{translate('common.categories')}</span>
      </nav>

      <div className="text-left sm:text-center mb-4 sm:mb-8">
        <h1 className="hidden sm:block text-xl sm:text-3xl font-bold text-secondary-800 mb-2">{translate('common.categories')}</h1>
        <p className="hidden sm:block text-sm sm:text-base text-secondary-600">
          {translate('common.choose_your_favorite_categories')} ({totalCategories} {translate('order.items_count')})
        </p>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg ${
                currentPage === 1
                  ? "bg-secondary-200 text-secondary-400 cursor-not-allowed"
                  : "bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
              }`}
            >
              {translate("common.previous")}
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === pageNumber
                      ? "bg-primary-500 text-white"
                      : "bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg ${
                currentPage === totalPages
                  ? "bg-secondary-200 text-secondary-400 cursor-not-allowed"
                  : "bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
              }`}
            >
              {translate("common.next")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Categories;