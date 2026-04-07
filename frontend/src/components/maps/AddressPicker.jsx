import React, { useState, useRef, useEffect, useMemo } from 'react';
import { geocodeAddress, getGoogleMapsApiKey } from '../../utils/googleMaps';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

const DEFAULT_PLACE_TYPES = ['address'];

/**
 * AddressPicker Component
 * Component สำหรับเลือกที่อยู่โดยใช้ Google Maps Autocomplete
 */
const AddressPicker = ({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'กรอกที่อยู่หรือเลือกบนแผนที่',
  className = '',
  required = false,
  /** รหัสประเทศ ISO (เช่น 'th') หรือ false = ไม่จำกัดประเทศ */
  restrictCountry = 'th',
  /**
   * undefined = จำกัดแบบที่อยู่ (address)
   * null = ไม่ใส่ types ใน Autocomplete (ค้นหาได้กว้าง เช่น สถานที่/POI)
   * array = ส่งตรงไปยัง Places API
   */
  placeTypes,
  inputClassName = '',
  showManualGeocodeButton = true,
}) => {
  const resolvedPlaceTypes = useMemo(
    () => (placeTypes === undefined ? DEFAULT_PLACE_TYPES : placeTypes),
    [placeTypes]
  );

  const [address, setAddress] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const apiKey = getGoogleMapsApiKey();
  const onChangeRef = useRef(onChange);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  useEffect(() => {
    setAddress(value);
  }, [value]);

  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API Key is not set. Please set VITE_GOOGLE_MAPS_API_KEY in .env file');
      return undefined;
    }

    loadGoogleMaps(apiKey, ['places'])
      .then(() => {
        setMapsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError('ไม่สามารถโหลด Google Maps ได้ กรุณาตรวจสอบ API Key');
      });

    return undefined;
  }, [apiKey]);

  useEffect(() => {
    if (!mapsLoaded || !apiKey) {
      return undefined;
    }

    let cancelled = false;
    let listener = null;

    const attach = () => {
      if (
        cancelled ||
        !inputRef.current ||
        !isGoogleMapsLoaded() ||
        !window.google?.maps?.places
      ) {
        return;
      }

      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      const options = {
        fields: ['formatted_address', 'geometry', 'place_id'],
      };
      if (restrictCountry) {
        options.componentRestrictions = { country: restrictCountry };
      }
      if (
        resolvedPlaceTypes != null &&
        Array.isArray(resolvedPlaceTypes) &&
        resolvedPlaceTypes.length > 0
      ) {
        options.types = resolvedPlaceTypes;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );
      autocompleteRef.current = autocomplete;

      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address,
            place_id: place.place_id,
          };

          setAddress(place.formatted_address);
          setError(null);

          if (onChangeRef.current) {
            onChangeRef.current(place.formatted_address);
          }

          if (onLocationSelectRef.current) {
            onLocationSelectRef.current(location);
          }
        }
      });
    };

    const rafId = requestAnimationFrame(() => attach());

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (listener) {
        window.google?.maps?.event?.removeListener(listener);
      }
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mapsLoaded, apiKey, restrictCountry, resolvedPlaceTypes]);

  const handleInputChange = (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setError(null);
    
    if (onChange) {
      onChange(newAddress);
    }
  };

  const handleManualGeocode = async () => {
    if (!address.trim() || !apiKey) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(address, apiKey);
      
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current({
          lat: result.lat,
          lng: result.lng,
          address: result.formatted_address,
          place_id: result.place_id,
        });
      }

      setAddress(result.formatted_address);
      if (onChangeRef.current) {
        onChangeRef.current(result.formatted_address);
      }
    } catch (err) {
      setError('ไม่พบที่อยู่ กรุณากรอกที่อยู่ให้ละเอียดมากขึ้น');
      console.error('Geocoding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`address-picker ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-300/80 ${
            error ? 'border-red-500' : ''
          } ${inputClassName}`.trim()}
          required={required}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {!apiKey && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium mb-1">
            ⚠️ Google Maps API Key ไม่ได้ตั้งค่า
          </p>
          <p className="text-xs text-yellow-700">
            การเลือกที่อยู่จาก Autocomplete อาจไม่ทำงาน กรุณาตั้งค่า VITE_GOOGLE_MAPS_API_KEY ในไฟล์ .env
          </p>
        </div>
      )}
      
      {apiKey && error && error.includes('Billing') && (
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
      
      {showManualGeocodeButton && address && !error && (
        <button
          type="button"
          onClick={handleManualGeocode}
          disabled={isLoading}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          {isLoading ? 'กำลังค้นหา...' : '🔍 ค้นหาพิกัดของที่อยู่นี้'}
        </button>
      )}
    </div>
  );
};

export default AddressPicker;

