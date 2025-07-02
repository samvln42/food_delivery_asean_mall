import React, { useState, useEffect } from 'react';
import { appSettingsService } from '../../services/api';
import { toast } from '../../hooks/useNotification';

const Contact = () => {
  const [contactInfo, setContactInfo] = useState({
    contact_email: 'support@fooddelivery.com',
    contact_phone: '02-xxx-xxxx', 
    contact_address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    app_name: 'Food Delivery'
  });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

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
          contact_address: response.data.contact_address || '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all the information');
      return;
    }

    setSubmitting(true);
    try {
      // จำลองการส่งข้อความ (ในอนาคตอาจส่งไปยัง API จริง)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Message sent successfully. We will contact you within 24 hours');
      
      // รีเซ็ตฟอร์ม
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Error sending message. Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  // ไม่ต้องบล็อกหน้าเมื่อโหลดข้อมูล - ให้แสดงข้อมูล default ก่อนแล้วค่อยอัปเดท

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-800 mb-6">Contact us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ข้อมูลติดต่อ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Contact us</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-primary-500 mr-3">📞</span>
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-secondary-600">{contactInfo.contact_phone}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-primary-500 mr-3">📧</span>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-secondary-600">{contactInfo.contact_email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">📍</span>
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-secondary-600 whitespace-pre-line">{contactInfo.contact_address}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-primary-500 mr-3">🕐</span>
                <div>
                  <p className="font-semibold">Operating hours</p>
                  <p className="text-secondary-600">Monday-Sunday 8:00-22:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* ฟอร์มติดต่อ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter the subject of your message"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Message</label>
                <textarea 
                  rows="4"
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your message"
                  required
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  'Send message'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Other ways</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-semibold text-secondary-700 mb-2">Live Chat</h3>
              <p className="text-sm text-secondary-600">Chat with customer service via live chat</p>
              <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                Start chat
              </button>
            </div>
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <div className="text-3xl mb-2">❓</div>
              <h3 className="font-semibold text-secondary-700 mb-2">Frequently Asked Questions</h3>
              <p className="text-sm text-secondary-600">Find answers to frequently asked questions</p>
              <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                View FAQ
              </button>
            </div>
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <div className="text-3xl mb-2">🛠️</div>
              <h3 className="font-semibold text-secondary-700 mb-2">Help Center</h3>
              <p className="text-sm text-secondary-600">Guide and solutions</p>
              <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                Go to Help Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 