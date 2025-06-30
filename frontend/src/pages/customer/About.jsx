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
            <p className="text-secondary-600 mt-2">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-800 mb-6">เกี่ยวกับเรา</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-secondary-700 mb-4">พันธกิจของเรา</h2>
              <p className="text-secondary-600 mb-4">
                เราคือแพลตฟอร์มสั่งอาหารออนไลน์ที่มุ่งมั่นในการเชื่อมโยงลูกค้ากับร้านอาหารคุณภาพ
                เพื่อให้ทุกคนได้เพลิดเพลินไปกับอาหารอร่อยจากร้านที่ชื่นชอบ
              </p>
              <p className="text-secondary-600">
                ด้วยเทคโนโลยีที่ล้ำสมัยและบริการที่เป็นมิตร เราจะมอบประสบการณ์การสั่งอาหาร
                ที่สะดวก รวดเร็ว และน่าประทับใจให้กับคุณ
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-secondary-700 mb-4">ค่านิยมของเรา</h2>
              <ul className="space-y-2 text-secondary-600">
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  คุณภาพอาหารที่ดีที่สุด
                </li>
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  บริการที่รวดเร็วและเชื่อถือได้
                </li>
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  ความปลอดภัยในการจัดส่ง
                </li>
                <li className="flex items-center">
                  <span className="text-primary-500 mr-2">✓</span>
                  การสนับสนุนร้านอาหารท้องถิ่น
                </li>
              </ul>
            </div>
          </div>

          {/* วิสัยทัศน์ */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">วิสัยทัศน์</h2>
            <p className="text-secondary-600">
              เป็นแพลตฟอร์มสั่งอาหารออนไลน์อันดับหนึ่งในประเทศไทย ที่เชื่อมโยงความต้องการของลูกค้ากับร้านอาหารคุณภาพ สร้างระบบนิเวศที่ยั่งยืนสำหรับธุรกิจอาหารและเครื่องดื่ม
            </p>
          </div>

          {/* จุดเด่นของบริการ */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">จุดเด่นของบริการ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-secondary-200 rounded-lg">
                <div className="text-3xl mb-2">🚚</div>
                <h3 className="font-semibold text-secondary-700 mb-2">ส่งเร็ว</h3>
                <p className="text-sm text-secondary-600">ส่งอาหารถึงมือคุณภายใน 30-45 นาที</p>
              </div>
              <div className="text-center p-4 border border-secondary-200 rounded-lg">
                <div className="text-3xl mb-2">🍽️</div>
                <h3 className="font-semibold text-secondary-700 mb-2">คุณภาพดี</h3>
                <p className="text-sm text-secondary-600">ร้านอาหารคุณภาพ ผ่านการคัดเลือก</p>
              </div>
              <div className="text-center p-4 border border-secondary-200 rounded-lg">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="font-semibold text-secondary-700 mb-2">จ่ายง่าย</h3>
                <p className="text-sm text-secondary-600">รองรับการชำระเงินหลายช่องทาง</p>
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div className="text-center bg-secondary-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">ติดต่อเรา</h2>
            <p className="text-secondary-600">
              อีเมล: {contactInfo.contact_email} | โทร: {contactInfo.contact_phone}
            </p>
            <div className="mt-4">
              <a 
                href="/contact" 
                className="inline-block bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                ติดต่อเราเพิ่มเติม
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 