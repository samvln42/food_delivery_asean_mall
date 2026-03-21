import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { reviewService } from '../../services/api';

const RestaurantReviews = ({ restaurantId }) => {
  const { user } = useAuth();
  const { translate } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getByRestaurant(restaurantId);
      
      // Handle both array and paginated response
      let reviewsData = [];
      if (Array.isArray(response.data)) {
        reviewsData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        reviewsData = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object but not paginated, try to extract array
        reviewsData = Object.values(response.data).find(Array.isArray) || [];
      }
      
      setReviews(reviewsData);
      
      // Find user's review if exists (only reviews without order) - only if user is logged in
      if (user && Array.isArray(reviewsData)) {
        const review = reviewsData.find(r => r.user === user.id && !r.order);
        setUserReview(review || null);
        if (review) {
          setRating(review.rating_restaurant);
          setComment(review.comment_restaurant || '');
        }
      } else {
        // Reset user review if user is not logged in
        setUserReview(null);
        setRating(0);
        setComment('');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.detail || err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(translate('restaurant.login_to_review') || 'กรุณาเข้าสู่ระบบเพื่อรีวิว');
      return;
    }
    if (!rating || rating === 0) {
      alert(translate('restaurant.select_rating') || 'กรุณาเลือกคะแนน');
      return;
    }
    if (!restaurantId) {
      alert('Restaurant ID is missing');
      return;
    }

    try {
      setSubmitting(true);
      const restaurantIdInt = parseInt(restaurantId, 10);
      const ratingInt = parseInt(rating, 10);
      
      if (isNaN(restaurantIdInt)) {
        alert('Invalid restaurant ID');
        return;
      }
      if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
        alert('Invalid rating');
        return;
      }

      if (userReview) {
        // Update existing review
        const updateData = {
          rating_restaurant: ratingInt,
          comment_restaurant: comment.trim() || null,
        };
        console.log('Updating review:', userReview.review_id, updateData);
        await reviewService.partialUpdate(userReview.review_id, updateData);
      } else {
        // Create new review (without order)
        const createData = {
          restaurant: restaurantIdInt,
          rating_restaurant: ratingInt,
          comment_restaurant: comment.trim() || null,
        };
        console.log('Creating review:', createData);
        await reviewService.create(createData);
      }
      await fetchReviews();
      setShowReviewForm(false);
      alert(translate('restaurant.review_saved') || 'บันทึกรีวิวสำเร็จ');
    } catch (err) {
      console.error('Error submitting review:', err);
      console.error('Error response:', err.response?.data);
      let errorMessage = translate('restaurant.review_error') || 'เกิดข้อผิดพลาดในการบันทึกรีวิว';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        }
      }
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    
    if (!window.confirm(translate('restaurant.delete_review_confirm') || 'คุณต้องการลบรีวิวนี้หรือไม่?')) {
      return;
    }

    try {
      await reviewService.delete(userReview.review_id);
      setUserReview(null);
      setRating(0);
      setComment('');
      await fetchReviews();
      alert(translate('restaurant.review_deleted') || 'ลบรีวิวสำเร็จ');
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(translate('restaurant.delete_review_error') || 'เกิดข้อผิดพลาดในการลบรีวิว');
    }
  };

  const renderStars = (value, interactive = false, hoverValue = null, onHover = null, onClick = null) => {
    const displayValue = hoverValue || value || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= displayValue;
          const StarComponent = isActive ? StarIcon : StarOutlineIcon;
          return (
            <button
              key={star}
              type={interactive ? 'button' : undefined}
              className={`transition-all ${
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              } ${
                isActive
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              style={{ width: '1.5rem', height: '1.5rem' }}
              onMouseEnter={interactive && onHover ? () => onHover(star) : undefined}
              onMouseLeave={interactive && onHover ? () => onHover(0) : undefined}
              onClick={interactive && onClick ? () => onClick(star) : undefined}
            >
              <StarComponent className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-500">{translate('common.loading') || 'กำลังโหลด...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Review Form */}
      {user ? (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {!showReviewForm && !userReview ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              {translate('restaurant.write_review') || 'เขียนรีวิว'}
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('restaurant.rating') || 'คะแนน'} *
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {renderStars(rating, true, hoveredRating, setHoveredRating, setRating)}
                  {hoveredRating > 0 && (
                    <span className="text-sm text-secondary-500">
                      {hoveredRating} {translate('restaurant.stars') || 'ดาว'}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('restaurant.comment') || 'ความคิดเห็น'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={translate('restaurant.comment_placeholder') || 'เขียนความคิดเห็นของคุณ...'}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="flex-1 px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? (translate('common.saving') || 'กำลังบันทึก...')
                    : userReview
                    ? (translate('restaurant.update_review') || 'อัปเดตรีวิว')
                    : (translate('restaurant.submit_review') || 'ส่งรีวิว')}
                </button>
                {userReview && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    className="px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {translate('restaurant.delete_review') || 'ลบรีวิว'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    if (!userReview) {
                      setRating(0);
                      setComment('');
                    }
                  }}
                  className="px-4 py-2 text-sm sm:text-base bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition-colors"
                >
                  {translate('common.cancel') || 'ยกเลิก'}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm sm:text-base text-yellow-800">
            {translate('restaurant.login_to_review') || 'กรุณาเข้าสู่ระบบเพื่อรีวิว'}
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold text-secondary-800">
          {translate('restaurant.reviews') || 'รีวิว'} ({Array.isArray(reviews) ? reviews.length : 0})
        </h3>
        {!Array.isArray(reviews) || reviews.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm">
            <p className="text-sm sm:text-base text-secondary-500">
              {translate('restaurant.no_reviews') || 'ยังไม่มีรีวิว'}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.review_id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                      {review.user_username
                        ? review.user_username.charAt(0).toUpperCase()
                        : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-secondary-800 truncate">
                        {review.user_username || translate('common.anonymous') || 'ผู้ใช้'}
                      </h4>
                      <p className="text-xs sm:text-sm text-secondary-500">
                        {new Date(review.review_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mb-2">{renderStars(review.rating_restaurant)}</div>
                  {review.comment_restaurant && (
                    <p className="text-sm sm:text-base text-secondary-700 mt-2 break-words">
                      {review.comment_restaurant}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RestaurantReviews;
