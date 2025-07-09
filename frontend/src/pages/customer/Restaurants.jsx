import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const Restaurants = () => {

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { translate } = useLanguage();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/restaurants/');
      setRestaurants(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Unable to load restaurant list');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">{translate('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{translate('common.unable_to_load_restaurant_list')}</p>
          <button 
            onClick={fetchRestaurants}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            {translate('common.try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">{translate('common.restaurants')}</h1>
        <p className="text-secondary-600">{translate('common.choose_your_favorite_restaurant')}</p>
      </div>

      {/* Restaurants Grid */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.restaurant_id}
              className={`group bg-white rounded-xl shadow-md transition-all duration-300 overflow-hidden ${
                restaurant.status === 'open' 
                  ? 'hover:shadow-lg cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (restaurant.status === 'open') {
                  window.location.href = `/restaurants/${restaurant.restaurant_id}`;
                } else {
                  alert(translate('common.restaurant_is_closed'));
                }
              }}
            >
              <div className="relative h-48 bg-gray-200">
                {restaurant.image_display_url ? (
                  <img
                    src={restaurant.image_display_url}
                    alt={restaurant.restaurant_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${restaurant.image_display_url ? 'hidden' : ''}`}>
                  <div className="text-6xl opacity-30">🏪</div>
                </div>
                {restaurant.status === 'closed' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">{translate('common.closed')}</span>
                  </div>
                )}
                {restaurant.is_special && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      {translate('common.special')}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-secondary-800 mb-2 group-hover:text-primary-600">
                  {restaurant.restaurant_name}
                </h3>
                <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                  {restaurant.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-yellow-500">⭐</span>
                    <span className="ml-1 font-semibold">
                      {Number(restaurant.average_rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-secondary-500">
                    {restaurant.address ? `${restaurant.address.substring(0, 20)}...` : translate('common.address_not_specified')}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    restaurant.status === 'open' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.status === 'open' ? translate('common.open') : translate('common.closed')}
                  </span>
                  <span className="text-primary-500 font-semibold group-hover:text-primary-600">
                    {translate('common.view_menu')} →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">🏪</div>
          <h3 className="text-xl font-semibold text-secondary-700 mb-2">
            {translate('common.no_restaurant_found')}
          </h3>
          <p className="text-secondary-500">
            {translate('common.try_refreshing_the_page')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Restaurants; 