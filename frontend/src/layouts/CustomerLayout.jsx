import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import CustomerWebSocketBridge from '../components/customer/CustomerWebSocketBridge';
import { appSettingsService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const CustomerLayout = ({ children }) => {
  const { translate } = useLanguage();

  const [appSettings, setAppSettings] = useState(null);

    // Fetch app settings
    useEffect(() => {
      const fetchAppSettings = async () => {
        try {
          const response = await appSettingsService.getPublic({ _t: new Date().getTime() });
          setAppSettings(response.data);
        } catch (error) {
          console.error('Error fetching app settings:', error);
        }
      };
      
      fetchAppSettings();
    }, []);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* WebSocket Bridge for real-time notifications */}
      <CustomerWebSocketBridge />
      
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <Header />
      </div>
      
      <main className="pt-16">
        {children}
      </main>
      <footer className="bg-secondary-800 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {appSettings?.logo_url ? (
                  <img
                    src={appSettings.logo_url}
                    alt={appSettings.app_name || 'FoodDelivery'}
                    className="h-10 w-auto"
                  />
                ) : (
                  <span className="text-2xl">🍕</span>
                )}
                {appSettings?.app_name || 'FoodDelivery'}
              </h3>
              <p className="text-secondary-300 text-sm">
                {appSettings?.app_description || 'Order food online, delivered to your home, easy, fast, delicious.'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">{translate('common.quick_links')}</h4>
              <ul className="space-y-2 text-sm text-secondary-300">
                <li><a href="/" className="hover:text-white">{translate('common.home')}</a></li>
                <li><a href="/products" className="hover:text-white">{translate('nav.all_products')}</a></li>
                <li><a href="/restaurants" className="hover:text-white">{translate('nav.restaurants')}</a></li>
                <li><a href="/categories" className="hover:text-white">{translate('nav.categories')}</a></li>
                <li><a href="/about" className="hover:text-white">{translate('common.about')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">{translate('about.services')}</h4>
              <ul className="space-y-2 text-sm text-secondary-300">
                <li><a href="/help" className="hover:text-white">{translate('common.help')}</a></li>
                <li><a href="/contact" className="hover:text-white">{translate('common.contact')}</a></li>
                <li><a href="/terms" className="hover:text-white">{translate('common.terms_of_service')}</a></li>
                <li><a href="/privacy" className="hover:text-white">{translate('common.privacy_policy')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">{translate('common.follow_us')}</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-secondary-300 hover:text-white">
                  📘 Facebook
                </a>
                <a href="#" className="text-secondary-300 hover:text-white">
                  📷 Instagram
                </a>
                <a href="#" className="text-secondary-300 hover:text-white">
                  🐦 Twitter
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-sm text-secondary-400">
            <p>&copy; 2025 FoodDelivery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
