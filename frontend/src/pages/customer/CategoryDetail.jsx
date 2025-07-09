import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const CategoryDetail = () => {
  const { translate } = useLanguage();
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCategoryDetail();
      fetchCategoryProducts();
    }
  }, [id]);

  const fetchCategoryDetail = async () => {
    try {
      const response = await api.get(`/categories/${id}/`);
      setCategory(response.data);
    } catch (error) {
      console.error('Error fetching category detail:', error);
      setError('Unable to load category data');
    }
  };

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/?category_id=${id}`);
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    console.log('Adding product to cart from category:', product);
    
    // ตรวจสอบสถานะร้าน
    if (product.restaurant_status !== 'open') {
      alert('This restaurant is closed and cannot order food');
      return;
    }
    
    // การตรวจสอบ login จะทำใน CartContext แล้ว
    // ไม่ต้องตรวจสอบที่นี่อีก

    if (!product.is_available) {
      alert('This product is out of stock');
      return;
    }

    // ตรวจสอบว่ามี restaurant_id หรือไม่
    if (!product.restaurant_id && !product.restaurant) {
      console.error('Product missing restaurant information:', product);
      alert('Restaurant information is incomplete and cannot be added to the cart');
      return;
    }

    try {
      // สร้าง restaurant object จากข้อมูลสินค้า - รองรับหลายรูปแบบ
      const restaurant = {
        id: product.restaurant_id || product.restaurant?.id || product.restaurant,
        restaurant_id: product.restaurant_id || product.restaurant?.id || product.restaurant,
        name: product.restaurant_name || product.restaurant?.name || product.restaurant_name,
        restaurant_name: product.restaurant_name || product.restaurant?.name || product.restaurant_name
      };

      console.log('Restaurant object created:', restaurant);

      // ตรวจสอบว่า restaurant_id มีค่าหรือไม่
      if (!restaurant.id && !restaurant.restaurant_id) {
        throw new Error('No restaurant_id found');
      }

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
    <div className="container mx-auto px-4 py-8">
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
          <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden mb-4">
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
              <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                {category.category_name}
              </h1>
              {category.description && (
                <p className="text-white text-lg drop-shadow-lg">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-800 mb-4">
          {translate('common.menu_in_this_category')} ({products.length} {translate('order.items_count')})
        </h2>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-48 bg-gray-200">
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
                {product.restaurant_status !== 'open' && (
                  <div className="absolute inset-0 bg-red-600 bg-opacity-70 flex items-center justify-center">
                    <span className="text-white font-semibold">{translate('common.closed')}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-secondary-800 mb-2">
                  {product.product_name}
                </h3>
                <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary-500 font-bold text-lg">
                    {Number(product.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-secondary-500">
                    {product.restaurant_name}
                  </span>
                </div>
                
                {/* ปุ่มดูร้านนี้ */}
                <Link
                  to={`/restaurants/${product.restaurant_id || product.restaurant}`}
                  className="block w-full mb-2 py-2 px-4 bg-secondary-100 text-secondary-700 text-center rounded-lg font-medium hover:bg-secondary-200 transition-colors text-sm"
                >
                  🏪 {translate('common.view_this_restaurant')}
                </Link>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    product.restaurant_status !== 'open' || product.is_available === false
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isAuthenticated
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-secondary-300 text-secondary-500'
                  }`}
                  disabled={product.restaurant_status !== 'open' || product.is_available === false}
                >
                  {product.restaurant_status !== 'open'
                    ? translate('common.closed')
                    : product.is_available === false 
                    ? translate('common.out_of_stock') 
                    : !isAuthenticated 
                    ? translate('common.login_to_order') 
                    : translate('cart.add')
                  }
                </button>
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default CategoryDetail; 