import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api, { appSettingsService } from "../../services/api";
import Loading from "../../components/common/Loading";
import { useCart } from "../../contexts/CartContext";
import { useGuestCart } from "../../contexts/GuestCartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";
import { formatPrice } from "../../utils/formatPrice";

const RestaurantDetail = () => {

  const { id } = useParams();
  const { addItem: addToCart } = useCart();
  const { addItem: addToGuestCart } = useGuestCart();
  const { user, isAuthenticated } = useAuth();
  
  // เลือกฟังก์ชัน addItem ตามสถานะการล็อกอิน
  const addItem = isAuthenticated ? addToCart : addToGuestCart;
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [appSettings, setAppSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const { translate, currentLanguage } = useLanguage();

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
      setCurrentPage(1);
    }
  }, [id]);

  useEffect(() => {
    if (id && currentPage) {
      fetchRestaurantProducts(currentPage);
    }
  }, [id, currentPage, currentLanguage]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [restaurantRes, reviewsRes, settingsRes] = await Promise.all([
        api.get(`/restaurants/${id}/`),
        api.get(`/restaurants/${id}/reviews/`),
        appSettingsService.getPublic(),
      ]);
      setRestaurant(restaurantRes.data);
      setReviews(reviewsRes.data.results || reviewsRes.data);
      setAppSettings(settingsRes.data);
    } catch (error) {
      setError("Unable to load restaurant data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantProducts = async (page = 1) => {
    try {
      // ใช้ loading เฉพาะเมื่อยังไม่มีข้อมูล หรือเปลี่ยนหน้า/restaurant
      if (products.length === 0 || currentPage !== page) {
        setLoading(true);
      }
      const response = await api.get(`/products/?restaurant_id=${id}&page=${page}&page_size=12`);
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
      console.error('Error fetching restaurant products:', error);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text={translate('common.loading_restaurant_data')} />
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
            {translate('common.back_to_restaurant_list')}
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
          <p className="text-secondary-600 mb-4">{translate('common.no_restaurant_found')}</p>
          <Link
            to="/restaurants"
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors inline-block"
          >
            {translate('common.back_to_restaurant_list')}
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
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              {translate('common.home')}
            </Link>
            <span className="mx-2 text-secondary-400">&gt;</span>
            <Link
              to="/restaurants"
              className="text-primary-600 hover:text-primary-700"
            >
              {translate('common.restaurants')}
            </Link>
            <span className="mx-2 text-secondary-400">&gt;</span>
            <span className="text-secondary-600">
              {restaurant.restaurant_name}
            </span>
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
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-secondary-200 flex items-center justify-center ${
                    restaurant.image_display_url ? "hidden" : ""
                  }`}
                >
                  <div className="text-6xl opacity-30">🏪</div>
                </div>
                {restaurant.is_special && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                      ⭐ {translate('common.special_restaurant')}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      restaurant.status === "open"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {restaurant.status === "open" ? "🟢 " + translate('common.open') : "🔴 " + translate('common.closed')}
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
                    ({restaurant.total_reviews} {translate('restaurant.reviews')})
                  </span>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="text-secondary-500 mr-2">📍</span>
                  <span className="text-secondary-700">
                    {restaurant.address}
                  </span>
                </div>
                {restaurant.phone_number && (
                  <div className="flex items-center">
                    <span className="text-secondary-500 mr-2">📞</span>
                    <span className="text-secondary-700">
                      {restaurant.phone_number}
                    </span>
                  </div>
                )}
                {restaurant.opening_hours && (
                  <div className="flex items-center">
                    <span className="text-secondary-500 mr-2">⏰</span>
                    <span className="text-secondary-700">
                      {restaurant.opening_hours}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-secondary-500 mr-2">🚚</span>
                  <span className="text-secondary-700">
                    {translate('cart.delivery_fee')} {appSettings ? formatPrice(appSettings.multi_restaurant_base_fee || 0) : '...'}
                  </span>
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
              onClick={() => setActiveTab("menu")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "menu"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-secondary-500 hover:text-secondary-700"
              }`}
            >
              {translate('restaurant.menu')} ({totalProducts})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-secondary-500 hover:text-secondary-700"
              }`}
            >
              {translate('restaurant.reviews')} ({reviews.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "menu" && (
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">{translate('restaurant.menu')}</h2>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      restaurant={restaurant}
                      onAddToCart={addItem}
                      translate={translate}
                      currentLanguage={currentLanguage}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-300'
                        }`}
                      >
                        {translate('common.previous') || 'Previous'}
                      </button>

                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-primary-500 text-white'
                              : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-300'
                        }`}
                      >
                        {translate('common.next') || 'Next'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">🍽️</div>
                <p className="text-secondary-500">{translate('common.no_menu')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">
              {translate('common.reviews')}
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.review_id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">💬</div>
                <p className="text-secondary-500">{translate('common.no_reviews')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, restaurant, onAddToCart, translate, currentLanguage }) => {
  const handleAddToCart = () => {
    // ตรวจสอบสถานะร้าน
    if (restaurant.status !== "open") {
      alert("This restaurant is closed and cannot order food");
      return;
    }

    if (!product.is_available) {
      alert("This product is out of stock");
      return;
    }

    try {
      // เพิ่มสินค้าลงตะกร้า
      const result = onAddToCart(product, {
        id: restaurant.restaurant_id || restaurant.id,
        name: restaurant.restaurant_name || restaurant.name,
        status: restaurant.status
      });

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
      alert(translate('common.added_to_cart', { product: getTranslatedName(product, currentLanguage, product.product_name) }));
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(translate('common.error_adding_to_cart'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="relative h-48 bg-secondary-200">
        {product.image_display_url || product.image_url ? (
          <img
            src={product.image_display_url || product.image_url}
            alt={getTranslatedName(product, currentLanguage, product.product_name)}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl opacity-30">🍽️</div>
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">{translate('common.out_of_stock')}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-secondary-800 mb-2">
          {getTranslatedName(product, currentLanguage, product.product_name)}
        </h3>
        <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-600 font-bold text-lg">
            {formatPrice(product.price)}
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
            product.is_available && restaurant.status === "open"
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-secondary-300 text-secondary-500 cursor-not-allowed"
          }`}
          disabled={!product.is_available || restaurant.status !== "open"}
        >
          {restaurant.status !== "open"
            ? translate('common.restaurant_is_closed')
            : !product.is_available
            ? translate('common.out_of_stock')
                                : translate('cart.add')}
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
          {review.user_username
            ? review.user_username.charAt(0).toUpperCase()
            : "U"}
        </div>
        <div>
          <h4 className="font-semibold text-secondary-800">
            {review.user_username || "User"}
          </h4>
          <p className="text-sm text-secondary-500">
            {new Date(review.review_date).toLocaleDateString("en-US")}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < review.rating_restaurant
                ? "text-yellow-400"
                : "text-secondary-300"
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
