import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { getGoogleMapsApiKey } from '../../utils/googleMaps';

const VenueMap = ({ latitude, longitude, venueName, address, height = '300px' }) => {
  const { translate } = useLanguage();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API Key is not set');
      return;
    }

    loadGoogleMaps(apiKey, ['marker'])
      .then(() => {
        setMapsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
      });
  }, [apiKey]);

  useEffect(() => {
    if (mapsLoaded && mapRef.current && latitude && longitude && !map) {
      initializeMap();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, latitude, longitude, map]);

  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded() || !window.google?.maps) {
      return;
    }

    const position = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude)
    };

    try {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

      const marker = new window.google.maps.Marker({
        position: position,
        map: googleMap,
        title: venueName
      });

      if (venueName || address) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px; padding: 4px;">
              <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${venueName || ''}</h3>
              ${address ? `<p style="font-size: 12px; color: #666; word-break: break-word;">${address}</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMap, marker);
        });
      }

      setMap(googleMap);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  if (!latitude || !longitude) {
    return (
      <div className="h-48 sm:h-64 bg-secondary-200 rounded-lg flex items-center justify-center">
        <p className="text-xs sm:text-sm text-secondary-500 px-4 text-center">
          {translate('entertainment.no_location') || 'ไม่มีข้อมูลตำแหน่ง'}
        </p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="h-48 sm:h-64 bg-secondary-200 rounded-lg flex items-center justify-center">
        <p className="text-xs sm:text-sm text-yellow-600 px-4 text-center">
          ⚠️ Google Maps API Key ไม่ได้ตั้งค่า
        </p>
      </div>
    );
  }

  return (
    <div style={{ height, position: 'relative', zIndex: 0 }} className="w-full rounded-lg overflow-hidden">
      <style>{`
        .venue-map .gm-style-cc,
        .venue-map .gmnoprint:not(.gm-bundled-control) {
          display: none !important;
        }
      `}</style>
      <div 
        ref={mapRef}
        className="venue-map"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default VenueMap;
