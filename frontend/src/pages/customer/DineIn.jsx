import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDineInCart } from '../../contexts/DineInCartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import { getTranslatedName, getTranslatedDescription } from '../../utils/translationHelpers';
import websocketService from '../../services/websocket';
import { FaShoppingCart, FaSearch, FaPlus, FaStar, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const DineIn = () => {
  const { qrCodeData } = useParams();
  const navigate = useNavigate();
  const { translate, currentLanguage } = useLanguage();
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    restaurantInfo,
    tableInfo,
    initializeDineIn,
    addToCart,
    getTotalItems
  } = useDineInCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const t = (key, fallback, vars = {}) => {
    const value = translate(key, vars);
    return value === key ? fallback : value;
  };

  const formatPrice = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const loadProductsByRestaurant = useCallback(async (restaurantId) => {
    if (!restaurantId) return;

    const productsResponse = await axios.get(`${API_CONFIG.BASE_URL}/dine-in-products/`, {
      params: {
        restaurant: restaurantId,
        lang: currentLanguage
      }
    });

    setProducts(productsResponse.data.results || productsResponse.data);
  }, [currentLanguage]);

  useEffect(() => {
    if (qrCodeData) {
      initializeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeData, currentLanguage, loadProductsByRestaurant]);

  useEffect(() => {
    const restaurantId = restaurantInfo?.restaurant_id;
    if (!restaurantId) return undefined;

    websocketService.setDineInRestaurantId(restaurantId);

    const handleDineInProductChanged = (data) => {
      const payload = data?.payload || data;
      if (Number(payload?.restaurant_id) !== Number(restaurantId)) return;

      const productId = Number(payload?.dine_in_product_id);
      const action = payload?.action;
      const isAvailable = Boolean(payload?.is_available);

      if (!productId) return;

      if (action === 'deleted' || !isAvailable) {
        setProducts((prev) => prev.filter((item) => Number(item.dine_in_product_id) !== productId));
        return;
      }

      if (action === 'updated' && isAvailable) {
        loadProductsByRestaurant(restaurantId);
      }
    };

    websocketService.on('dine_in_product_changed', handleDineInProductChanged);

    return () => {
      websocketService.off('dine_in_product_changed', handleDineInProductChanged);
      websocketService.setDineInRestaurantId(null);
    };
  }, [restaurantInfo?.restaurant_id, currentLanguage, loadProductsByRestaurant]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await initializeDineIn(qrCodeData);

      await loadProductsByRestaurant(data.restaurant.restaurant_id);

      const categoriesResponse = await axios.get(`${API_CONFIG.BASE_URL}/categories/`);
      setCategories(categoriesResponse.data.results || categoriesResponse.data);
    } catch (err) {
      console.error('Error initializing:', err);
      const apiError = err.response?.data?.error;
      setError(apiError || t('dine_in.error_load_invalid_qr', 'Unable to load data. Please check the QR Code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const productName = getTranslatedName(product, currentLanguage, product.product_name);
      await addToCart(product.dine_in_product_id, 1);
      alert(t('dine_in.add_to_cart_success', 'Added {product} to cart!', { product: productName }));
    } catch (err) {
      alert(err.response?.data?.error || t('dine_in.add_to_cart_error', 'Unable to add product to cart'));
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const translatedName = getTranslatedName(product, currentLanguage, product.product_name);
    const matchesSearch = !searchQuery || translatedName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.is_available;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-6xl text-primary-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">{t('dine_in.loading_title', 'Loading data...')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('dine_in.loading_subtitle', 'Please wait a moment')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('dine_in.error_title', 'Error')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-secondary-200 text-secondary-700 px-6 py-3 rounded-xl hover:bg-secondary-300 font-semibold"
            >
              {t('common.try_again', 'Try again')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 font-semibold"
            >
              {t('dine_in.back_home', 'Back to Home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurantInfo || !tableInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('dine_in.no_data_title', 'No Data Found')}</h2>
          <p className="text-gray-600 mb-6">{t('dine_in.no_data_message', 'Please scan the QR Code again')}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            {t('dine_in.back_home', 'Back to Home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-md mb-4">
        {restaurantInfo.image_url && (
          <div className="w-full h-48 md:h-64 overflow-hidden">
            <img src={restaurantInfo.image_url} alt={restaurantInfo.restaurant_name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">{restaurantInfo.restaurant_name}</h1>
            <button
              onClick={() => navigate(`/dine-in/${qrCodeData}/history`)}
              className="ml-4 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm whitespace-nowrap"
              title={t('dine_in.view_history_tooltip', 'View order history')}
            >
              {t('dine_in.history_button', 'History')}
            </button>
          </div>

          {restaurantInfo.description && <p className="text-gray-600 mb-2 leading-relaxed">{restaurantInfo.description}</p>}

          {restaurantInfo.average_rating > 0 && (
            <div className="flex items-center gap-2 text-amber-500 font-semibold">
              <FaStar className="text-lg" />
              <span>{parseFloat(restaurantInfo.average_rating || 0).toFixed(1)}</span>
              <span className="text-gray-600 text-sm font-normal">
                ({restaurantInfo.total_reviews || 0} {t('dine_in.reviews', 'reviews')})
              </span>
            </div>
          )}
        </div>
      </div>

      {getTotalItems() > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex justify-between items-center cursor-pointer shadow-2xl z-50 hover:from-green-600 hover:to-green-700 transition-all"
          onClick={() => navigate(`/dine-in/${qrCodeData}/cart`)}
        >
          <div className="flex items-center gap-3">
            <FaShoppingCart className="text-2xl" />
            <span className="text-lg font-semibold">{t('dine_in.cart_items', '{count} items', { count: getTotalItems() })}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{formatPrice(cart?.total)}</span>
            <span className="text-2xl">&rarr;</span>
          </div>
        </div>
      )}

      <div className="bg-white px-5 py-4 mb-2">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder={t('dine_in.search_placeholder', 'Search menu...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full text-base focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white px-5 py-3 mb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <button
            className={`px-5 py-2 border-2 rounded-full font-semibold transition-all whitespace-nowrap ${
              !selectedCategory
                ? 'bg-gray-200 text-gray-700 border-gray-300'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-700'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            {t('common.all', 'All')}
          </button>
          {categories.map((category) => (
            <button
              key={category.category_id}
              className={`px-5 py-2 border-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === category.category_id
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-700'
              }`}
              onClick={() => setSelectedCategory(category.category_id)}
            >
              {category.category_name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4">
        {filteredProducts.map((product) => (
          <div key={product.dine_in_product_id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
            <div className="flex gap-4 p-3">
              {product.image_display_url && (
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={product.image_display_url} alt={getTranslatedName(product, currentLanguage, product.product_name)} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{getTranslatedName(product, currentLanguage, product.product_name)}</h3>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2 leading-relaxed">
                      {getTranslatedDescription(product, currentLanguage, product.description)}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-500">{formatPrice(product.price)}</span>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAddToCart(product)}
                    disabled={cartLoading}
                  >
                    {cartLoading ? (
                      <FaSpinner className="animate-spin text-xs" />
                    ) : (
                      <>
                        <FaPlus className="text-xs" />
                        <span>{t('dine_in.add', 'Add')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 inline-block">
              <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700">{t('dine_in.no_products_found', 'No matching menu found')}</p>
              <p className="text-gray-500 mt-2">{t('dine_in.no_products_hint', 'Try another keyword or category')}</p>
            </div>
          </div>
        )}
      </div>

      {cartError && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-up">
          {cartError}
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DineIn;
