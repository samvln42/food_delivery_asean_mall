import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import { formatPrice } from '../../utils/formatPrice';
import { getTranslatedName, getTranslatedDescription } from '../../utils/translationHelpers';
import { FaUtensils, FaCheckCircle, FaTimesCircle, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

const RestaurantDineInProducts = () => {
  const { user, token } = useAuth();
  const { translate, currentLanguage, availableLanguages } = useLanguage();

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    category: '',
    price: '',
    is_available: true,
    is_recommended: false,
    sort_order: 0,
    translations: {}
  });
  const [imageFile, setImageFile] = useState(null);

  // ใช้ร้านของผู้ใช้ที่ล็อกอิน — ห้ามใช้รายการแรกจาก GET /restaurants/ (จะเป็นคนละร้านกับบัญชี)
  useEffect(() => {
    if (!user) {
      setRestaurant(null);
      return;
    }
    const info = user.restaurant_info;
    if (info && info.id != null && info.status !== 'no_restaurant') {
      setRestaurant({
        restaurant_id: info.id,
        restaurant_name: info.name,
        is_special: info.is_special,
        status: info.status,
      });
      return;
    }
    if (user.restaurant?.restaurant_id != null) {
      setRestaurant(user.restaurant);
      return;
    }
    setRestaurant(null);
  }, [user]);

  useEffect(() => {
    if (restaurant) {
      fetchProducts();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, searchTerm, categoryFilter, availabilityFilter, currentLanguage]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/categories/`, {
        params: { page_size: 100, lang: currentLanguage }
      });
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      if (!restaurant) return;

      setLoading(true);
      const params = {
        restaurant: restaurant.restaurant_id,
        ordering: 'sort_order,product_name'
      };

      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (availabilityFilter) params.is_available = availabilityFilter === 'available';

      const response = await axios.get(`${API_CONFIG.BASE_URL}/dine-in-products/`, {
        params,
        headers: { Authorization: `Token ${token}` }
      });

      setProducts(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(translate('restaurant.dine_in_products.error_load') || 'Unable to load dine-in products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('is_available', formData.is_available);
      formDataToSend.append('is_recommended', formData.is_recommended);
      formDataToSend.append('sort_order', formData.sort_order);
      if (formData.translations && Object.keys(formData.translations).length > 0) {
        const validTranslations = {};
        Object.keys(formData.translations).forEach((langCode) => {
          const trans = formData.translations[langCode];
          if (trans?.name && trans.name.trim()) {
            validTranslations[langCode] = {
              name: trans.name.trim(),
              description: trans.description || ''
            };
          }
        });
        formDataToSend.append('translations', JSON.stringify(validTranslations));
      }

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingProduct) {
        await axios.put(`${API_CONFIG.BASE_URL}/dine-in-products/${editingProduct.dine_in_product_id}/`, formDataToSend, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert(translate('restaurant.dine_in_products.update_success') || 'Product updated successfully');
      } else {
        await axios.post(`${API_CONFIG.BASE_URL}/dine-in-products/`, formDataToSend, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert(translate('restaurant.dine_in_products.create_success') || 'Product added successfully');
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      console.error('Error response:', err.response?.data);

      const errorMessage =
        err.response?.data?.error ||
        JSON.stringify(err.response?.data) ||
        (translate('restaurant.dine_in_products.error_save') || 'Unable to save product');

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(translate('restaurant.dine_in_products.delete_confirm') || 'Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await axios.delete(`${API_CONFIG.BASE_URL}/dine-in-products/${productId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      alert(translate('restaurant.dine_in_products.delete_success') || 'Product deleted successfully');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(translate('restaurant.dine_in_products.delete_error') || 'Unable to delete product');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await axios.patch(
        `${API_CONFIG.BASE_URL}/dine-in-products/${product.dine_in_product_id}/`,
        { is_available: !product.is_available },
        { headers: { Authorization: `Token ${token}` } }
      );
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      alert(translate('restaurant.dine_in_products.error_update_status') || 'Unable to update product status');
    }
  };

  const openEditModal = (product) => {
    const parsedTranslations = {};
    if (product?.translations && Array.isArray(product.translations)) {
      product.translations.forEach((trans) => {
        parsedTranslations[trans.language_code] = {
          name: trans.translated_name || '',
          description: trans.translated_description || ''
        };
      });
    }

    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      is_available: product.is_available,
      is_recommended: product.is_recommended,
      sort_order: product.sort_order,
      translations: parsedTranslations
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      description: '',
      category: '',
      price: '',
      is_available: true,
      is_recommended: false,
      sort_order: 0,
      translations: {}
    });
    setImageFile(null);
    setEditingProduct(null);
  };

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            {translate('restaurant.dine_in_products.no_restaurant') || 'Restaurant information not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">
          <FaUtensils className="inline-block h-7 w-7 mr-2 text-primary-600" />
          {translate('restaurant.dine_in_products.title') || 'Manage Dine-in Products'}
        </h1>
        <p className="text-secondary-600">
          {restaurant.restaurant_name} - {translate('restaurant.dine_in_products.subtitle') || 'Products for dine-in service'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              placeholder={translate('restaurant.dine_in_products.search_placeholder') || 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{translate('restaurant.dine_in_products.filter_all_categories') || 'All categories'}</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {getTranslatedName(category, currentLanguage, category.category_name)}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{translate('restaurant.dine_in_products.filter_all_status') || 'All status'}</option>
            <option value="available">{translate('restaurant.dine_in_products.available') || 'Available'}</option>
            <option value="unavailable">{translate('restaurant.dine_in_products.unavailable') || 'Unavailable'}</option>
          </select>
        </div>

        <div className="mt-4">
          <button
            onClick={openAddModal}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaPlus className="inline-block w-5 h-5 mr-2" /> {translate('restaurant.dine_in_products.add_new') || 'Add New Product'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">{translate('common.loading') || 'Loading...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.dine_in_product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {product.image_display_url ? (
                <img src={product.image_display_url} alt={getTranslatedName(product, currentLanguage, product.product_name)} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-secondary-200 flex items-center justify-center">
                  <span className="text-secondary-400">{translate('restaurant.dine_in_products.no_image') || 'No image'}</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{getTranslatedName(product, currentLanguage, product.product_name)}</h3>
                  {product.is_recommended && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      {translate('restaurant.dine_in_products.recommended_badge') || 'Recommended'}
                    </span>
                  )}
                </div>

                <p className="text-secondary-600 text-sm mb-2 line-clamp-2">{getTranslatedDescription(product, currentLanguage, product.description)}</p>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-primary-600 font-bold text-lg">{formatPrice(product.price)}</span>
                  <span className="text-sm text-secondary-500">{product.category_name}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAvailability(product)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                      product.is_available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                    } transition-colors`}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {product.is_available ? (
                        <>
                          <FaCheckCircle className="w-4 h-4" />
                          <span>{translate('restaurant.dine_in_products.available') || 'Available'}</span>
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="w-4 h-4" />
                          <span>{translate('restaurant.dine_in_products.unavailable') || 'Unavailable'}</span>
                        </>
                      )}
                    </span>
                  </button>

                  <button
                    onClick={() => openEditModal(product)}
                    className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                    aria-label={translate('restaurant.dine_in_products.edit_title') || 'Edit Product'}
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(product.dine_in_product_id)}
                    className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                    aria-label={translate('restaurant.dine_in_products.delete') || 'Delete Product'}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-secondary-500 text-lg">{translate('restaurant.dine_in_products.empty') || 'No dine-in products yet'}</p>
          <button onClick={openAddModal} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            {translate('restaurant.dine_in_products.add_first') || 'Add First Product'}
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                <span className="flex items-center gap-2">
                  {editingProduct ? (
                    <>
                      <FaEdit className="w-4 h-4" />
                      <span>{translate('restaurant.dine_in_products.edit_title') || 'Edit Product'}</span>
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-4 h-4" />
                      <span>{translate('restaurant.dine_in_products.add_title') || 'Add New Product'}</span>
                    </>
                  )}
                </span>
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      {translate('restaurant.dine_in_products.form.product_name') || 'Product name'} *
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      {translate('restaurant.dine_in_products.form.description') || 'Description'}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2 border border-secondary-200 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3">
                      {translate('restaurant.dine_in_products.form.translations') || 'Translations'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableLanguages
                        .filter((lang) => lang.code !== 'en')
                        .map((lang) => (
                          <div key={lang.code} className="border border-secondary-200 rounded-lg p-3">
                            <p className="text-xs font-semibold mb-2">{lang.name}</p>
                            <input
                              type="text"
                              value={formData.translations?.[lang.code]?.name || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  translations: {
                                    ...prev.translations,
                                    [lang.code]: {
                                      ...(prev.translations?.[lang.code] || {}),
                                      name: e.target.value
                                    }
                                  }
                                }))
                              }
                              placeholder={translate('restaurant.dine_in_products.form.translated_name') || 'Translated name'}
                              className="w-full mb-2 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <textarea
                              value={formData.translations?.[lang.code]?.description || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  translations: {
                                    ...prev.translations,
                                    [lang.code]: {
                                      ...(prev.translations?.[lang.code] || {}),
                                      description: e.target.value
                                    }
                                  }
                                }))
                              }
                              rows="2"
                              placeholder={translate('restaurant.dine_in_products.form.translated_description') || 'Translated description'}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {translate('restaurant.dine_in_products.form.category') || 'Category'} *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{translate('restaurant.dine_in_products.form.select_category') || 'Select category'}</option>
                      {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {getTranslatedName(category, currentLanguage, category.category_name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {translate('restaurant.dine_in_products.form.price') || 'Price'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {translate('restaurant.dine_in_products.form.sort_order') || 'Sort order'}
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        setFormData({ ...formData, sort_order: Number.isNaN(parsed) ? 0 : parsed });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      {translate('restaurant.dine_in_products.form.image') || 'Image'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-4 md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>{translate('restaurant.dine_in_products.form.available') || 'Available'}</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_recommended}
                        onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>{translate('restaurant.dine_in_products.form.recommended') || 'Recommended'}</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50"
                  >
                    {translate('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? translate('restaurant.dine_in_products.saving') || 'Saving...' : translate('common.save') || 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDineInProducts;
