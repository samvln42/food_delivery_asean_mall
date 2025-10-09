import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import { getTranslatedName, getTranslatedDescription } from '../../utils/translationHelpers';
import {
  HomeIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

const CategoryDetail = () => {
  const { translate, currentLanguage } = useLanguage();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  
  // เลือก context ตามสถานะการล็อกอิน
  const { addItem: addToCart } = useCart();
  const { addItem: addToGuestCart } = useGuestCart();
  const addItem = isAuthenticated ? addToCart : addToGuestCart;
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (id) {
      setCurrentPage(1);
      fetchCategoryDetail();
      fetchCategoryProducts(1);
    }
  }, [id]);

  useEffect(() => {
    if (id && currentPage > 0) {
      fetchCategoryProducts(currentPage);
    }
  }, [currentPage, id, currentLanguage]);

  const fetchCategoryDetail = async () => {
    try {
      const response = await api.get(`/categories/${id}/`);
      setCategory(response.data);
    } catch (error) {
      console.error('Error fetching category detail:', error);
      setError('Unable to load category data');
    }
  };

  const fetchCategoryProducts = async (page = 1) => {
    try {
      // ใช้ loading เฉพาะเมื่อยังไม่มีข้อมูล หรือเปลี่ยนหน้า/category
      if (products.length === 0 || currentPage !== page) {
        setLoading(true);
      }
      const response = await api.get(`/products/?category_id=${id}&page=${page}&page_size=12`);
      const data = response.data;
      
      if (data.results) {
        // API with pagination support
        setProducts(data.results);
        setTotalProducts(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 12));
      } else {
        // API without pagination - implement client-side pagination
        const allProducts = data || [];
        const startIndex = (page - 1) * 12;
        const endIndex = startIndex + 12;
        const limitedProducts = allProducts.slice(startIndex, endIndex);
        setProducts(limitedProducts);
        setTotalProducts(allProducts.length || 0);
        setTotalPages(Math.ceil((allProducts.length || 0) / 12));
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    
    // ตรวจสอบสถานะร้าน - ใช้ restaurant_status field จาก API
    if (product.restaurant_status && product.restaurant_status !== 'open') {
      alert('This restaurant is closed and cannot order food');
      return;
    }
    
    if (!product.is_available) {
      alert('This product is out of stock');
      return;
    }

    // ตรวจสอบว่ามี restaurant_id หรือไม่
    if (!product.restaurant_id) {
      console.error('Product missing restaurant information:', product);
      alert('Restaurant information is incomplete and cannot be added to the cart');
      return;
    }

    try {
      // สร้าง restaurant object จากข้อมูลสินค้า
      const restaurant = {
        id: product.restaurant_id,
        restaurant_id: product.restaurant_id,
        name: product.restaurant_name,
        restaurant_name: product.restaurant_name,
        status: product.restaurant_status || 'open'
      };

      // เพิ่มสินค้าลงตะกร้า
      const result = addItem(product, restaurant);

      // ตรวจสอบผลลัพธ์
      if (result && result.success === false) {
        // หากต้องการ login ให้ CartContext จัดการ redirect ไปเอง
        if (result.requiresLogin) {
          return; // ไม่แสดง alert เพิ่มเติม
        }
        
        alert(result.error || translate('common.error_adding_to_cart'));
        return;
      }

      // แสดงข้อความยืนยัน
      alert(translate('common.added_to_cart', { product: product.product_name }));
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(translate('common.error_adding_to_cart') + ': ' + error.message);
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
          <p className="text-red-500">{error}</p>
          <Link 
            to="/categories"
            className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            {translate('common.back_to_categories')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <Link to="/" className="text-primary-500 hover:text-primary-600">{translate('common.home')}</Link>
        <span className="mx-2 text-secondary-400">&gt;</span>
        <Link to="/categories" className="text-primary-500 hover:text-primary-600">{translate('nav.categories')}</Link>
        <span className="mx-2 text-secondary-400">&gt;</span>
        <span className="text-secondary-600">{category?.category_name}</span>
      </nav>

      {/* Category Header */}
      {category && (
        <div className="mb-8">
          <div className="relative h-40 sm:h-48 md:h-56 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden mb-4">
            {category.image_display_url ? (
              <img
                src={category.image_display_url}
                alt={category.category_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-8xl opacity-30">🍽️</div>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
                {getTranslatedName(category, currentLanguage, category.category_name)}
              </h1>
              {(category.description || getTranslatedDescription(category, currentLanguage, category.description)) && (
                <p className="text-white text-base sm:text-lg drop-shadow-lg">
                  {getTranslatedDescription(category, currentLanguage, category.description) || category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-800 mb-4">
          {translate('common.menu_in_this_category')} ({totalProducts} {translate('order.items_count')})
        </h2>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex sm:block p-1 sm:p-0"
            >
              <div className="relative h-20 w-20 sm:h-40 sm:w-full md:h-48 bg-gray-200 flex-shrink-0 rounded-lg sm:rounded-none">
                {(product.image_display_url || product.image_url) ? (
                  <img
                    src={product.image_display_url || product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-4xl opacity-30">🍽️</div>
                  </div>
                )}
                {product.is_available === false && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">{translate('common.out_of_stock')}</span>
                  </div>
                )}
                {product.restaurant_status && product.restaurant_status !== 'open' && (
                  <div className="absolute inset-0 bg-red-600 bg-opacity-70 flex items-center justify-center">
                    <span className="text-white font-semibold">{translate('common.closed')}</span>
                  </div>
                )}
              </div>
              <div className="p-2 sm:p-4 flex-1 flex flex-col sm:block">
                <div className="flex justify-between items-center mb-2 sm:mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-800 text-sm sm:text-base leading-tight">
                      {getTranslatedName(product, currentLanguage, product.product_name)}
                    </h3>
                    <span className="text-primary-500 font-bold text-sm sm:text-lg">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 ml-2 sm:hidden">
                    {/* ปุ่มดูร้านนี้ - ไอคอนเฉพาะมือถือ */}
                    <Link
                      to={`/restaurants/${product.restaurant_id || product.restaurant}`}
                      className="py-1 px-6 bg-secondary-100 text-secondary-700 text-center rounded-lg font-medium hover:bg-secondary-200 transition-colors"
                    >
                      <HomeIcon className="w-3 h-3" />
                    </Link>
                    
                    {/* ปุ่มเพิ่มลงตะกร้า - ไอคอนเฉพาะมือถือ */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`py-1 px-6 rounded-lg font-semibold transition-colors ${
                        (product.restaurant_status && product.restaurant_status !== 'open') || product.is_available === false
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                      disabled={(product.restaurant_status && product.restaurant_status !== 'open') || product.is_available === false}
                    >
                      <ShoppingCartIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="hidden sm:block text-secondary-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                  {getTranslatedDescription(product, currentLanguage, product.description) || product.description}
                </p>
                <div className="hidden sm:flex items-center justify-between mb-2 sm:mb-2">
                  <span className="text-xs text-secondary-500">
                    {product.restaurant_name}
                  </span>
                </div>
                
                {/* ปุ่มดูร้านนี้ - ข้อความเต็มสำหรับหน้าจอใหญ่ */}
                <div className="hidden sm:flex flex-row gap-2 justify-center">
                  {/* ปุ่มดูร้านนี้ - ข้อความเต็มสำหรับหน้าจอใหญ่ */}
                  <Link
                    to={`/restaurants/${product.restaurant_id || product.restaurant}`}
                    className="py-2 px-6 bg-secondary-100 text-secondary-700 text-center rounded-lg font-medium hover:bg-secondary-200 transition-colors text-sm"
                  >
                    {translate('common.view_this_restaurant')}
                  </Link>
                  
                  {/* ปุ่มเพิ่มลงตะกร้า - ข้อความเต็มสำหรับหน้าจอใหญ่ */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`py-2 px-8 rounded-lg font-semibold transition-colors ${
                      (product.restaurant_status && product.restaurant_status !== 'open') || product.is_available === false
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                    disabled={(product.restaurant_status && product.restaurant_status !== 'open') || product.is_available === false}
                  >
                    {(product.restaurant_status && product.restaurant_status !== 'open')
                      ? translate('common.closed')
                      : product.is_available === false 
                      ? translate('common.out_of_stock') 
                      : translate('cart.add')
                    }
                  </button>
                </div>
              </div>
            </div>
          )          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">🍽️</div>
          <h3 className="text-xl font-semibold text-secondary-700 mb-2">
            {translate('common.no_menu_in_this_category')}
          </h3>
          <p className="text-secondary-500 mb-6">
            {translate('common.try_choosing_another_category')}
          </p>
          <Link
            to="/categories"
            className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {translate('common.view_other_categories')}
          </Link>
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

export default CategoryDetail; 