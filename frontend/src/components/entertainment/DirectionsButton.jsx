import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FaCompass } from 'react-icons/fa';

const DirectionsButton = ({ latitude, longitude, venueName }) => {
  const { translate } = useLanguage();

  const openDirections = () => {
    if (!latitude || !longitude) {
      alert(translate('entertainment.no_location') || 'ไม่มีข้อมูลตำแหน่ง');
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(userAgent);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isIOS) {
      // Open Apple Maps on iOS
      window.open(`http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`);
    } else if (isAndroid) {
      // Open Google Maps on Android
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    } else {
      // Default to Google Maps for desktop/other devices
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  };

  return (
    <button
      onClick={openDirections}
      className="w-full sm:w-auto bg-primary-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
    >
      <FaCompass className="w-4 h-4 sm:w-5 sm:h-5" />
      <span>{translate('entertainment.get_directions') || 'ไปทางไหน'}</span>
    </button>
  );
};

export default DirectionsButton;
