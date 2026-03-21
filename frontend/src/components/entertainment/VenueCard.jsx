import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { FaStar, FaTheaterMasks } from 'react-icons/fa';

const VenueCard = ({ venue }) => {
  const { translate } = useLanguage();

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula for calculating distance
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const getCurrentLocation = () => {
    // Try to get from localStorage or geolocation
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        return JSON.parse(savedLocation);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentLocation = getCurrentLocation();
  const distance = currentLocation && venue.latitude && venue.longitude
    ? calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        parseFloat(venue.latitude),
        parseFloat(venue.longitude)
      )
    : null;

  return (
    <Link
      to={`/entertainment-venues/${venue.venue_id}`}
      className={`group bg-white rounded-lg sm:rounded-xl shadow-md transition-all duration-300 overflow-hidden ${
        venue.status === 'open'
          ? 'hover:shadow-lg cursor-pointer'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="relative h-40 sm:h-48 bg-gray-200">
        {venue.image_display_url ? (
          <img
            src={venue.image_display_url}
            alt={venue.venue_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center ${
            venue.image_display_url ? 'hidden' : ''
          }`}
        >
          <FaTheaterMasks className="w-16 h-16 sm:w-24 sm:h-24 opacity-30 text-secondary-400" />
        </div>
        {venue.status === 'closed' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm sm:text-base">
              {translate('common.closed') || 'ปิด'}
            </span>
          </div>
        )}
        {venue.venue_type && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-primary-500 text-white">
              {venue.venue_type}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-base sm:text-lg text-secondary-800 mb-1.5 sm:mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
          {venue.venue_name}
        </h3>
        <p className="text-secondary-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
          {venue.description}
        </p>
        <div className="flex items-center justify-between text-xs sm:text-sm mb-2 sm:mb-3">
          <div className="flex items-center">
            <FaStar className="text-yellow-500 text-sm sm:text-base" />
            <span className="ml-1 font-semibold">
              {Number(venue.average_rating || 0).toFixed(1)}
            </span>
            {venue.total_reviews > 0 && (
              <span className="text-secondary-500 ml-1 hidden sm:inline">
                ({venue.total_reviews})
              </span>
            )}
          </div>
          {distance && (
            <span className="text-secondary-500 text-xs sm:text-sm">
              📍 {distance} km
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-0.5 sm:py-1 rounded-full text-xs ${
              venue.status === 'open'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {venue.status === 'open'
              ? translate('common.open') || 'เปิด'
              : translate('common.closed') || 'ปิด'}
          </span>
          <span className="text-primary-500 font-semibold text-xs sm:text-sm group-hover:text-primary-600 hidden sm:inline">
            {translate('common.view_details') || 'ดูรายละเอียด'} →
          </span>
          <span className="text-primary-500 font-semibold text-xs sm:text-sm group-hover:text-primary-600 sm:hidden">
            →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default VenueCard;
