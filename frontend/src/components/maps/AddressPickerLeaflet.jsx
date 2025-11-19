import React, { useState, useEffect, useRef } from 'react';
import { searchAddresses, geocodeAddress } from '../../utils/nominatim';

/**
 * AddressPickerLeaflet Component
 * Component สำหรับเลือกที่อยู่โดยใช้ Nominatim Autocomplete (OpenStreetMap)
 */
const AddressPickerLeaflet = ({ 
  value = '', 
  onChange, 
  onLocationSelect,
  placeholder = '17.970487295893, 102.568316459656',
  className = '',
  required = false,
  readOnly = false
}) => {
  const [address, setAddress] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setAddress(value);
  }, [value]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    if (readOnly) {
      return;
    }
    const newValue = e.target.value;
    setAddress(newValue);
    setError(null);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange(newValue);
    }

    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await searchAddresses(newValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Search error:', err);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    setAddress(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onChange) {
      onChange(suggestion.address);
    }

    if (onLocationSelect) {
      onLocationSelect({
        lat: suggestion.lat,
        lng: suggestion.lng,
        address: suggestion.address,
        place_id: suggestion.place_id
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleManualGeocode = async () => {
    if (!address || address.trim() === '') {
      setError('กรุณากรอกที่อยู่');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(address);
      setAddress(result.address);
      
      if (onChange) {
        onChange(result.address);
      }

      if (onLocationSelect) {
        onLocationSelect({
          lat: result.lat,
          lng: result.lng,
          address: result.address,
          place_id: result.place_id
        });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('ไม่พบที่อยู่นี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`address-picker-leaflet ${className}`}>
      {readOnly ? (
        <div className="w-full px-4 py-2 border border-secondary-300 rounded-lg bg-secondary-50 text-secondary-700">
          {address || placeholder}
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className={`w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              error ? 'border-red-500' : ''
            }`}
            required={required}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-primary-50 ${
                index === selectedIndex ? 'bg-primary-100' : ''
              } ${index !== suggestions.length - 1 ? 'border-b border-secondary-200' : ''}`}
            >
              <div className="text-sm">{suggestion.address}</div>
            </button>
          ))}
        </div>
      )}
      
    </div>
  );
};

export default AddressPickerLeaflet;

