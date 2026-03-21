import React, { useState, useEffect, useRef } from 'react';
import { GrLocationPin } from 'react-icons/gr';
import { reverseGeocode, getGoogleMapsApiKey } from '../../utils/googleMaps';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

/**
 * MapPicker Component
 * Component สำหรับเลือกที่อยู่โดยคลิกบนแผนที่
 */
const MapPicker = ({ 
  initialCenter = { lat: 13.7563, lng: 100.5018 }, // กรุงเทพฯ
  onLocationSelect,
  zoom = 15,
  className = '',
  height = '400px'
}) => {
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(initialCenter);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef(null);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API Key is not set');
      return;
    }

    // ใช้ shared loader เพื่อป้องกันการโหลดซ้ำ
    loadGoogleMaps(apiKey, ['places'])
      .then(() => {
        setMapsLoaded(true);
        initializeMap();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setIsLoading(false);
      });
  }, [apiKey]);


  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded() || !window.google?.maps) {
      return;
    }

    try {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: currentLocation,
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });

      // อัพเดทตำแหน่งเมื่อแผนที่เลื่อนหรือซูม
      const updateCenterLocation = async () => {
        const center = googleMap.getCenter();
        if (center) {
          const newLocation = {
            lat: center.lat(),
            lng: center.lng()
          };
          await updateLocation(newLocation);
        }
      };

      googleMap.addListener('center_changed', updateCenterLocation);
      googleMap.addListener('dragend', updateCenterLocation);
      googleMap.addListener('zoom_changed', updateCenterLocation);

      setMap(googleMap);

      // Get initial address (ไม่ต้องรอ reverse geocode)
      const fallbackAddress = `ตำแหน่ง: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      
      // พยายาม reverse geocode แต่ไม่บล็อก UI
      updateLocation(currentLocation).catch(err => {
        console.warn('Initial reverse geocoding failed:', err);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
      // แสดงข้อความแจ้งเตือน
      if (error.message && error.message.includes('Billing')) {
        setAddress('⚠️ กรุณาเปิดใช้งาน Billing ใน Google Cloud Console');
      }
    }
  };

  const updateLocation = async (location) => {
    setCurrentLocation(location);
    setIsLoading(true);

    try {
      if (apiKey) {
        try {
          const addr = await reverseGeocode(location.lat, location.lng, apiKey);
          setAddress(addr);
          
          if (onLocationSelect) {
            onLocationSelect({
              lat: location.lat,
              lng: location.lng,
              address: addr
            });
          }
        } catch (geocodeError) {
          // ถ้า reverse geocode ไม่สำเร็จ ให้ใช้พิกัดแทน
          console.warn('Reverse geocoding failed, using coordinates:', geocodeError.message);
          const fallbackAddress = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
          setAddress(fallbackAddress);
          
          if (onLocationSelect) {
            onLocationSelect({
              lat: location.lat,
              lng: location.lng,
              address: fallbackAddress
            });
          }
        }
      } else {
        // ถ้าไม่มี API Key ให้ใช้พิกัด
        const fallbackAddress = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        setAddress(fallbackAddress);
        
        if (onLocationSelect) {
          onLocationSelect({
            lat: location.lat,
            lng: location.lng,
            address: fallbackAddress
          });
        }
      }
    } catch (error) {
      console.error('Error updating location:', error);
      const fallbackAddress = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      
      if (onLocationSelect) {
        onLocationSelect({
          lat: location.lat,
          lng: location.lng,
          address: fallbackAddress
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (map) {
            map.setCenter(location);
            // updateLocation จะถูกเรียกอัตโนมัติจาก center_changed event
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
        }
      );
    }
  };

  return (
    <div className={`map-picker ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
        >
          📍 ใช้ตำแหน่งปัจจุบัน
        </button>
        {isLoading && (
          <span className="text-sm text-secondary-600">กำลังโหลด...</span>
        )}
      </div>
      
      <div
        style={{ height: height }}
        className="w-full rounded-lg border border-secondary-300 overflow-hidden relative"
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
          <GrLocationPin size={40} color="#f97316" />
        </div>
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
      
      {address && (
        <div className="mt-2 p-2 bg-secondary-50 rounded text-sm">
          <strong>ที่อยู่:</strong> {address}
        </div>
      )}
      
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
          <p className="text-xs text-gray-600 mt-2">
            💡 ระบบยังสามารถใช้พิกัด (lat/lng) ได้แม้ไม่มีที่อยู่
          </p>
        </div>
      )}
    </div>
  );
};

export default MapPicker;

