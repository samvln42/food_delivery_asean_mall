import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import { appSettingsService } from '../services/api';

const CustomerLayout = ({ children }) => {

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
                {appSettings?.app_description || 'สั่งอาหารออนไลน์ ส่งถึงบ้านคุณ ง่าย เร็ว อร่อย'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-secondary-300">
                <li><a href="/" className="hover:text-white">Home</a></li>
                <li><a href="/products" className="hover:text-white">Products</a></li>
                <li><a href="/restaurants" className="hover:text-white">Restaurants</a></li>
                <li><a href="/categories" className="hover:text-white">Categories</a></li>
                <li><a href="/about" className="hover:text-white">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-secondary-300">
                <li><a href="/help" className="hover:text-white">Help</a></li>
                <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Follow Us</h4>
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
