import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { venueReviewService } from '../../services/api';

const VenueReviews = ({ venueId }) => {
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
  }, [venueId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await venueReviewService.getByVenue(venueId);
      
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
      
      // Find user's review if exists
      if (user && Array.isArray(reviewsData)) {
        const review = reviewsData.find(r => r.user === user.id);
        setUserReview(review || null);
        if (review) {
          setRating(review.rating);
          setComment(review.comment || '');
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.detail || err.message);
      setReviews([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(translate('entertainment.login_to_review') || 'กรุณาเข้าสู่ระบบเพื่อรีวิว');
      return;
    }
    if (!rating || rating === 0) {
      alert(translate('entertainment.select_rating') || 'กรุณาเลือกคะแนน');
      return;
    }
    if (!venueId) {
      alert('Venue ID is missing');
      return;
    }

    try {
      setSubmitting(true);
      const venueIdInt = parseInt(venueId, 10);
      const ratingInt = parseInt(rating, 10);
      
      if (isNaN(venueIdInt)) {
        alert('Invalid venue ID');
        return;
      }
      if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
        alert('Invalid rating');
        return;
      }

      if (userReview) {
        // Update existing review
        const updateData = {
          rating: ratingInt,
          comment: comment.trim() || null,
        };
        console.log('Updating review:', userReview.review_id, updateData);
        await venueReviewService.partialUpdate(userReview.review_id, updateData);
      } else {
        // Create new review
        const createData = {
          venue: venueIdInt,
          rating: ratingInt,
          comment: comment.trim() || null,
        };
        console.log('Creating review:', createData);
        console.log('venueId:', venueId, '->', venueIdInt);
        console.log('rating:', rating, '->', ratingInt);
        await venueReviewService.create(createData);
      }
      await fetchReviews();
      setShowReviewForm(false);
      alert(translate('entertainment.review_saved') || 'บันทึกรีวิวสำเร็จ');
    } catch (err) {
      console.error('Error submitting review:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      console.error('Request data:', err.config?.data);
      
      // Extract error message from various possible formats
      let errorMessage = translate('entertainment.review_error') || 'เกิดข้อผิดพลาด';
      if (err.response?.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.non_field_errors) {
          errorMessage = Array.isArray(err.response.data.non_field_errors) 
            ? err.response.data.non_field_errors.join(', ') 
            : err.response.data.non_field_errors;
        } else {
          // Try to extract first error message from object
          const firstKey = Object.keys(err.response.data)[0];
          if (firstKey) {
            const firstError = err.response.data[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError.join(', ') : firstError;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    if (!window.confirm(translate('entertainment.delete_review_confirm') || 'คุณแน่ใจหรือไม่ที่จะลบรีวิวนี้?')) {
      return;
    }

    try {
      await venueReviewService.delete(userReview.review_id);
      setUserReview(null);
      setRating(0);
      setComment('');
      await fetchReviews();
      alert(translate('entertainment.review_deleted') || 'ลบรีวิวสำเร็จ');
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || translate('entertainment.delete_review_error') || 'เกิดข้อผิดพลาด');
    }
  };

  const renderStars = (value, interactive = false, hoverValue = null, onHover = null, onClick = null) => {
    // Use hoverValue if provided (for hover effect), otherwise use the actual value
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-secondary-600">{translate('common.loading') || 'กำลังโหลด...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Form */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {!showReviewForm && !userReview ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {translate('entertainment.write_review') || 'เขียนรีวิว'}
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('entertainment.rating') || 'คะแนน'}
                </label>
                {renderStars(rating, true, hoveredRating, setHoveredRating, setRating)}
                {hoveredRating > 0 && (
                  <p className="text-sm text-secondary-500 mt-1">
                    {hoveredRating} {translate('entertainment.stars') || 'ดาว'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('entertainment.comment') || 'ความคิดเห็น (ไม่บังคับ)'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={translate('entertainment.comment_placeholder') || 'เขียนความคิดเห็นของคุณ...'}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? translate('common.saving') || 'กำลังบันทึก...'
                    : userReview
                    ? translate('entertainment.update_review') || 'อัพเดทรีวิว'
                    : translate('entertainment.submit_review') || 'ส่งรีวิว'}
                </button>
                {userReview && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {translate('entertainment.delete_review') || 'ลบรีวิว'}
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
                  className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition-colors"
                >
                  {translate('common.cancel') || 'ยกเลิก'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold text-secondary-800">
          {translate('entertainment.reviews') || 'รีวิว'} ({Array.isArray(reviews) ? reviews.length : 0})
        </h3>
        {!Array.isArray(reviews) || reviews.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            {translate('entertainment.no_reviews') || 'ยังไม่มีรีวิว'}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.review_id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-secondary-800">
                      {review.user_username || translate('common.anonymous') || 'ผู้ใช้'}
                    </span>
                    {review.user === user?.id && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        {translate('entertainment.your_review') || 'รีวิวของคุณ'}
                      </span>
                    )}
                  </div>
                  <div className="mb-2">{renderStars(review.rating)}</div>
                  {review.comment && (
                    <p className="text-secondary-700 text-sm sm:text-base mt-2">{review.comment}</p>
                  )}
                </div>
              </div>
              <div className="text-xs text-secondary-500 mt-2">
                {new Date(review.review_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VenueReviews;
