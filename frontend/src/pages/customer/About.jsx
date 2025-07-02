import React, { useState, useEffect } from 'react';
import { appSettingsService } from '../../services/api';

const About = () => {
  const [contactInfo, setContactInfo] = useState({
    contact_email: 'support@fooddelivery.com',
    contact_phone: '02-xxx-xxxx',
    app_name: 'Food Delivery'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const response = await appSettingsService.getPublic();
      
      if (response.data) {
        setContactInfo({
          contact_email: response.data.contact_email || 'support@fooddelivery.com',
          contact_phone: response.data.contact_phone || '02-xxx-xxxx',
          app_name: response.data.app_name || 'Food Delivery'
        });
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      // ใช้ข้อมูล default หากโหลดไม่ได้
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-800 mb-6">About Us</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Our Mission</h2>
              <p className="text-secondary-600 mb-4">
                We are a leading online food ordering platform that connects customers with high-quality restaurants to enjoy delicious food from their favorite places
              </p>
              <p className="text-secondary-600">
                With advanced technology and friendly service, we will provide a food ordering experience that is convenient, fast, and satisfying for you
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Our Popularity</h2>
              <ul className="space-y-2 text-secondary-600">
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  Best food quality
                </li>
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  Fast
                </li>
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  Safe delivery
                </li>
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  Local restaurant support
                </li>
              </ul>
            </div>
          </div>

          {/* วิสัยทัศน์ */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Vision</h2>
            <p className="text-secondary-600">
              We are a leading online food ordering platform that connects customers with high-quality restaurants to enjoy delicious food from their favorite places
            </p>
          </div>

          {/* จุดเด่นของบริการ */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-secondary-200 rounded-lg">
                <div className="text-3xl mb-2">🚚</div>
                <h3 className="font-semibold text-secondary-700 mb-2">Fast</h3>
                <p className="text-sm text-secondary-600">Deliver food to your hand within 30-45 minutes</p>
              </div>
              <div className="text-center p-4 border border-secondary-200 rounded-lg">
                <div className="text-3xl mb-2">🍽️</div>
                <h3 className="font-semibold text-secondary-700 mb-2">Good quality</h3>
                <p className="text-sm text-secondary-600">Restaurant with good quality through selection</p>
              </div>
              <div className="text-center p-4 border border-secondary-200 rounded-lg">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="font-semibold text-secondary-700 mb-2">Easy payment</h3>
                <p className="text-sm text-secondary-600">Support multiple payment methods</p>
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div className="text-center bg-secondary-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Contact Us</h2>
            <p className="text-secondary-600">
              Email: {contactInfo.contact_email} | Phone: {contactInfo.contact_phone}
            </p>
            <div className="mt-4">
              <a 
                href="/contact" 
                className="inline-block bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 