import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import Loading from '../../../components/common/Loading';
import VenuesMap from '../../../components/entertainment/VenuesMap';
import VenueLocationFilterListboxes from '../../../components/entertainment/VenueLocationFilterListboxes';
import { reverseGeocodeStructured } from '../../../utils/nominatim';
import { matchCountryId } from '../../../utils/locationMatch';
import { loadOfflineData, hasOfflineData } from '../../../utils/syncManager';
import {
  entertainmentVenueService,
  venueCategoryService,
  restaurantService,
  countryService,
  cityService,
} from '../../../services/api';
import {
  FaTheaterMasks,
  FaStar,
  FaSearch,
  FaUtensils,
  FaTimes,
  FaWifi,
} from 'react-icons/fa';

const CATEGORY_RESTAURANTS = 'restaurants';
const EARTH_RADIUS_KM = 6371;

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

const EntertainmentVenues = () => {
  const [venues, setVenues] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [locationCountry, setLocationCountry] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [countriesList, setCountriesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [locationBootstrapDone, setLocationBootstrapDone] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [userCoords, setUserCoords] = useState(() => {
    // อ่าน GPS ที่ cache ไว้จาก session ก่อน ทำให้ map เริ่มต้นที่ตำแหน่งปัจจุบันทันทีตอน refresh
    try {
      const raw = sessionStorage.getItem('ev_userCoords');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.lat && parsed?.lng) return parsed;
      }
    } catch (_) {}
    return null;
  });
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredCities = useMemo(() => {
    if (!locationCountry) return [];
    return citiesList.filter((c) => String(c.country) === String(locationCountry));
  }, [citiesList, locationCountry]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, ciRes] = await Promise.all([
          countryService.getAll(),
          cityService.getAll(),
        ]);
        if (cancelled) return;
        let countries = cRes.data?.results || cRes.data || [];
        let cities = ciRes.data?.results || ciRes.data || [];
        if (!Array.isArray(countries)) countries = [];
        if (!Array.isArray(cities)) cities = [];
        setCountriesList(countries);
        setCitiesList(cities);
        if (!countries.length) {
          setLocationBootstrapDone(true);
        }
      } catch (err) {
        console.error('Error fetching countries/cities:', err);
        setLocationBootstrapDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** ตรวจสอบ online/offline แบบ realtime */
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  /** Bootstrap ทันทีด้วย country แรก (ไม่รวม geolocation เพื่อหลีกเลี่ยง stale cancelled) */
  useEffect(() => {
    if (locationBootstrapDone) return;
    if (!countriesList.length) return;
    setLocationCountry(String(countriesList[0].country_id));
    setLocationBootstrapDone(true);
  }, [countriesList, locationBootstrapDone]);

  /** Geolocation แยกต่างหาก — deps ไม่มี locationBootstrapDone จึงไม่ถูก cancel */
  useEffect(() => {
    if (!countriesList.length) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    let cancelled = false;

    const handlePosition = async (pos) => {
      if (cancelled) return;
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(coords);
      try { sessionStorage.setItem('ev_userCoords', JSON.stringify(coords)); } catch (_) {}
      try {
        const parts = await reverseGeocodeStructured(pos.coords.latitude, pos.coords.longitude);
        if (cancelled) return;
        if (parts && (parts.country || parts.country_code)) {
          const cid = matchCountryId(countriesList, parts);
          setLocationCountry(String(cid));
        }
      } catch (e) {
        console.warn('EntertainmentVenues: reverse geocode failed', e);
      }
    };

    // รอบแรก: low-accuracy เร็ว
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      () => {
        if (cancelled) return;
        // fallback high-accuracy
        navigator.geolocation.getCurrentPosition(
          handlePosition,
          () => {},
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesList]);

  // ตรวจว่าเมืองที่เลือกยังอยู่ในประเทศที่เลือกอยู่ ถ้าไม่ใช่ให้ reset เป็น '' (ทุกเมือง)
  useEffect(() => {
    if (!locationCity) return;
    const ok = citiesList.some(
      (c) =>
        String(c.city_id) === String(locationCity) &&
        String(c.country) === String(locationCountry)
    );
    if (!ok) setLocationCity('');
  }, [locationCountry, locationCity, citiesList]);

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

  // Fetch venues and restaurants (หลังเลือกประเทศ/เมือง default แล้ว)
  useEffect(() => {
    let cancelled = false;
    if (!locationBootstrapDone || !locationCountry) {
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        if (selectedCategory !== CATEGORY_RESTAURANTS) {
          const params = { page_size: 100 };
          if (searchQuery) params.search = searchQuery;
          if (selectedCategory) params.category = selectedCategory;
          params.country = parseInt(locationCountry, 10);
          if (locationCity) params.city = parseInt(locationCity, 10);
          if (sortBy === 'rating') params.ordering = '-average_rating';
          else if (sortBy === 'name') params.ordering = 'venue_name';

          const response = await entertainmentVenueService.getAll(params);
          let fetchedVenues = response.data?.results || response.data || [];
          if (userCoords) {
            fetchedVenues = [...fetchedVenues].sort((a, b) => {
              const alat = toNum(a.latitude);
              const alng = toNum(a.longitude);
              const blat = toNum(b.latitude);
              const blng = toNum(b.longitude);
              const ad =
                alat != null && alng != null
                  ? haversineKm(userCoords.lat, userCoords.lng, alat, alng)
                  : Number.POSITIVE_INFINITY;
              const bd =
                blat != null && blng != null
                  ? haversineKm(userCoords.lat, userCoords.lng, blat, blng)
                  : Number.POSITIVE_INFINITY;
              return ad - bd;
            });
          }
          if (!cancelled) setVenues(fetchedVenues);
        } else {
          setVenues([]);
        }

        if (selectedCategory === CATEGORY_RESTAURANTS || selectedCategory === null) {
          const params = { page_size: 100 };
          if (searchQuery) params.search = searchQuery;
          params.country = parseInt(locationCountry, 10);
          if (locationCity) params.city = parseInt(locationCity, 10);
          const res = await restaurantService.getAll(params);
          let fetched = res.data?.results || res.data || [];
          if (!Array.isArray(fetched)) fetched = [];
          if (userCoords) {
            fetched = [...fetched].sort((a, b) => {
              const alat = toNum(a.latitude);
              const alng = toNum(a.longitude);
              const blat = toNum(b.latitude);
              const blng = toNum(b.longitude);
              const ad =
                alat != null && alng != null
                  ? haversineKm(userCoords.lat, userCoords.lng, alat, alng)
                  : Number.POSITIVE_INFINITY;
              const bd =
                blat != null && blng != null
                  ? haversineKm(userCoords.lat, userCoords.lng, blat, blng)
                  : Number.POSITIVE_INFINITY;
              return ad - bd;
            });
          }
          if (!cancelled) setRestaurants(fetched);
        } else {
          if (!cancelled) setRestaurants([]);
        }
      } catch (err) {
        if (cancelled) return;
        // ถ้า offline หรือ network error → ลองโหลดจาก IndexedDB
        const offline = !navigator.onLine || err.code === 'ERR_NETWORK';
        const hasCache = await hasOfflineData().catch(() => false);
        if ((offline || err.message?.includes('Network')) && hasCache) {
          try {
            const { venues: ov, restaurants: or_ } = await loadOfflineData();
            let filteredVenues = ov.filter(
              (v) => !locationCountry || String(v.country) === String(locationCountry)
            );
            if (locationCity) filteredVenues = filteredVenues.filter((v) => String(v.city) === String(locationCity));
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              filteredVenues = filteredVenues.filter((v) =>
                (v.venue_name || '').toLowerCase().includes(q)
              );
            }
            let filteredRest = or_.filter(
              (r) => !locationCountry || String(r.country) === String(locationCountry)
            );
            if (locationCity) filteredRest = filteredRest.filter((r) => String(r.city) === String(locationCity));
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              filteredRest = filteredRest.filter((r) =>
                (r.restaurant_name || '').toLowerCase().includes(q)
              );
            }
            if (userCoords) {
              const sortByDist = (arr, latKey = 'latitude', lngKey = 'longitude') =>
                [...arr].sort((a, b) => {
                  const ad = toNum(a[latKey]) != null ? haversineKm(userCoords.lat, userCoords.lng, toNum(a[latKey]), toNum(a[lngKey])) : Infinity;
                  const bd = toNum(b[latKey]) != null ? haversineKm(userCoords.lat, userCoords.lng, toNum(b[latKey]), toNum(b[lngKey])) : Infinity;
                  return ad - bd;
                });
              filteredVenues = sortByDist(filteredVenues);
              filteredRest = sortByDist(filteredRest);
            }
            if (!cancelled) {
              if (selectedCategory !== CATEGORY_RESTAURANTS) setVenues(filteredVenues);
              if (selectedCategory === CATEGORY_RESTAURANTS || selectedCategory === null) setRestaurants(filteredRest);
              setError(null);
            }
          } catch (dbErr) {
            if (!cancelled) setError('ไม่มีเน็ตและไม่มีข้อมูล offline');
          }
        } else {
          setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
          setVenues([]);
          setRestaurants([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [
    searchQuery,
    selectedCategory,
    sortBy,
    locationCountry,
    locationCity,
    locationBootstrapDone,
    userCoords,
  ]);

  const isLoading =
    !locationBootstrapDone ||
    (loading && venues.length === 0 && restaurants.length === 0);

  const commitSearch = (value) => {
    setSearchQuery(value.trim());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    commitSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const q = params.get('q') || '';
    setSearchInput(q);
    setSearchQuery(q.trim());
  }, [location.search]);

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
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-medium px-3 py-1.5 flex items-center justify-center gap-2 z-30">
          <FaWifi className="h-3 w-3 opacity-60" aria-hidden />
          <span>ออฟไลน์ — กำลังแสดงข้อมูลที่บันทึกไว้</span>
        </div>
      )}
      {/* Compact Header - Filter bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-3 sm:px-4 py-3">
          <h1 className="sr-only">
            {translate('entertainment.venues') || 'สถานที่บันเทิง'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mb-3 min-w-0">
            <div className="w-full min-w-0 sm:flex-1 px-0.5">
              <VenueLocationFilterListboxes
                countriesList={countriesList}
                filteredCities={filteredCities}
                locationCountry={locationCountry}
                locationCity={locationCity}
                onCountryChange={(id) => {
                  setLocationCountry(id);
                  setLocationCity('');
                }}
                onCityChange={setLocationCity}
                translate={translate}
              />
            </div>

            <form onSubmit={handleSearch} className="hidden sm:block sm:w-auto sm:flex-none">
              <div className="flex items-center gap-1.5 rounded-xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 shadow-sm px-2.5 py-1.5 transition focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 w-full sm:w-[320px]">
                <FaSearch className="shrink-0 h-3.5 w-3.5 text-gray-400" aria-hidden />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitSearch(searchInput); }
                    if (e.key === 'Escape') handleClearSearch();
                  }}
                  placeholder={translate('entertainment.search_placeholder') || 'ค้นหาสถานที่ ร้านอาหาร...'}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="ล้างการค้นหา"
                  >
                    <FaTimes className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-primary-500 hover:bg-primary-600 active:bg-primary-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  {translate('common.search') || 'ค้นหา'}
                </button>
              </div>
            </form>

          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

      {/* Main Content - Map */}
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
        ) : (
          <div className="absolute inset-0">
            <VenuesMap
              places={displayPlaces}
              height="100%"
              onPlaceClick={handlePlaceClick}
              userCoords={userCoords}
              locationCity={locationCity}
              onUserCoordsChange={setUserCoords}
              searchQuery={searchQuery}
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
