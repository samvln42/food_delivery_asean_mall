import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import Loading from '../../../components/common/Loading';
import VenueCard from '../../../components/entertainment/VenueCard';
import { entertainmentVenueService, venueCategoryService } from '../../../services/api';
import { FaTheaterMasks } from 'react-icons/fa';

const EntertainmentVenues = () => {
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('rating'); // name, rating, distance
  const { translate } = useLanguage();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await venueCategoryService.getAll({ is_active: true });
        const fetchedCategories = response.data?.results || response.data || [];
        setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]); // Set empty array on error
      }
    };
    fetchCategories();
  }, []);

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {};
        
        // Add search query
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        // Add category filter
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        
        // Add sorting
        if (sortBy === 'rating') {
          params.ordering = '-average_rating';
        } else if (sortBy === 'name') {
          params.ordering = 'venue_name';
        }
        
        const response = await entertainmentVenueService.getAll(params);
        let fetchedVenues = response.data?.results || response.data || [];
        
        // Client-side sort for distance (if needed)
        if (sortBy === 'distance') {
          // TODO: Implement distance calculation when location is available
          fetchedVenues = fetchedVenues.sort((a, b) => a.venue_name.localeCompare(b.venue_name));
        }
        
        setVenues(fetchedVenues);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenues();
  }, [searchQuery, selectedCategory, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (sortBy === 'rating') params.ordering = '-average_rating';
      else if (sortBy === 'name') params.ordering = 'venue_name';
      
      const response = await entertainmentVenueService.getAll(params);
      setVenues(response.data?.results || response.data || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (loading && venues.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text={translate('common.loading') || 'Loading...'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-800 mb-3 sm:mb-4">
            <FaTheaterMasks className="h-6 w-6 sm:h-7 sm:w-7 inline-block mr-2 text-primary-600" /> {translate('entertainment.venues') || 'สถานที่บันเทิง'}
          </h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-3 sm:mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translate('common.search') || 'ค้นหา...'}
                className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 text-sm sm:text-base border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="absolute left-2.5 sm:left-3 top-2.5 sm:top-2.5 text-secondary-400 text-sm sm:text-base">🔍</span>
            </div>
          </form>

          {/* Category Filter */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                selectedCategory === null
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
              }`}
            >
              {translate('common.all') || 'ทั้งหมด'}
            </button>
            {Array.isArray(categories) && categories.map((category) => (
              <button
                key={category.category_id}
                onClick={() => setSelectedCategory(category.category_id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === category.category_id
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
                }`}
              >
                {category.icon_display_url ? (
                  <img src={category.icon_display_url} alt={category.category_name} className="inline w-4 h-4 mr-1" />
                ) : (
                  <FaTheaterMasks className="inline w-4 h-4 text-secondary-400" />
                )} {category.category_name}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
            <span className="text-xs sm:text-sm text-secondary-600 whitespace-nowrap">{translate('common.sort_by') || 'เรียงตาม:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 sm:py-1 border border-secondary-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">{translate('common.name') || 'ชื่อ'}</option>
              <option value="rating">{translate('common.rating') || 'เรตติ้ง'}</option>
              <option value="distance">{translate('common.distance') || 'ระยะทาง'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
            <button
              onClick={fetchVenues}
              className="bg-primary-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary-600 text-sm sm:text-base"
            >
              {translate('common.try_again') || 'ลองอีกครั้ง'}
            </button>
          </div>
        ) : venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.venue_id} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="mb-4 opacity-30 flex justify-center">
              <FaTheaterMasks className="w-16 h-16 sm:w-24 sm:h-24 text-secondary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-secondary-700 mb-2">
              {translate('entertainment.no_venues_found') || 'ไม่พบสถานที่บันเทิง'}
            </h3>
            <p className="text-sm sm:text-base text-secondary-500 px-4">
              {translate('entertainment.try_different_search') || 'ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntertainmentVenues;
