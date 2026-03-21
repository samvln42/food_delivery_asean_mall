import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { BiCurrentLocation } from "react-icons/bi";
import { GrLocationPin } from "react-icons/gr";
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
const MapCenterHandler = ({ updateLocation, commit = true }) => {
  const map = useMap();
  const lastCenterKeyRef = useRef('');
  
  useEffect(() => {
    const updateCenterLocation = async () => {
      const center = map.getCenter();
      const centerKey = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
      if (lastCenterKeyRef.current === centerKey) {
        return;
      }
      lastCenterKeyRef.current = centerKey;
      await updateLocation({
        lat: center.lat,
        lng: center.lng
      }, { commit });
    };

    // อัพเดทเมื่อแผนที่เลื่อนหรือซูม
    map.on('moveend', updateCenterLocation);
    updateCenterLocation();

    return () => {
      map.off('moveend', updateCenterLocation);
    };
  }, [map, updateLocation, commit]);

  return null;
};

// ลงทะเบียนฟังก์ชัน confirm ตำแหน่งปัจจุบัน (ให้ parent เรียกได้)
const ConfirmLocationHandler = ({ updateLocation, confirmRef }) => {
  const map = useMap();
  useEffect(() => {
    confirmRef.current = () => {
      const center = map.getCenter();
      const loc = { lat: center.lat, lng: center.lng };
      // commit ทันที (ไม่ await reverse geocode) เพื่อให้ค่าจัดส่งอัปเดตไว
      updateLocation(loc, { commit: true, awaitGeocode: false });
      return loc;
    };
    return () => { confirmRef.current = null; };
  }, [map, updateLocation, confirmRef]);
  return null;
};

// Component สำหรับควบคุมแผนที่ (ซูมไปที่ตำแหน่งปัจจุบัน)
const MapController = ({ onZoomToCurrentLocation, updateLocation, commit = true }) => {
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
                await updateLocation(location, { commit });
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
  }, [map, onZoomToCurrentLocation, updateLocation, commit]);

  return null;
};

const MapPickerLeaflet = forwardRef(({ 
  initialCenter = { lat: 13.7563, lng: 100.5018 }, // กรุงเทพฯ
  onLocationSelect,
  deferSelection = false,
  zoom = 15,
  className = '',
  height = '400px'
}, ref) => {
  const [currentLocation, setCurrentLocation] = useState(initialCenter);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const zoomToCurrentLocationRef = useRef(null);
  const confirmLocationRef = useRef(null);

  useImperativeHandle(ref, () => ({
    confirmCurrentLocation: async () => {
      if (confirmLocationRef.current) {
        return await confirmLocationRef.current();
      }
    }
  }), []);

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

  const updateLocation = useCallback(async (location, options = {}) => {
    const {
      commit: commitOverride,
      awaitGeocode = true,
    } = options;

    const shouldCommit = typeof commitOverride === 'boolean'
      ? commitOverride
      : !deferSelection;

    setCurrentLocation(location);
    const fallbackAddr = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;

    // โหมด deferSelection: ยังไม่ commit ตำแหน่งจริงจนกดปุ่ม "เลือกตำแหน่งนี้"
    if (!shouldCommit) {
      setAddress(fallbackAddr);
      return;
    }

    // commit: ส่ง lat/lng ทันที เพื่อให้ค่าจัดส่งเริ่มคำนวณได้เร็วขึ้น (ไม่รอ reverse geocode)
    if (onLocationSelect) {
      onLocationSelect({
        lat: location.lat,
        lng: location.lng,
        address: fallbackAddr
      });
    }

    const doGeocode = async () => {
      setIsLoading(true);
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
        console.warn('Reverse geocoding failed, using coordinates:', geocodeError.message);
        setAddress(fallbackAddr);
        if (onLocationSelect) {
          onLocationSelect({
            lat: location.lat,
            lng: location.lng,
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
      // fire-and-forget (ให้ปุ่ม confirm ทำงานไว)
      void doGeocode();
    }
  }, [onLocationSelect, deferSelection]);

  return (
    <div className={`map-picker-leaflet ${className}`}>
      <style>{`
        .map-picker-leaflet .leaflet-control-attribution {
          display: none !important;
        }
        .map-picker-leaflet .leaflet-control-zoom {
          display: none !important;
        }
        .map-picker-leaflet .custom-pin-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 6px rgba(249, 115, 22, 0.35));
        }
        .map-picker-leaflet .custom-pin-icon .map-pin-svg {
          width: 36px;
          height: 36px;
        }
        .map-picker-leaflet .fixed-center-pin {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1000;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 6px rgba(249, 115, 22, 0.35));
        }
        .map-picker-leaflet .fixed-center-pin svg {
          width: 36px;
          height: 36px;
        }
      `}</style>
      <div style={{ height: height }} className="w-full rounded-lg border border-secondary-300 overflow-hidden relative">
        {/* Fixed center pin */}
        <div className="fixed-center-pin">
          <GrLocationPin size={36} color="#f97316" />
        </div>
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
          <MapCenterHandler updateLocation={updateLocation} commit={!deferSelection} />
          <ConfirmLocationHandler updateLocation={updateLocation} confirmRef={confirmLocationRef} />
          <MapController onZoomToCurrentLocation={zoomToCurrentLocationRef} updateLocation={updateLocation} commit={!deferSelection} />
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
          title="Zoom to current location"
        >
          <BiCurrentLocation className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
});

MapPickerLeaflet.displayName = 'MapPickerLeaflet';

export default MapPickerLeaflet;

