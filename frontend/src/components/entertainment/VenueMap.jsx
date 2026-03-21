import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapPickerLeaflet from '../maps/MapPickerLeaflet';
import { useLanguage } from '../../contexts/LanguageContext';

// Fix z-index for Leaflet controls to prevent overlapping with other elements
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .leaflet-control-container {
      z-index: 1 !important;
    }
    .leaflet-top,
    .leaflet-bottom {
      z-index: 1 !important;
    }
    .leaflet-pane {
      z-index: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const VenueMap = ({ latitude, longitude, venueName, address, height = '300px' }) => {
  const { translate } = useLanguage();
  const [mapCenter, setMapCenter] = useState([13.7563, 100.5018]); // Default: Bangkok

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([parseFloat(latitude), parseFloat(longitude)]);
    }
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className="h-48 sm:h-64 bg-secondary-200 rounded-lg flex items-center justify-center">
        <p className="text-xs sm:text-sm text-secondary-500 px-4 text-center">
          {translate('entertainment.no_location') || 'ไม่มีข้อมูลตำแหน่ง'}
        </p>
      </div>
    );
  }

  const position = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <div style={{ height, position: 'relative', zIndex: 0 }} className="w-full rounded-lg overflow-hidden">
      <style>{`
        .leaflet-container {
          z-index: 0 !important;
        }
        .leaflet-control-container {
          z-index: 1 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1 !important;
        }
        .leaflet-pane {
          z-index: 0 !important;
        }
      `}</style>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="max-w-[200px] sm:max-w-none">
              <h3 className="font-semibold text-xs sm:text-sm mb-1">{venueName}</h3>
              {address && <p className="text-xs text-secondary-600 break-words">{address}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default VenueMap;
