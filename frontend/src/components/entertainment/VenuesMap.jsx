import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';
import { getGoogleMapsApiKey } from '../../utils/googleMaps';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslatedName } from '../../utils/translationHelpers';
import { FaCrosshairs } from 'react-icons/fa';


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

const VenuesMap = ({
  places,
  venues,
  height = 'calc(100vh - 140px)',
  onPlaceClick,
  onVenueClick,
  userCoords,
  locationCity,
  onUserCoordsChange,
  searchQuery,
}) => {
  
  const {translate, currentLanguage } = useLanguage();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const myLocMarkerRef = useRef(null); // แยก My Location dot ออกจาก marker array หลัก
  const customMarkerClickedRef = useRef(false); // flag: click มาจาก custom marker ของเรา
  const apiKey = getGoogleMapsApiKey();
  // ref เพื่อให้ map init effect เข้าถึง userCoords ล่าสุดเสมอ (ไม่มีปัญหา stale closure)
  const userCoordsRef = useRef(userCoords);
  useEffect(() => { userCoordsRef.current = userCoords; }, [userCoords]);

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

  // My Location dot — แยก effect เพื่อไม่ให้ trigger marker/InfoWindow recreation
  useEffect(() => {
    if (!mapsLoaded || !map || !window.google?.maps) return;
    const google = window.google;
    const HtmlMarker = buildHtmlMarkerClass(google);

    // ลบ dot เก่า
    if (myLocMarkerRef.current?.setMap) myLocMarkerRef.current.setMap(null);
    myLocMarkerRef.current = null;

    if (!userCoords) return;
    const myLocEl = document.createElement('div');
    myLocEl.style.cssText =
      'position:absolute;width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,.35),0 2px 8px rgba(0,0,0,.25);transform:translate(-50%,-50%);pointer-events:none;';
    myLocMarkerRef.current = new HtmlMarker(
      new google.maps.LatLng(userCoords.lat, userCoords.lng),
      map,
      myLocEl
    );
    return () => {
      if (myLocMarkerRef.current?.setMap) myLocMarkerRef.current.setMap(null);
      myLocMarkerRef.current = null;
    };
  }, [mapsLoaded, map, userCoords]);

  // Venue/restaurant markers — ไม่มี userCoords ใน deps เพื่อไม่ให้ InfoWindow ถูกปิดเมื่อ GPS อัปเดต
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
      // ถ้า userCoords ถูก set แล้ว ให้ pan effect จัดการ (ไม่ override)
      if (!userCoordsRef.current) {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(DEFAULT_ZOOM);
      }
      return;
    }

    itemsWithCoords.forEach((place) => {
      const isRestaurant = place.type === 'restaurant';
      const name = isRestaurant
        ? place.restaurant_name || ''
        : getTranslatedName(place, currentLanguage, place.venue_name || '');
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
          ${translate('common.view_details') || 'ดูรายละเอียด →'}
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
        customMarkerClickedRef.current = true; // บอก map click listener ว่า click นี้มาจาก marker ของเรา
        openInfo();
      });

      infoWindowsRef.current.push(infoWindow);
    });

    // ดัก map click: ถ้า click มาจาก custom marker → หยุด Google POI popup
    // ถ้าเป็น click บน Google Maps POI ทั่วไป → ปล่อยให้ Google แสดง popup ปกติ
    const mapClickListener = google.maps.event.addListener(map, 'click', (e) => {
      if (customMarkerClickedRef.current) {
        customMarkerClickedRef.current = false;
        e.stop(); // กัน Google จากการเปิด POI popup
      }
    });

    // ถ้า user เลือกเมืองเฉพาะ → fitBounds ไปยัง marker ในเมืองนั้น (ไม่ lock ที่ userCoords)
    // ถ้าไม่ได้เลือกเมือง → pan/zoom จัดการใน userCoords effect แยกต่างหาก
    if (locationCity) {
      if (itemsWithCoords.length > 1) {
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
        google.maps.event.addListenerOnce(map, 'idle', () => {
          if (map.getZoom() < 11) map.setZoom(11);
        });
      } else if (itemsWithCoords.length === 1) {
        map.setCenter({
          lat: parseFloat(itemsWithCoords[0].latitude),
          lng: parseFloat(itemsWithCoords[0].longitude),
        });
        map.setZoom(15);
      }
    } else if (!userCoordsRef.current) {
      if (itemsWithCoords.length > 1) {
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
        google.maps.event.addListenerOnce(map, 'idle', () => {
          if (map.getZoom() < 11) map.setZoom(11);
        });
      } else if (itemsWithCoords.length === 1) {
        map.setCenter({
          lat: parseFloat(itemsWithCoords[0].latitude),
          lng: parseFloat(itemsWithCoords[0].longitude),
        });
        map.setZoom(15);
      }
    }

    return () => {
      google.maps.event.removeListener(mapClickListener);
      markersRef.current.forEach((m) => {
        if (m?.setMap) m.setMap(null);
      });
      markersRef.current = [];
      infoWindowsRef.current.forEach((iw) => iw?.close());
      infoWindowsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, map, itemsWithCoords, locationCity, currentLanguage]);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !isGoogleMapsLoaded() || !window.google?.maps) return;

    const initCoords = userCoordsRef.current;
    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: initCoords
        ? { lat: initCoords.lat, lng: initCoords.lng }
        : DEFAULT_CENTER,
      zoom: initCoords ? 14 : DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    });
    setMap(googleMap);
  }, [mapsLoaded]);

  // Pan & zoom ไปยังตำแหน่งปัจจุบันเมื่อมี GPS (ยังไม่ได้เลือกเมืองเฉพาะ)
  // ถ้าเลือกเมืองแล้ว — อย่า pan กลับ GPS เพราะจะทับการ fitBounds ของ marker หลังเปลี่ยนประเภท
  useEffect(() => {
    if (!map || !userCoords) return;
    if (locationCity) return;
    const t = setTimeout(() => {
      map.panTo({ lat: userCoords.lat, lng: userCoords.lng });
      map.setZoom(14);
    }, 100);
    return () => clearTimeout(t);
  }, [map, userCoords, locationCity]);

  // เมื่อค้นหาด้วยชื่อ ให้เลื่อนไปยังผลลัพธ์ตัวแรกที่มีพิกัด
  useEffect(() => {
    const q = (searchQuery || '').trim();
    if (!map || !q || itemsWithCoords.length === 0) return;
    const first = itemsWithCoords[0];
    map.panTo({
      lat: parseFloat(first.latitude),
      lng: parseFloat(first.longitude),
    });
    map.setZoom(16);
  }, [map, itemsWithCoords, searchQuery]);

  const recenterToCurrentLocation = () => {
    if (!map || typeof navigator === 'undefined' || !navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.panTo(nextCoords);
        map.setZoom(14);
        if (typeof onUserCoordsChange === 'function') onUserCoordsChange(nextCoords);
        setLocating(false);
      },
      () => {
        if (userCoords) {
          map.panTo({ lat: userCoords.lat, lng: userCoords.lng });
          map.setZoom(14);
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

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
      <button
        type="button"
        onClick={recenterToCurrentLocation}
        disabled={locating}
        className="absolute z-[1200] inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/95 p-2.5 text-gray-700 shadow-lg backdrop-blur hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          right: '13px',
          bottom: 'max(12rem, calc(env(safe-area-inset-bottom) + 1.25rem))'
        }}
        title="กลับไปตำแหน่งปัจจุบัน"
      >
        <FaCrosshairs className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
};

export default VenuesMap;
