import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { GrLocationPin } from 'react-icons/gr';
import { BiCurrentLocation } from 'react-icons/bi';
import { FaSearch } from 'react-icons/fa';
import { reverseGeocode, getGoogleMapsApiKey } from '../../utils/googleMaps';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

/**
 * MapPicker Component
 * Component สำหรับเลือกที่อยู่โดยคลิกบนแผนที่ (ใช้ Google Maps)
 */
const MapPicker = forwardRef(({
  initialCenter = { lat: 13.7563, lng: 100.5018 }, // กรุงเทพฯ
  onLocationSelect,
  deferSelection = false,
  zoom = 15,
  className = '',
  height = '400px',
  showPlaceSearch = true,
  placeSearchPlaceholder = 'ค้นหาสถานที่ แล้วเลือกจากรายการ',
}, ref) => {
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(initialCenter);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const deferSelectionRef = useRef(deferSelection);
  const lastCenterKeyRef = useRef('');
  const apiKey = getGoogleMapsApiKey();

  onLocationSelectRef.current = onLocationSelect;
  deferSelectionRef.current = deferSelection;

  useImperativeHandle(ref, () => ({
    confirmCurrentLocation: async () => {
      if (map) {
        const center = map.getCenter();
        // ปัดทศนิยมเหลือ 10 ตำแหน่ง
        const loc = { 
          lat: Math.round(center.lat() * 1e10) / 1e10, 
          lng: Math.round(center.lng() * 1e10) / 1e10 
        };
        await updateLocation(loc, { commit: true, awaitGeocode: false });
        return loc;
      }
      return currentLocation;
    }
  }), [map, currentLocation]);

  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API Key is not set');
      return;
    }

    loadGoogleMaps(apiKey, ['places'])
      .then(() => {
        setMapsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setIsLoading(false);
      });
  }, [apiKey]);

  useEffect(() => {
    if (mapsLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [mapsLoaded, map]);

  // เลื่อนแผนที่เมื่อพิกัดจากฟอร์มเปลี่ยน (เช่น เลือกจากช่องที่อยู่ Autocomplete)
  useEffect(() => {
    if (!map) return;
    const rawLat = initialCenter?.lat;
    const rawLng = initialCenter?.lng;
    const nLat =
      typeof rawLat === 'number' && !Number.isNaN(rawLat) ? rawLat : parseFloat(rawLat);
    const nLng =
      typeof rawLng === 'number' && !Number.isNaN(rawLng) ? rawLng : parseFloat(rawLng);
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return;

    const c = map.getCenter();
    const dLat = Math.abs(c.lat() - nLat);
    const dLng = Math.abs(c.lng() - nLng);
    if (dLat < 0.00012 && dLng < 0.00012) return;

    lastCenterKeyRef.current = `${nLat.toFixed(5)},${nLng.toFixed(5)}`;
    setCurrentLocation({ lat: nLat, lng: nLng });
    map.setCenter({ lat: nLat, lng: nLng });
    const z = typeof zoom === 'number' ? zoom : 15;
    map.setZoom(z >= 15 ? z : 17);
  }, [map, initialCenter?.lat, initialCenter?.lng, zoom]);

  useEffect(() => {
    if (!showPlaceSearch || !map || !mapsLoaded || !searchInputRef.current || !window.google?.maps?.places) {
      return undefined;
    }

    const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
    });
    ac.bindTo('bounds', map);

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const roundedLat = Math.round(lat * 1e10) / 1e10;
      const roundedLng = Math.round(lng * 1e10) / 1e10;

      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter({ lat: roundedLat, lng: roundedLng });
        map.setZoom(17);
      }

      lastCenterKeyRef.current = `${roundedLat.toFixed(5)},${roundedLng.toFixed(5)}`;
      setCurrentLocation({ lat: roundedLat, lng: roundedLng });

      const addr =
        place.formatted_address ||
        `ตำแหน่ง: ${roundedLat.toFixed(6)}, ${roundedLng.toFixed(6)}`;
      setAddress(addr);

      if (!deferSelectionRef.current && onLocationSelectRef.current) {
        onLocationSelectRef.current({
          lat: roundedLat,
          lng: roundedLng,
          address: addr,
        });
      }
    });

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
      window.google.maps.event.clearInstanceListeners(ac);
    };
  }, [map, mapsLoaded, showPlaceSearch]);

  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded() || !window.google?.maps) {
      return;
    }

    try {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: currentLocation,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'greedy'
      });

      const updateCenterLocation = async () => {
        const center = googleMap.getCenter();
        const centerKey = `${center.lat().toFixed(5)},${center.lng().toFixed(5)}`;
        if (lastCenterKeyRef.current === centerKey) {
          return;
        }
        lastCenterKeyRef.current = centerKey;
        
        const newLocation = {
          lat: center.lat(),
          lng: center.lng()
        };
        await updateLocation(newLocation, { commit: !deferSelection });
      };

      googleMap.addListener('idle', updateCenterLocation);

      setMap(googleMap);

      const fallbackAddress = `ตำแหน่ง: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
      setAddress(fallbackAddress);

      updateLocation(currentLocation, { commit: !deferSelection }).catch((err) => {
        console.warn('Initial reverse geocoding failed:', err);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
      if (error.message && error.message.includes('Billing')) {
        setAddress('⚠️ กรุณาเปิดใช้งาน Billing ใน Google Cloud Console');
      }
    }
  };

  const updateLocation = useCallback(async (location, options = {}) => {
    const {
      commit: commitOverride,
      awaitGeocode = true,
    } = options;

    const shouldCommit = typeof commitOverride === 'boolean'
      ? commitOverride
      : !deferSelection;

    // ปัดทศนิยมเหลือ 10 ตำแหน่ง (ไม่เกิน 12 ตำแหน่งที่ backend รองรับ)
    const roundedLat = Math.round(location.lat * 1e10) / 1e10;
    const roundedLng = Math.round(location.lng * 1e10) / 1e10;

    setCurrentLocation({ lat: roundedLat, lng: roundedLng });
    const fallbackAddr = `ตำแหน่ง: ${roundedLat.toFixed(6)}, ${roundedLng.toFixed(6)}`;

    if (!shouldCommit) {
      setAddress(fallbackAddr);
      return;
    }

    if (onLocationSelect) {
      onLocationSelect({
        lat: roundedLat,
        lng: roundedLng,
        address: fallbackAddr
      });
    }

    const doGeocode = async () => {
      setIsLoading(true);
      try {
        if (apiKey) {
          const addr = await reverseGeocode(roundedLat, roundedLng, apiKey);
          setAddress(addr);
          if (onLocationSelect) {
            onLocationSelect({
              lat: roundedLat,
              lng: roundedLng,
              address: addr
            });
          }
        } else {
          setAddress(fallbackAddr);
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed, using coordinates:', geocodeError.message);
        setAddress(fallbackAddr);
        if (onLocationSelect && shouldCommit) {
          onLocationSelect({
            lat: roundedLat,
            lng: roundedLng,
            address: fallbackAddr
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (awaitGeocode) {
      await doGeocode();
    } else {
      void doGeocode();
    }
  }, [onLocationSelect, deferSelection, apiKey]);

  const zoomToCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (map) {
            map.setCenter(location);
            map.setZoom(17);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง');
          setIsLoading(false);
        }
      );
    } else {
      alert('เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงตำแหน่ง');
    }
  };

  return (
    <div className={`map-picker ${className}`}>
      <style>{`
        .map-picker .gm-style-cc,
        .map-picker .gmnoprint,
        .map-picker .gm-fullscreen-control {
          display: none !important;
        }
        .pac-container {
          z-index: 13000 !important;
        }
      `}</style>
      {showPlaceSearch && apiKey ? (
        <div className="relative mb-2">
          <FaSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="text"
            autoComplete="off"
            placeholder={placeSearchPlaceholder}
            className="w-full rounded-lg border border-secondary-300 py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder:text-secondary-400 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-300/80"
          />
        </div>
      ) : null}
      <div
        style={{ height: height }}
        className="relative w-full overflow-hidden rounded-lg border border-secondary-300"
      >
        {/* Fixed center pin */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 1000,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.35))'
        }}>
          <GrLocationPin size={36} color="#f97316" />
        </div>
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
        />
        {/* ปุ่มซูมไปที่ตำแหน่งปัจจุบัน (แบบกลม) */}
        <button
          type="button"
          onClick={zoomToCurrentLocation}
          disabled={isLoading}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors flex items-center justify-center z-[1000] border border-gray-300 disabled:opacity-50"
          title="ไปที่ตำแหน่งปัจจุบัน"
        >
          <BiCurrentLocation className="w-5 h-5 text-gray-700" />
        </button>
      </div>
      
      {!apiKey && (
        <p className="mt-2 text-xs text-yellow-600">
          ⚠️ Google Maps API Key ไม่ได้ตั้งค่า แผนที่อาจไม่แสดง
        </p>
      )}
      
      {apiKey && address && address.includes('⚠️') && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium mb-1">
            ⚠️ ต้องเปิดใช้งาน Billing
          </p>
          <p className="text-xs text-red-600 mb-2">
            Google Maps API ต้องการ Billing account ที่เปิดใช้งาน
          </p>
          <a 
            href="https://console.cloud.google.com/project/_/billing/enable" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            เปิดใช้งาน Billing ที่นี่ →
          </a>
        </div>
      )}
    </div>
  );
});

MapPicker.displayName = 'MapPicker';

export default MapPicker;
