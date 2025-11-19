import React, { useState, useRef, useEffect } from 'react';
import { geocodeAddress, getGoogleMapsApiKey } from '../../utils/googleMaps';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

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
  required = false
}) => {
  const [address, setAddress] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    setAddress(value);
  }, [value]);

  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API Key is not set. Please set VITE_GOOGLE_MAPS_API_KEY in .env file');
      return;
    }

    // ใช้ shared loader เพื่อป้องกันการโหลดซ้ำ
    loadGoogleMaps(apiKey, ['places'])
      .then(() => {
        setMapsLoaded(true);
        initializeAutocomplete();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setError('ไม่สามารถโหลด Google Maps ได้ กรุณาตรวจสอบ API Key');
      });

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
      }
    };
  }, [apiKey]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !isGoogleMapsLoaded() || !window.google?.maps?.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'th' }, // จำกัดเฉพาะประเทศไทย
        fields: ['formatted_address', 'geometry', 'place_id'],
        types: ['address']
      }
    );

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();
      
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address,
          place_id: place.place_id
        };

        setAddress(place.formatted_address);
        setError(null);
        
        // Call onChange with address string
        if (onChange) {
          onChange(place.formatted_address);
        }
        
        // Call onLocationSelect with coordinates
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      }
    });
  };

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
      
      if (onLocationSelect) {
        onLocationSelect({
          lat: result.lat,
          lng: result.lng,
          address: result.formatted_address,
          place_id: result.place_id
        });
      }

      setAddress(result.formatted_address);
      if (onChange) {
        onChange(result.formatted_address);
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
          className={`w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            error ? 'border-red-500' : ''
          }`}
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
      
      {address && !error && (
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

