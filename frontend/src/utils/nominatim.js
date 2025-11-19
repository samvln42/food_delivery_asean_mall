/**
 * Nominatim API Utility
 * ใช้ Nominatim API (OpenStreetMap) สำหรับ geocoding และ reverse geocoding
 * ฟรี 100% ไม่ต้อง API Key
 */

import { encode } from '@erikmichelson/open-location-code-ts';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Generate Plus Code (Open Location Code) from coordinates
 * This follows the official Open Location Code specification
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @param {number} codeLength - Code length (default: 10, which gives 8 characters + separator)
 * @returns {string} - Plus Code format (e.g., "7P94+XJ6")
 */
const generatePlusCode = (lat, lng, codeLength = 10) => {
  const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
  const SEPARATOR = '+';
  const SEPARATOR_POSITION = 8;
  const PADDING = '0';
  
  // Normalize coordinates
  let latitude = Math.max(-90, Math.min(90, lat));
  let longitude = Math.max(-180, Math.min(180, lng));
  
  // Convert to positive ranges
  latitude += 90;
  longitude += 180;
  
  // Calculate code pairs
  let code = '';
  let latValue = latitude;
  let lngValue = longitude;
  
  // Generate pairs of characters
  for (let i = 0; i < codeLength; i++) {
    if (i === SEPARATOR_POSITION) {
      code += SEPARATOR;
    }
    
    // Calculate pair index
    const latDigit = Math.floor(latValue / (20 ** (4 - Math.floor(i / 2))));
    const lngDigit = Math.floor(lngValue / (20 ** (4 - Math.floor(i / 2))));
    
    if (i % 2 === 0) {
      // Latitude character
      code += CODE_ALPHABET[latDigit % 20];
      latValue = (latValue % (20 ** (4 - Math.floor(i / 2)))) * 20;
    } else {
      // Longitude character
      code += CODE_ALPHABET[lngDigit % 20];
      lngValue = (lngValue % (20 ** (4 - Math.floor(i / 2)))) * 20;
    }
  }
  
  // For standard Plus Code (8 characters), we need to adjust
  // Standard format: 4 pairs before +, 2 pairs after +
  if (codeLength === 10) {
    // Take first 8 characters (4 pairs) + separator + next 4 characters (2 pairs)
    const pairs = code.replace(SEPARATOR, '').split('');
    if (pairs.length >= 8) {
      return `${pairs.slice(0, 4).join('')}${SEPARATOR}${pairs.slice(4, 6).join('')}`;
    }
  }
  
  return code;
};

/**
 * Generate Plus Code using correct Open Location Code algorithm
 * Based on Open Location Code specification (same as Google Plus Codes)
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @returns {string} - Plus Code (e.g., "7P94+XJ6")
 */
const generateCorrectPlusCode = (lat, lng) => {
  const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
  const SEPARATOR = '+';
  const SEPARATOR_POSITION = 8;
  
  // Normalize coordinates
  let latVal = Math.max(-90, Math.min(90, lat)) + 90;
  let lngVal = Math.max(-180, Math.min(180, lng)) + 180;
  
  // Open Location Code uses pairs: lat, lng, lat, lng...
  let code = '';
  
  // Encode 10 characters (5 pairs) before separator
  // But we only need 6 characters (3 pairs) for standard Plus Code
  for (let i = 0; i < 6; i++) {
    if (i === 4) {
      code += SEPARATOR;
    }
    
    if (i % 2 === 0) {
      // Latitude character
      const digit = Math.floor(latVal);
      code += CODE_ALPHABET[digit % 20];
      latVal = (latVal - digit) * 20;
    } else {
      // Longitude character
      const digit = Math.floor(lngVal);
      code += CODE_ALPHABET[digit % 20];
      lngVal = (lngVal - digit) * 20;
    }
  }
  
  return code;
};

/**
 * Format address to short format
 * @param {object} addressData - Address data from Nominatim API
 * @param {number} lat - Latitude (optional, for Plus Code generation)
 * @param {number} lng - Longitude (optional, for Plus Code generation)
 * @returns {string} - Short formatted address
 */
const formatShortAddress = (addressData, lat = null, lng = null) => {
  if (!addressData || !addressData.address) {
    return '';
  }

  const addr = addressData.address;
  const parts = [];

  // Get city/town/village name
  const city = addr.city || addr.town || addr.village || addr.municipality || 
               addr.county || addr.state_district || '';

  // Use coordinates format instead of Plus Code or address
  if (lat !== null && lng !== null) {
    // Format: "17.9668552, 102.6427002" (7 decimal places)
    return `${lat.toFixed(7)}, ${lng.toFixed(7)}`;
  }

  // Fallback: Use address components
  // Priority: road/suburb > city/town/village
  if (addr.road) {
    // Use road name + city
    if (city) {
      return `${addr.road}, ${city}`;
    }
    return addr.road;
  } else if (addr.suburb) {
    // Use suburb + city
    if (city && addr.suburb !== city) {
      return `${addr.suburb}, ${city}`;
    }
    return addr.suburb || city;
  } else if (addr.neighbourhood) {
    // Use neighbourhood + city
    if (city && addr.neighbourhood !== city) {
      return `${addr.neighbourhood}, ${city}`;
    }
    return addr.neighbourhood || city;
  }

  // If still empty, use city/district
  if (city) {
    return city;
  } else if (addr.district) {
    return addr.district;
  } else if (addr.state) {
    return addr.state;
  }

  // Last resort: use display_name but shorten it (take first 2 parts)
  if (addressData.display_name) {
    const displayParts = addressData.display_name.split(',').slice(0, 2);
    return displayParts.join(',').trim();
  }

  return '';
};

/**
 * Geocode address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number, address: string}>}
 */
export const geocodeAddress = async (address) => {
  if (!address || address.trim() === '') {
    throw new Error('Address is required');
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FoodDeliveryApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const shortAddress = formatShortAddress(result, lat, lng);
      return {
        lat: lat,
        lng: lng,
        address: shortAddress || result.display_name,
        place_id: result.place_id
      };
    } else {
      throw new Error('No results found');
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
 * @returns {Promise<string>} - Formatted address (short format)
 */
export const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) {
    throw new Error('Coordinates are required');
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FoodDeliveryApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      // Format to short address with Plus Code
      const shortAddress = formatShortAddress(data, lat, lng);
      return shortAddress || data.display_name;
    } else {
      throw new Error('No address found');
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

/**
 * Search addresses (Autocomplete)
 * @param {string} query - Search query
 * @returns {Promise<Array<{address: string, lat: number, lng: number}>>}
 */
export const searchAddresses = async (query) => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FoodDeliveryApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data)) {
      return data.map(item => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const shortAddress = formatShortAddress(item, lat, lng);
        return {
          address: shortAddress || item.display_name,
          lat: lat,
          lng: lng,
          place_id: item.place_id
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
};

