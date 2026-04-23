import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import Loading from '../../../components/common/Loading';
import VenueGallery from '../../../components/entertainment/VenueGallery';
import VenueMap from '../../../components/entertainment/VenueMap';
import DirectionsButton from '../../../components/entertainment/DirectionsButton';
import VenueReviews from '../../../components/entertainment/VenueReviews';
import { entertainmentVenueService } from '../../../services/api';
import { getTranslatedName, getTranslatedDescription } from '../../../utils/translationHelpers';
import { FaStar, FaMapMarkerAlt, FaPhone, FaClock, FaTags, FaTheaterMasks } from 'react-icons/fa';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const EntertainmentVenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { translate, currentLanguage } = useLanguage();

  useEffect(() => {
    const fetchVenueData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch venue details
        const venueResponse = await entertainmentVenueService.getById(id);
        setVenue(venueResponse.data);
        
        // Fetch venue images
        try {
          const imagesResponse = await entertainmentVenueService.getImages(id);
          setImages(imagesResponse.data || []);
        } catch (imgErr) {
          console.error('Error fetching images:', imgErr);
          // If images endpoint fails, use images from venue data
          if (venueResponse.data?.images) {
            setImages(venueResponse.data.images);
          }
        }
      } catch (err) {
        console.error('Error fetching venue:', err);
        setError(err.response?.data?.detail || err.message || 'ไม่พบสถานที่บันเทิง');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenueData();
  }, [id, currentLanguage]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text={translate('common.loading') || 'Loading...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-secondary-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/entertainment-venues')}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {translate('common.back') || 'กลับ'}
          </button>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTheaterMasks className="w-8 h-8 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600 mb-4">
            {translate('entertainment.venue_not_found') || 'ไม่พบสถานที่บันเทิง'}
          </p>
          <button
            onClick={() => navigate('/entertainment-venues')}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {translate('common.back') || 'กลับ'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3">
          <nav className="text-xs sm:text-sm overflow-x-auto">
            <div className="flex items-center whitespace-nowrap">
              <Link to="/" className="text-primary-600 hover:text-primary-700">
                {translate('common.home') || 'หน้าแรก'}
              </Link>
              <span className="mx-1 sm:mx-2 text-secondary-400">&gt;</span>
              <Link
                to="/entertainment-venues"
                className="text-primary-600 hover:text-primary-700"
              >
                {translate('entertainment.venues') || 'สถานที่บันเทิง'}
              </Link>
              <span className="mx-1 sm:mx-2 text-secondary-400">&gt;</span>
              <span className="text-secondary-600 truncate max-w-[150px] sm:max-w-none">{getTranslatedName(venue, currentLanguage, venue.venue_name)}</span>
            </div>
          </nav>
        </div>
      </div>

      {/* Venue Header */}
      <div className="bg-white shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Venue Image/Gallery */}
            <div className="w-full md:w-1/2">
              {images.length > 0 ? (
                <VenueGallery images={images} venueName={venue.venue_name} />
              ) : venue.image_display_url ? (
                <div className="relative h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden">
                  <img
                    src={venue.image_display_url}
                    alt={venue.venue_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden bg-secondary-200 flex items-center justify-center">
                  <FaTheaterMasks className="w-16 h-16 sm:w-24 sm:h-24 opacity-30 text-secondary-400" />
                </div>
              )}
            </div>

            {/* Venue Info */}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
                {getTranslatedName(venue, currentLanguage, venue.venue_name)}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-secondary-600 mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                {getTranslatedDescription(venue, currentLanguage, venue.description)}
              </p>

              {/* Rating */}
              <div className="flex items-center mb-3 sm:mb-4">
                <FaStar className="text-yellow-400 text-lg sm:text-xl mr-1" />
                <span className="text-base sm:text-lg font-semibold text-secondary-800">
                  {Number(venue.average_rating || 0).toFixed(1)}
                </span>
                <span className="text-xs sm:text-sm text-secondary-500 ml-1">
                  ({venue.total_reviews || 0} {translate('common.reviews') || 'รีวิว'})
                </span>
              </div>

              {/* Venue Details */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {venue.address && (
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-secondary-500 mr-2 mt-0.5 sm:mt-1 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base text-secondary-700 break-words">{venue.address}</span>
                  </div>
                )}
                {venue.phone_number && (
                  <div className="flex items-center">
                    <FaPhone className="text-secondary-500 mr-2 text-sm sm:text-base flex-shrink-0" />
                    <a
                      href={`tel:${venue.phone_number}`}
                      className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm md:text-base"
                    >
                      {venue.phone_number}
                    </a>
                  </div>
                )}
                {venue.opening_hours && (
                  <div className="flex items-center">
                    <FaClock className="text-secondary-500 mr-2 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base text-secondary-700">{venue.opening_hours}</span>
                  </div>
                )}
                {venue.category_name && (
                  <div className="flex items-center">
                    <FaTags className="text-secondary-500 mr-2 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base text-secondary-700">{venue.category_name}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-4 sm:mb-6">
                <span
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                    venue.status === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {venue.status === 'open' ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>{translate('common.open') || 'เปิด'}</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-4 h-4" />
                        <span>{translate('common.closed') || 'ปิด'}</span>
                      </>
                    )}
                  </span>
                </span>
              </div>

              {/* Directions Button */}
              {venue.latitude && venue.longitude && (
                <DirectionsButton
                  latitude={venue.latitude}
                  longitude={venue.longitude}
                  venueName={venue.venue_name}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-16 z-20 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex space-x-4 sm:space-x-6 md:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {translate('common.overview') || 'ภาพรวม'}
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {translate('entertainment.gallery') || 'บรรยากาศ'} <span className="hidden sm:inline">({images.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'map'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {translate('common.map') || 'แผนที่'}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {translate('entertainment.reviews') || 'รีวิว'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-3 sm:mb-4">
              {translate('common.about') || 'เกี่ยวกับ'}
            </h2>
            <p className="text-sm sm:text-base text-secondary-700 leading-relaxed">
              {getTranslatedDescription(venue, currentLanguage, venue.description) || translate('entertainment.no_description') || 'ไม่มีรายละเอียด'}
            </p>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            {images.length > 0 ? (
              <VenueGallery images={images} venueName={venue.venue_name} showFullGallery />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                <div className="text-4xl sm:text-6xl mb-4 opacity-30">📷</div>
                <p className="text-sm sm:text-base text-secondary-500">
                  {translate('entertainment.no_images') || 'ยังไม่มีรูปภาพ'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="relative z-10">
            {venue.latitude && venue.longitude ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-10">
                <VenueMap
                  latitude={venue.latitude}
                  longitude={venue.longitude}
                  venueName={venue.venue_name}
                  address={venue.address}
                  height="300px"
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                <div className="mb-4 opacity-30 flex justify-center">
                  <FaMapMarkerAlt className="w-16 h-16 sm:w-24 sm:h-24 text-secondary-400" />
                </div>
                <p className="text-sm sm:text-base text-secondary-500">
                  {translate('entertainment.no_location') || 'ไม่มีข้อมูลตำแหน่ง'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <VenueReviews venueId={id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EntertainmentVenueDetail;
