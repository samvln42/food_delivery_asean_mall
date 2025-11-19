/**
 * Google Maps Utility Functions
 * สำหรับ Geocoding และการทำงานกับ Google Maps API
 */

/**
 * Geocode address to coordinates using Google Maps Geocoding API
 * @param {string} address - ที่อยู่ที่ต้องการแปลงเป็น coordinates
 * @param {string} apiKey - Google Maps API Key
 * @returns {Promise<{lat: number, lng: number, formatted_address: string}>}
 */
export const geocodeAddress = async (address, apiKey) => {
  if (!address || !apiKey) {
    throw new Error('Address and API key are required');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id
      };
    } else {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} apiKey - Google Maps API Key
 * @returns {Promise<string>} - Formatted address
 */
export const reverseGeocode = async (lat, lng, apiKey) => {
  if (!lat || !lng || !apiKey) {
    throw new Error('Coordinates and API key are required');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Reverse geocoding failed: ${data.status} - ${data.error_message || 'API Key may not have Geocoding API enabled or billing is not enabled'}`);
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error(`Reverse geocoding failed: ${data.status} - Quota exceeded`);
    } else {
      throw new Error(`Reverse geocoding failed: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}`);
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * (Fallback if Google Distance Matrix API is not available)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get Google Maps API Key from environment variable
 * @returns {string} - API Key
 */
export const getGoogleMapsApiKey = () => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
};

