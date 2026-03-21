import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { productService, categoryService } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslatedName, getTranslatedDescription } from '../../utils/translationHelpers';

const RestaurantProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const { translate, currentLanguage } = useLanguage();

  // ดึง restaurant จาก user
  useEffect(() => {
    if (user && user.restaurant) {
      setRestaurant(user.restaurant);
    }
  }, [user]);

  // ดึงข้อมูลสินค้า
  useEffect(() => {
    if (restaurant) {
      fetchProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, currentPage, searchTerm, categoryFilter, availabilityFilter, currentLanguage]);

  // ดึงหมวดหมู่
  useEffect(() => {
    if (restaurant) {
      fetchCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, currentLanguage]);

  const fetchCategories = async () => {
    try {
      const params = { 
        page_size: 100, 
        ordering: 'sort_order,category_name',
        lang: currentLanguage
      };
      
      if (restaurant) {
        params.restaurant_type = restaurant.is_special ? 'special' : 'general';
      }
      
      const response = await categoryService.getAll(params);
      const allCategories = response.data.results || response.data;
      setCategories(allCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      if (products.length === 0) {
        setLoading(true);
      }
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        search: searchTerm,
        restaurant: restaurant.restaurant_id,
        ordering: '-created_at',
        lang: currentLanguage
      };

      if (categoryFilter) {
        params.category = categoryFilter;
      }

      if (availabilityFilter) {
        params.is_available = availabilityFilter === 'available';
      }

      const response = await productService.getAll(params);
      
      if (response.data.results) {
        setProducts(response.data.results);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      } else {
        setProducts(response.data);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(translate('common.failed_to_load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (productId, currentStatus) => {
    try {
      await productService.update(productId, {
        is_available: !currentStatus
      });
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      alert(translate('common.update_failed'));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(translate('common.confirm_delete'))) return;
    
    try {
      await productService.delete(productId);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(translate('common.delete_failed'));
    }
  };

  const filteredProducts = products;

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">{translate('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {translate('restaurant.no_restaurant_found')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">
          {translate('restaurant.manage_products')}
        </h1>
        <p className="text-secondary-600">
          {restaurant.restaurant_name}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder={translate('common.search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{translate('common.all_categories')}</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {getTranslatedName(category, currentLanguage)}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{translate('common.all')}</option>
              <option value="available">{translate('common.available')}</option>
              <option value="unavailable">{translate('common.unavailable')}</option>
            </select>
          </div>
        </div>

        {/* Add Product Button */}
        <div className="mt-4">
          <button
            onClick={() => navigate(`/admin/restaurants/${restaurant.restaurant_id}/products/create`)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            ➕ {translate('restaurant.add_product')}
          </button>
        </div>
      </div>

      {/* Products Table */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('common.image')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('common.product_name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('common.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('common.price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('common.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredProducts.map((product) => (
                <tr key={product.product_id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={getTranslatedName(product, currentLanguage)}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-secondary-200 rounded-lg flex items-center justify-center">
                        <span className="text-secondary-400 text-xs">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-secondary-900">
                      {getTranslatedName(product, currentLanguage)}
                    </div>
                    <div className="text-sm text-secondary-500 truncate max-w-xs">
                      {getTranslatedDescription(product, currentLanguage)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category_name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleAvailability(product.product_id, product.is_available)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors cursor-pointer`}
                    >
                      {product.is_available ? translate('common.available') : translate('common.unavailable')}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/admin/restaurants/${restaurant.restaurant_id}/products/${product.product_id}/edit`)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      {translate('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.product_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {translate('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-secondary-500">{translate('common.no_products_found')}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-secondary-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translate('common.previous')}
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translate('common.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-secondary-700">
                  {translate('common.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {translate('common.to')}{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, products.length)}
                  </span>{' '}
                  {translate('common.of')} <span className="font-medium">{products.length}</span> {translate('common.results')}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">{translate('common.previous')}</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">{translate('common.next')}</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantProducts;
