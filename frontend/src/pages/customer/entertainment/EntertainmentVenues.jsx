import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import Loading from '../../../components/common/Loading';
import VenuesMap from '../../../components/entertainment/VenuesMap';
import { entertainmentVenueService, venueCategoryService, restaurantService } from '../../../services/api';
import {
  FaTheaterMasks,
  FaStar,
  FaSearch,
  FaList,
  FaMapMarkerAlt,
  FaUtensils,
} from 'react-icons/fa';

const CATEGORY_RESTAURANTS = 'restaurants';

const EntertainmentVenues = () => {
  const [venues, setVenues] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [showListView, setShowListView] = useState(false);
  const { translate } = useLanguage();
  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await venueCategoryService.getAll({ is_active: true });
        const fetchedCategories = response.data?.results || response.data || [];
        setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch venues and restaurants
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        if (selectedCategory !== CATEGORY_RESTAURANTS) {
          const params = {};
          if (searchQuery) params.search = searchQuery;
          if (selectedCategory) params.category = selectedCategory;
          if (sortBy === 'rating') params.ordering = '-average_rating';
          else if (sortBy === 'name') params.ordering = 'venue_name';

          const response = await entertainmentVenueService.getAll(params);
          let fetchedVenues = response.data?.results || response.data || [];
          if (sortBy === 'distance') {
            fetchedVenues = fetchedVenues.sort((a, b) =>
              a.venue_name.localeCompare(b.venue_name)
            );
          }
          if (!cancelled) setVenues(fetchedVenues);
        } else {
          setVenues([]);
        }

        if (selectedCategory === CATEGORY_RESTAURANTS || selectedCategory === null) {
          const params = { page_size: 200 };
          if (searchQuery) params.search = searchQuery;
          const res = await restaurantService.getAll(params);
          let fetched = res.data?.results || res.data || [];
          if (!Array.isArray(fetched)) fetched = [];
          if (!cancelled) setRestaurants(fetched);
        } else {
          if (!cancelled) setRestaurants([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
          setVenues([]);
          setRestaurants([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [searchQuery, selectedCategory, sortBy]);

  const isLoading = loading && venues.length === 0 && restaurants.length === 0;

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const displayPlaces = selectedCategory === CATEGORY_RESTAURANTS
    ? restaurants.map((r) => ({ type: 'restaurant', ...r }))
    : selectedCategory === null
      ? [
          ...venues.map((v) => ({ type: 'venue', ...v })),
          ...restaurants.map((r) => ({ type: 'restaurant', ...r })),
        ]
      : venues.map((v) => ({ type: 'venue', ...v }));

  const handlePlaceClick = (place) => {
    if (place.type === 'restaurant') {
      navigate(`/restaurants/${place.restaurant_id}`);
    } else {
      navigate(`/entertainment-venues/${place.venue_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          size="large"
          text={translate('common.loading') || 'Loading...'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Compact Header - Filter bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaTheaterMasks className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
              {translate('entertainment.venues') || 'สถานที่บันเทิง'}
            </h1>
            <button
              onClick={() => setShowListView(!showListView)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title={showListView ? 'แสดงแผนที่' : 'แสดงรายการ'}
            >
              {showListView ? (
                <FaMapMarkerAlt className="w-5 h-5" aria-hidden />
              ) : (
                <FaList className="w-5 h-5" aria-hidden />
              )}
            </button>
          </div>

          <form onSubmit={handleSearch} className="mb-2">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translate('common.search') || 'ค้นหา...'}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </form>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                selectedCategory === null
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {translate('common.all') || 'ทั้งหมด'}
            </button>
            <button
              onClick={() => setSelectedCategory(CATEGORY_RESTAURANTS)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                selectedCategory === CATEGORY_RESTAURANTS
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaUtensils className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {translate('common.restaurants') || 'ร้านอาหาร'}
            </button>
            {Array.isArray(categories) &&
              categories.map((category) => (
                <button
                  key={category.category_id}
                  onClick={() => setSelectedCategory(category.category_id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.category_id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.icon_display_url ? (
                    <img
                      src={category.icon_display_url}
                      alt={category.category_name}
                      className="inline w-3.5 h-3.5 mr-1"
                    />
                  ) : (
                    <FaTheaterMasks className="mr-1 inline h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                  )}
                  {category.category_name}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Main Content - Map or List */}
      <div className="flex-1 min-h-0 relative">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 mb-4 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 text-sm"
            >
              {translate('common.try_again') || 'ลองอีกครั้ง'}
            </button>
          </div>
        ) : showListView ? (
          <div className="overflow-y-auto h-[calc(100vh-180px)] p-4">
            {displayPlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPlaces.map((place) => {
                  const isRestaurant = place.type === 'restaurant';
                  const name = isRestaurant ? place.restaurant_name : place.venue_name;
                  const imageUrl = place.image_display_url;
                  const key = isRestaurant ? `r-${place.restaurant_id}` : `v-${place.venue_id}`;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePlaceClick(place)}
                      className="text-left bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-200 transition-all"
                    >
                      <div className="flex gap-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {isRestaurant ? (
                              <FaUtensils className="h-8 w-8 text-gray-400" aria-hidden />
                            ) : (
                              <FaTheaterMasks className="h-8 w-8 text-gray-400" aria-hidden />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {place.address || place.description}
                          </p>
                          {place.average_rating > 0 && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                              <FaStar className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
                              {Number(place.average_rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaTheaterMasks className="mx-auto mb-4 h-16 w-16 text-gray-300" aria-hidden />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {translate('entertainment.no_venues_found') || 'ไม่พบสถานที่บันเทิง'}
                </h3>
                <p className="text-sm text-gray-500">
                  {translate('entertainment.try_different_search') ||
                    'ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            <VenuesMap
              places={displayPlaces}
              height="100%"
              onPlaceClick={handlePlaceClick}
            />
            {displayPlaces.length > 0 && displayPlaces.filter((p) => p.latitude && p.longitude).length === 0 && (
              <div className="absolute bottom-4 left-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                {translate('entertainment.no_venue_coordinates') ||
                  'สถานที่ที่พบไม่มีพิกัด จึงไม่สามารถแสดงบนแผนที่ได้'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntertainmentVenues;
