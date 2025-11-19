import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '../../utils/nominatim';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * MapPickerLeaflet Component
 * Component สำหรับเลือกที่อยู่โดยคลิกบนแผนที่ (ใช้ OpenStreetMap + Leaflet)
 */
const MapClickHandler = ({ onLocationSelect, updateLocation }) => {
  useMapEvents({
    click: async (e) => {
      const location = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      await updateLocation(location);
    }
  });
  return null;
};

// Component สำหรับควบคุมแผนที่ (ซูมไปที่ตำแหน่งปัจจุบัน)
const MapController = ({ onZoomToCurrentLocation, updateLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (onZoomToCurrentLocation) {
      onZoomToCurrentLocation.current = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              map.setView([location.lat, location.lng], 17); // ซูมที่ระดับ 17
              if (updateLocation) {
                await updateLocation(location);
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              alert('ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง');
            }
          );
        } else {
          alert('เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงตำแหน่ง');
        }
      };
    }
  }, [map, onZoomToCurrentLocation, updateLocation]);

  return null;
};

const MapPickerLeaflet = ({ 
  initialCenter = { lat: 13.7563, lng: 100.5018 }, // กรุงเทพฯ
  onLocationSelect,
  zoom = 15,
  className = '',
  height = '400px'
}) => {
  const [currentLocation, setCurrentLocation] = useState(initialCenter);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(initialCenter);
  const zoomToCurrentLocationRef = useRef(null);

  useEffect(() => {
    // Get initial address
    updateLocation(initialCenter);
  }, []);

  // ซ่อน Leaflet attribution
  useEffect(() => {
    const hideAttribution = () => {
      const attributions = document.querySelectorAll('.leaflet-control-attribution');
      attributions.forEach((attr) => {
        attr.style.display = 'none';
      });
    };
    
    // ซ่อนทันที
    hideAttribution();
    
    // ใช้ MutationObserver เพื่อซ่อนเมื่อ DOM เปลี่ยนแปลง
    const observer = new MutationObserver(hideAttribution);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }, []);

  const updateLocation = async (location) => {
    setCurrentLocation(location);
    setMarkerPosition(location);
    setIsLoading(true);

    try {
      try {
        const addr = await reverseGeocode(location.lat, location.lng);
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

  return (
    <div className={`map-picker-leaflet ${className}`}>
      <style>{`
        .map-picker-leaflet .leaflet-control-attribution {
          display: none !important;
        }
        .map-picker-leaflet .leaflet-control-zoom {
          display: none !important;
        }
      `}</style>
      <div style={{ height: height }} className="w-full rounded-lg border border-secondary-300 overflow-hidden relative">
        <MapContainer
          center={[currentLocation.lat, currentLocation.lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          attributionControl={false}
          zoomControl={false}
        >
          <TileLayer
            attribution=""
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[markerPosition.lat, markerPosition.lng]}
            draggable={true}
            eventHandlers={{
              dragend: async (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                const location = {
                  lat: position.lat,
                  lng: position.lng
                };
                await updateLocation(location);
              }
            }}
          />
          <MapClickHandler onLocationSelect={onLocationSelect} updateLocation={updateLocation} />
          <MapController onZoomToCurrentLocation={zoomToCurrentLocationRef} updateLocation={updateLocation} />
        </MapContainer>
        {/* ปุ่มซูมไปที่ตำแหน่งปัจจุบัน (แบบกลมเหมือน Google Maps) */}
        <button
          type="button"
          onClick={() => {
            if (zoomToCurrentLocationRef.current) {
              zoomToCurrentLocationRef.current();
            }
          }}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors flex items-center justify-center z-[1000] border border-gray-300"
          title="ซูมไปที่ตำแหน่งปัจจุบัน"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-gray-700"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MapPickerLeaflet;

