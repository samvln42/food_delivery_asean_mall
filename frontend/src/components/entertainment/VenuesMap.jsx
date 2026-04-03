import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { getGoogleMapsApiKey } from '../../utils/googleMaps';

const DEFAULT_CENTER = { lat: 17.9757, lng: 102.6331 }; // Vientiane, Laos
const DEFAULT_ZOOM = 14;

const PLACEHOLDER_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#e5e7eb"/><text x="20" y="26" text-anchor="middle" font-size="16" fill="#6b7280">📍</text></svg>`
  );

/**
 * Custom HTML marker on map (รูป + ชื่อข้างๆ แทนพินสีแดง)
 */
function createHtmlMarkerElement(place, name) {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:absolute;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;z-index:1;';

  const inner = document.createElement('div');
  inner.style.cssText =
    'display:flex;align-items:center;gap:8px;background:#fff;padding:4px 10px 4px 4px;border-radius:9999px;box-shadow:0 2px 10px rgba(0,0,0,.18);border:1px solid #e5e7eb;max-width:min(240px,calc(100vw - 48px));';

  const img = document.createElement('img');
  img.width = 40;
  img.height = 40;
  img.style.cssText =
    'width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#f3f4f6;display:block;';
  img.alt = name || '';
  img.referrerPolicy = 'no-referrer';
  if (place.image_display_url) {
    img.src = place.image_display_url;
    img.onerror = () => {
      img.src = PLACEHOLDER_SVG;
    };
  } else {
    img.src = PLACEHOLDER_SVG;
  }

  const text = document.createElement('span');
  const displayName = name && name.length > 26 ? `${name.slice(0, 26)}…` : name || '—';
  text.textContent = displayName;
  text.style.cssText =
    'font-size:12px;font-weight:600;color:#111827;line-height:1.25;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

  inner.appendChild(img);
  inner.appendChild(text);
  wrap.appendChild(inner);

  // หางเล็กๆ ชี้ลงพิกัด
  const tail = document.createElement('div');
  tail.style.cssText =
    'position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #fff;filter:drop-shadow(0 1px 1px rgba(0,0,0,.12));';
  wrap.appendChild(tail);

  return wrap;
}

function buildHtmlMarkerClass(google) {
  return class HtmlMarker extends google.maps.OverlayView {
    constructor(latLng, map, dom) {
      super();
      this.latLng = latLng;
      this.dom = dom;
      this.map = map;
      this.setMap(map);
    }

    onAdd() {
      const panes = this.getPanes();
      if (!panes) return;
      panes.overlayMouseTarget.appendChild(this.dom);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection || !this.dom) return;
      const point = projection.fromLatLngToDivPixel(this.latLng);
      if (!point) return;
      this.dom.style.left = `${point.x}px`;
      this.dom.style.top = `${point.y}px`;
    }

    onRemove() {
      if (this.dom?.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
    }
  };
}

const VenuesMap = ({ places, venues, height = 'calc(100vh - 140px)', onPlaceClick, onVenueClick }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const apiKey = getGoogleMapsApiKey();

  const items = useMemo(() => {
    if (Array.isArray(places) && places.length > 0) return places;
    return venues || [];
  }, [places, venues]);

  const itemsWithCoords = useMemo(
    () => items.filter((p) => p.latitude && p.longitude),
    [items]
  );

  const handleClick = onPlaceClick || onVenueClick;
  const handleClickRef = useRef(handleClick);
  handleClickRef.current = handleClick;

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey, ['marker'])
      .then(() => setMapsLoaded(true))
      .catch((err) => console.error('Failed to load Google Maps:', err));
  }, [apiKey]);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !window.google?.maps || !map) return;

    const google = window.google;
    const bounds = new google.maps.LatLngBounds();
    const HtmlMarker = buildHtmlMarkerClass(google);

    markersRef.current.forEach((m) => {
      if (m?.setMap) m.setMap(null);
    });
    markersRef.current = [];
    infoWindowsRef.current.forEach((iw) => iw?.close());
    infoWindowsRef.current = [];

    if (itemsWithCoords.length === 0) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    itemsWithCoords.forEach((place) => {
      const isRestaurant = place.type === 'restaurant';
      const name = isRestaurant ? place.restaurant_name || '' : place.venue_name || '';
      const pos = {
        lat: parseFloat(place.latitude),
        lng: parseFloat(place.longitude),
      };
      bounds.extend(pos);

      const latLng = new google.maps.LatLng(pos.lat, pos.lng);
      const dom = createHtmlMarkerElement(place, name);

      const htmlMarker = new HtmlMarker(latLng, map, dom);
      markersRef.current.push(htmlMarker);

      const div = document.createElement('div');
      div.style.cssText = 'min-width: 200px; max-width: 280px; padding: 8px; font-family: system-ui;';
      const detailUrl = isRestaurant ? `/restaurants/${place.restaurant_id}` : `/entertainment-venues/${place.venue_id}`;
      div.innerHTML = `
        ${place.image_display_url ? `
          <img src="${place.image_display_url.replace(/"/g, '&quot;')}" alt="${(name || '').replace(/"/g, '&quot;')}" 
               style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
        ` : ''}
        <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">${(name || '').replace(/</g, '&lt;')}</h3>
        ${place.address ? `<p style="font-size: 12px; color: #666; margin: 0 0 8px 0; line-height: 1.3;">${(place.address || '').replace(/</g, '&lt;')}</p>` : ''}
        <a href="${detailUrl}" class="place-detail-link"
           style="display: inline-block; background: #2563eb; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: 500;">
          ดูรายละเอียด →
        </a>
      `;

      const infoWindow = new google.maps.InfoWindow({ content: div });

      google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const link = div.querySelector('.place-detail-link');
        if (link && handleClickRef.current) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            handleClickRef.current(place);
          });
        }
      });

      const openInfo = () => {
        infoWindowsRef.current.forEach((iw) => iw.close());
        infoWindow.setPosition(latLng);
        infoWindow.open(map);
      };

      dom.addEventListener('click', (e) => {
        e.stopPropagation();
        openInfo();
      });

      infoWindowsRef.current.push(infoWindow);
    });

    if (itemsWithCoords.length > 1) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    } else if (itemsWithCoords.length === 1) {
      map.setCenter({
        lat: parseFloat(itemsWithCoords[0].latitude),
        lng: parseFloat(itemsWithCoords[0].longitude),
      });
      map.setZoom(16);
    }

    return () => {
      markersRef.current.forEach((m) => {
        if (m?.setMap) m.setMap(null);
      });
      markersRef.current = [];
      infoWindowsRef.current.forEach((iw) => iw?.close());
      infoWindowsRef.current = [];
    };
  }, [mapsLoaded, map, itemsWithCoords]);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !isGoogleMapsLoaded() || !window.google?.maps) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    });
    setMap(googleMap);
  }, [mapsLoaded]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <p className="text-amber-600 px-4 text-center text-sm">⚠️ Google Maps API Key ไม่ได้ตั้งค่า</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ height, position: 'relative', zIndex: 0 }}>
      <style>{`
        .venues-map-container .gm-style-cc,
        .venues-map-container .gmnoprint:not(.gm-bundled-control) { display: none !important; }
      `}</style>
      <div
        ref={mapRef}
        className="venues-map-container"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default VenuesMap;
