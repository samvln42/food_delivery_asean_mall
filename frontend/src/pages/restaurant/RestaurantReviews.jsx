import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { reviewService, restaurantService } from '../../services/api';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { FaStar, FaUser, FaCalendarAlt } from 'react-icons/fa';
import Loading from '../../components/common/Loading';

const RestaurantReviews = () => {
  // eslint-disable-next-line no-unused-vars
  const { user, token } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const { translate } = useLanguage();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    if (user?.restaurant_info?.id) {
      fetchRestaurantAndReviews();
    } else {
      setLoading(false);
      setError('ไม่พบข้อมูลร้านอาหาร');
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRestaurantAndReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // ดึงข้อมูลร้านอาหาร
      const restaurantResponse = await restaurantService.getById(user.restaurant_info.id);
      setRestaurant(restaurantResponse.data);

      // ดึงรีวิวทั้งหมดของร้าน
      const reviewsResponse = await reviewService.getByRestaurant(user.restaurant_info.id);
      
      // Handle both array and paginated response
      let reviewsData = [];
      if (Array.isArray(reviewsResponse.data)) {
        reviewsData = reviewsResponse.data;
      } else if (reviewsResponse.data?.results && Array.isArray(reviewsResponse.data.results)) {
        reviewsData = reviewsResponse.data.results;
      } else if (reviewsResponse.data && typeof reviewsResponse.data === 'object') {
        reviewsData = Object.values(reviewsResponse.data).find(Array.isArray) || [];
      }

      setReviews(reviewsData);

      // คำนวณสถิติ
      const total = reviewsData.length;
      const sum = reviewsData.reduce((acc, review) => acc + (review.rating_restaurant || 0), 0);
      const average = total > 0 ? (sum / total).toFixed(1) : 0;

      // นับจำนวนรีวิวแต่ละระดับ
      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewsData.forEach(review => {
        const rating = review.rating_restaurant;
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating]++;
        }
      });

      setStats({
        total,
        average: parseFloat(average),
        ratingCounts
      });

    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.detail || err.message || 'ไม่สามารถโหลดข้อมูลรีวิวได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ? (
              <StarIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarOutlineIcon className="w-5 h-5 text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2 flex items-center gap-2">
          <FaStar className="w-8 h-8 text-primary-600" />
          รีวิวร้านอาหาร
        </h1>
        {restaurant && (
          <p className="text-secondary-600">
            {restaurant.restaurant_name}
          </p>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">คะแนนเฉลี่ย</p>
              <p className="text-3xl font-bold text-secondary-800">{stats.average}</p>
            </div>
            <div className="flex items-center gap-1">
              <FaStar className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">จำนวนรีวิวทั้งหมด</p>
              <p className="text-3xl font-bold text-secondary-800">{stats.total}</p>
            </div>
            <div className="flex items-center gap-1">
              <FaUser className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 mb-1">คะแนนจากลูกค้า</p>
                <p className="text-2xl font-bold text-secondary-800">
                  {restaurant?.average_rating 
                    ? (typeof restaurant.average_rating === 'number' 
                        ? restaurant.average_rating.toFixed(1) 
                        : parseFloat(restaurant.average_rating).toFixed(1))
                    : '0.0'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <FaStar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.total > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">การกระจายคะแนน</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingCounts[rating];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-20">
                    <span className="text-sm font-semibold text-secondary-700">{rating}</span>
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-secondary-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-secondary-700 mb-4">
          รีวิวทั้งหมด ({reviews.length})
        </h2>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <FaStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-secondary-500 text-lg">ยังไม่มีรีวิว</p>
            <p className="text-secondary-400 text-sm mt-2">
              รอให้ลูกค้ามารีวิวร้านอาหารของคุณ
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-secondary-200 pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <FaUser className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-800">
                        {review.user_username || review.user?.username || review.user || 'ผู้ใช้ไม่ระบุชื่อ'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating_restaurant || 0)}
                        <span className="text-sm text-secondary-500">
                          {review.rating_restaurant || 0}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <FaCalendarAlt className="w-4 h-4" />
                    <span>{formatDate(review.review_date || review.created_at)}</span>
                  </div>
                </div>

                {review.comment_restaurant && (
                  <p className="text-secondary-700 mt-3 leading-relaxed">
                    {review.comment_restaurant}
                  </p>
                )}

                {review.order && (
                  <div className="mt-3 text-sm text-secondary-500">
                    รีวิวจากออเดอร์ #{review.order}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantReviews;
