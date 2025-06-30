import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [restaurantRes, productsRes, reviewsRes] = await Promise.all([
        api.get(`/restaurants/${id}/`),
        api.get(`/products/?restaurant_id=${id}`),
        api.get(`/reviews/?restaurant_id=${id}`)
      ]);

      setRestaurant(restaurantRes.data);
      setProducts(productsRes.data.results || productsRes.data);
      setReviews(reviewsRes.data.results || reviewsRes.data);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      setError('ไม่สามารถโหลดข้อมูลร้านอาหารได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text="กำลังโหลดข้อมูลร้านอาหาร..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-secondary-600 mb-4">{error}</p>
          <Link
            to="/restaurants"
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            กลับไปรายการร้านอาหาร
          </Link>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-secondary-400 text-xl mb-4">🏪</div>
          <p className="text-secondary-600 mb-4">ไม่พบร้านอาหารที่คุณต้องการ</p>
          <Link
            to="/restaurants"
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            กลับไปรายการร้านอาหาร
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="text-sm">
            <Link to="/" className="text-primary-600 hover:text-primary-700">หน้าแรก</Link>
            <span className="mx-2 text-secondary-400">&gt;</span>
            <Link to="/restaurants" className="text-primary-600 hover:text-primary-700">ร้านอาหาร</Link>
            <span className="mx-2 text-secondary-400">&gt;</span>
            <span className="text-secondary-600">{restaurant.restaurant_name}</span>
          </nav>
        </div>
      </div>

      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Restaurant Image */}
            <div className="w-full md:w-1/3">
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                {restaurant.image_display_url ? (
                  <img
                    src={restaurant.image_display_url}
                    alt={restaurant.restaurant_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-secondary-200 flex items-center justify-center ${restaurant.image_display_url ? 'hidden' : ''}`}>
                  <div className="text-6xl opacity-30">🏪</div>
                </div>
                {restaurant.is_special && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                      ⭐ ร้านพิเศษ
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    restaurant.status === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.status === 'open' ? '🟢 เปิดร้าน' : '🔴 ปิดร้าน'}
                  </span>
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                {restaurant.restaurant_name}
              </h1>
              <p className="text-secondary-600 text-lg mb-4">
                {restaurant.description}
              </p>

              {/* Rating and Reviews */}
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-6">
                  <span className="text-yellow-400 text-xl mr-1">⭐</span>
                  <span className="text-lg font-semibold text-secondary-800">
                    {Number(restaurant.average_rating || 0).toFixed(1)}
                  </span>
                  <span className="text-secondary-500 ml-1">
                    ({restaurant.total_reviews} รีวิว)
                  </span>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="text-secondary-500 mr-2">📍</span>
                  <span className="text-secondary-700">{restaurant.address}</span>
                </div>
                {restaurant.phone_number && (
                  <div className="flex items-center">
                    <span className="text-secondary-500 mr-2">📞</span>
                    <span className="text-secondary-700">{restaurant.phone_number}</span>
                  </div>
                )}
                {restaurant.opening_hours && (
                  <div className="flex items-center">
                    <span className="text-secondary-500 mr-2">⏰</span>
                    <span className="text-secondary-700">{restaurant.opening_hours}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-secondary-500 mr-2">🚚</span>
                  <span className="text-secondary-700">ค่าส่ง 30-50 บาท</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'menu'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              เมนูอาหาร ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              รีวิว ({reviews.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'menu' && (
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">เมนูอาหาร</h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.product_id} 
                    product={product} 
                    restaurant={restaurant}
                    onAddToCart={addItem}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">🍽️</div>
                <p className="text-secondary-500">ยังไม่มีเมนูอาหาร</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">รีวิวจากลูกค้า</h2>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.review_id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">💬</div>
                <p className="text-secondary-500">ยังไม่มีรีวิว</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, restaurant, onAddToCart, isAuthenticated }) => {
  const handleAddToCart = () => {
    console.log('Product:', product);
    console.log('Restaurant:', restaurant);
    console.log('isAuthenticated:', isAuthenticated);

    // ตรวจสอบสถานะร้าน
    if (restaurant.status !== 'open') {
      alert('ร้านนี้ปิดทำการอยู่ ไม่สามารถสั่งอาหารได้');
      return;
    }

    // ทดสอบ: ปิดการเช็ค login ชั่วคราว  
    if (!isAuthenticated) {
      console.warn('Not authenticated but allowing add to cart for testing');
      // alert('กรุณาเข้าสู่ระบบก่อนสั่งอาหาร');
      // return;
    }

    if (!product.is_available) {
      alert('สินค้านี้หมดแล้ว');
      return;
    }

    try {
      // เพิ่มสินค้าลงตะกร้า - ใช้ field ที่ถูกต้อง
      const result = onAddToCart(product, {
        id: restaurant.restaurant_id || restaurant.id,
        name: restaurant.restaurant_name || restaurant.name
      });

      // ตรวจสอบผลลัพธ์
      if (result && result.success === false) {
        alert(result.error || 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า');
        return;
      }

      // แสดงข้อความยืนยัน
      alert(`เพิ่ม "${product.product_name}" ลงตะกร้าแล้ว!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="relative h-48 bg-secondary-200">
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
        {!product.is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">หมด</span>
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
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-600 font-bold text-lg">
            ฿{Number(product.price).toFixed(2)}
          </span>
          {product.category_name && (
            <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
              {product.category_name}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
            product.is_available && isAuthenticated && restaurant.status === 'open'
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
          }`}
          disabled={!product.is_available || restaurant.status !== 'open'}
        >
          {restaurant.status !== 'open'
            ? 'ร้านปิดทำการ'
            : !product.is_available 
            ? 'หมด' 
            : !isAuthenticated 
            ? 'เข้าสู่ระบบเพื่อสั่งซื้อ' 
            : 'เพิ่มลงตะกร้า'
          }
        </button>
      </div>
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
          {review.user_username ? review.user_username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h4 className="font-semibold text-secondary-800">
            {review.user_username || 'ผู้ใช้'}
          </h4>
          <p className="text-sm text-secondary-500">
            {new Date(review.review_date).toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < review.rating_restaurant ? 'text-yellow-400' : 'text-secondary-300'
            }`}
          >
            ⭐
          </span>
        ))}
      </div>
    </div>
    {review.comment_restaurant && (
      <p className="text-secondary-700">{review.comment_restaurant}</p>
    )}
  </div>
);

export default RestaurantDetail; 