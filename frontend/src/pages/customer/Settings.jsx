import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      order_updates: true,
      promotions: true,
      email_notifications: false,
      push_notifications: true,
      sms_notifications: false
    },
    privacy: {
      show_order_history: true,
      share_usage_data: false,
      allow_location_tracking: true,
      show_online_status: true
    },
    preferences: {
      language: 'th',
      theme: 'light',  
      currency: 'THB',
      delivery_instructions: '',
      default_address: ''
    },
    account: {
      two_factor_auth: false,
      login_alerts: true,
      session_timeout: '30'
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // ลองโหลดจาก localStorage
      const savedSettings = localStorage.getItem(`settings_${user?.user_id}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const saveSettings = async (newSettings) => {
    try {
      setLoading(true);
      
      // บันทึกใน localStorage
      if (user?.user_id) {
        localStorage.setItem(`settings_${user.user_id}`, JSON.stringify(newSettings));
      }
      
      // จำลองการบันทึกใน API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      const defaultSettings = {
        notifications: {
          order_updates: true,
          promotions: true,
          email_notifications: false,
          push_notifications: true,
          sms_notifications: false
        },
        privacy: {
          show_order_history: true,
          share_usage_data: false,
          allow_location_tracking: true,
          show_online_status: true
        },
        preferences: {
          language: 'th',
          theme: 'light',
          currency: 'THB',
          delivery_instructions: '',
          default_address: ''
        },
        account: {
          two_factor_auth: false,
          login_alerts: true,
          session_timeout: '30'
        }
      };
      
      setSettings(defaultSettings);
      saveSettings(defaultSettings);
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${checked ? 'bg-primary-500' : 'bg-secondary-300'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">การตั้งค่า</h1>
      
      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('เรียบร้อย') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Notifications Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">การแจ้งเตือน</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แจ้งเตือนสถานะคำสั่งซื้อ</span>
                <p className="text-sm text-secondary-500">รับการแจ้งเตือนเมื่อสถานะคำสั่งซื้อเปลี่ยนแปลง</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.order_updates}
                onChange={(e) => updateSetting('notifications', 'order_updates', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แจ้งเตือนโปรโมชั่น</span>
                <p className="text-sm text-secondary-500">รับข้อมูลส่วนลดและโปรโมชั่นพิเศษ</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.promotions}
                onChange={(e) => updateSetting('notifications', 'promotions', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แจ้งเตือนทางอีเมล</span>
                <p className="text-sm text-secondary-500">รับการแจ้งเตือนผ่านอีเมล</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.email_notifications}
                onChange={(e) => updateSetting('notifications', 'email_notifications', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Push Notifications</span>
                <p className="text-sm text-secondary-500">รับการแจ้งเตือนแบบ Push ในเบราว์เซอร์</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.push_notifications}
                onChange={(e) => updateSetting('notifications', 'push_notifications', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แจ้งเตือนทาง SMS</span>
                <p className="text-sm text-secondary-500">รับการแจ้งเตือนผ่านข้อความ SMS</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.sms_notifications}
                onChange={(e) => updateSetting('notifications', 'sms_notifications', e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">ความเป็นส่วนตัว</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แสดงประวัติการสั่งซื้อ</span>
                <p className="text-sm text-secondary-500">อนุญาตให้ร้านอาหารดูประวัติการสั่งซื้อของคุณ</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.show_order_history}
                onChange={(e) => updateSetting('privacy', 'show_order_history', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แชร์ข้อมูลการใช้งาน</span>
                <p className="text-sm text-secondary-500">ช่วยปรับปรุงบริการโดยแชร์ข้อมูลการใช้งานแบบไม่ระบุตัวตน</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.share_usage_data}
                onChange={(e) => updateSetting('privacy', 'share_usage_data', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">ติดตามตำแหน่ง</span>
                <p className="text-sm text-secondary-500">อนุญาตให้ติดตามตำแหน่งเพื่อแนะนำร้านอาหารใกล้เคียง</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.allow_location_tracking}
                onChange={(e) => updateSetting('privacy', 'allow_location_tracking', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แสดงสถานะออนไลน์</span>
                <p className="text-sm text-secondary-500">แสดงสถานะการออนไลน์ให้ร้านอาหารเห็น</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.show_online_status}
                onChange={(e) => updateSetting('privacy', 'show_online_status', e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">ความชอบส่วนตัว</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">ภาษา</label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">ธีม</label>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="light">สว่าง</option>
                  <option value="dark">มืด</option>
                  <option value="auto">อัตโนมัติ</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">คำแนะนำการจัดส่ง</label>
              <textarea
                value={settings.preferences.delivery_instructions}
                onChange={(e) => updateSetting('preferences', 'delivery_instructions', e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="เช่น ให้วางที่หน้าประตู, โทรก่อนส่ง, ฯลฯ"
              />
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">ความปลอดภัยบัญชี</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">การยืนยันตัวตนแบบ 2 ขั้นตอน</span>
                <p className="text-sm text-secondary-500">เพิ่มความปลอดภัยด้วยรหัส OTP</p>
              </div>
              <ToggleSwitch
                checked={settings.account.two_factor_auth}
                onChange={(e) => updateSetting('account', 'two_factor_auth', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">แจ้งเตือนการเข้าสู่ระบบ</span>
                <p className="text-sm text-secondary-500">รับการแจ้งเตือนเมื่อมีการเข้าสู่ระบบใหม่</p>
              </div>
              <ToggleSwitch
                checked={settings.account.login_alerts}
                onChange={(e) => updateSetting('account', 'login_alerts', e.target.checked)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                หมดเวลาเซสชันอัตโนมัติ (นาที)
              </label>
              <select
                value={settings.account.session_timeout}
                onChange={(e) => updateSetting('account', 'session_timeout', e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="15">15 นาที</option>
                <option value="30">30 นาที</option>
                <option value="60">1 ชั่วโมง</option>
                <option value="120">2 ชั่วโมง</option>
                <option value="0">ไม่หมดเวลา</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={resetSettings}
              className="bg-secondary-500 text-white px-6 py-3 rounded-lg hover:bg-secondary-600 transition-colors"
              disabled={loading}
            >
              รีเซ็ตการตั้งค่า
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="border border-secondary-300 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => saveSettings(settings)}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                disabled={loading}
              >
                {loading ? 'บันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 