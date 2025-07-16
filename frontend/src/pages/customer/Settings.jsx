import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Settings = () => {
  const { user, logout } = useAuth();
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
      currency: '',
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
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
      
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
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
          currency: '',
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

  const handleDeleteAccount = async () => {
    try {
      // ขั้นตอนที่ 1: ยืนยันความต้องการลบบัญชี
      const firstConfirmation = window.confirm(
        `Are you sure you want to delete your account "${user?.username}"?\n\n⚠️ This action will delete all your information, including:\n• Order history\n• Reviews and ratings\n• Personal information\n• All settings\n\nThis action cannot be undone!`
      );
      
      if (!firstConfirmation) {
        return;
      }

      // ขั้นตอนที่ 2: ป้อนชื่อผู้ใช้เพื่อยืนยัน
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      // ตรวจสอบการพิมพ์ชื่อผู้ใช้ 
      if (deleteConfirmation !== user?.username) {
        alert(`Please enter the username "${user?.username}" correctly`);
        return;
      }

      setDeletingAccount(true);
      
      console.log(`🗑️ Deleting account for user ${user?.id} (${user?.username})`);
      
      // เรียก API ลบบัญชี
      await userService.delete(user?.id);
      
      alert('Account deleted successfully\nThank you for using our service');
      
      // ออกจากระบบและไปหน้าหลัก
      await logout();
      window.location.href = '/';
      
    } catch (err) {
      console.error('❌ Error deleting account:', err);
      console.error('Response:', err.response?.data);
      
      let errorMessage = 'Unable to delete account';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this account';
      } else if (err.response?.status === 404) {
        errorMessage = 'Account not found';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      alert(errorMessage);
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmation('');
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
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Settings</h1>
      
      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Success') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Notifications Settings */}
        {/* <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Order status updates</span>
                <p className="text-sm text-secondary-500">Receive notifications when order status changes</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.order_updates}
                onChange={(e) => updateSetting('notifications', 'order_updates', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Promotions</span>
                <p className="text-sm text-secondary-500">Receive information about discounts and special promotions</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.promotions}
                onChange={(e) => updateSetting('notifications', 'promotions', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Email notifications</span>
                <p className="text-sm text-secondary-500">Receive notifications via email</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.email_notifications}
                onChange={(e) => updateSetting('notifications', 'email_notifications', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Push Notifications</span>
                <p className="text-sm text-secondary-500">Receive push notifications in the browser</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.push_notifications}
                onChange={(e) => updateSetting('notifications', 'push_notifications', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">SMS notifications</span>
                <p className="text-sm text-secondary-500">Receive notifications via SMS</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications.sms_notifications}
                onChange={(e) => updateSetting('notifications', 'sms_notifications', e.target.checked)}
              />
            </div>
          </div>
        </div> */}

        {/* Privacy Settings */}
        {/* <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Show order history</span>
                <p className="text-sm text-secondary-500">Allow restaurants to view your order history</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.show_order_history}
                onChange={(e) => updateSetting('privacy', 'show_order_history', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Share usage data</span>
                <p className="text-sm text-secondary-500">Help improve services by sharing usage data anonymously</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.share_usage_data}
                onChange={(e) => updateSetting('privacy', 'share_usage_data', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Track location</span>
                <p className="text-sm text-secondary-500">Allow tracking your location to recommend nearby restaurants</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.allow_location_tracking}
                onChange={(e) => updateSetting('privacy', 'allow_location_tracking', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Show online status</span>
                <p className="text-sm text-secondary-500">Show your online status to restaurants</p>
              </div>
              <ToggleSwitch
                checked={settings.privacy.show_online_status}
                onChange={(e) => updateSetting('privacy', 'show_online_status', e.target.checked)}
              />
            </div>
          </div>
        </div> */}

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">Preferences</h2>
          <div className="space-y-4">
            {/* LanguageSwitcher เฉพาะ mobile */}
            <div className="block sm:hidden">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Language</label>
              <LanguageSwitcher />
            </div>
            {/* Theme (เต็มแถวใน desktop) */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Theme</label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            {/* Delivery instructions */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Delivery instructions</label>
              <textarea
                value={settings.preferences.delivery_instructions}
                onChange={(e) => updateSetting('preferences', 'delivery_instructions', e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="For example, place it at the front door, call before delivery, etc."
              />
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary-700 mb-4">Account Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Two-factor authentication</span>
                <p className="text-sm text-secondary-500">Add security with OTP</p>
              </div>
              <ToggleSwitch
                checked={settings.account.two_factor_auth}
                onChange={(e) => updateSetting('account', 'two_factor_auth', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary-700 font-medium">Login alerts</span>
                <p className="text-sm text-secondary-500">Receive notifications when you log in</p>
              </div>
              <ToggleSwitch
                checked={settings.account.login_alerts}
                onChange={(e) => updateSetting('account', 'login_alerts', e.target.checked)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Session timeout (minutes)
              </label>
              <select
                value={settings.account.session_timeout}
                onChange={(e) => updateSetting('account', 'session_timeout', e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="0">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={resetSettings}
              className="bg-secondary-500 text-white px-6 py-3 rounded-lg hover:bg-secondary-600 transition-colors"
              disabled={loading}
            >
              Reset settings
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="border border-secondary-300 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveSettings(settings)}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </div>
        </div> */}

        {/* Danger Zone - Delete Account */}
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Delete account
          </h2>
          
          <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-red-800 mb-2">⚠️ The following information will be permanently deleted:</h3>
            <ul className="text-sm text-red-700 space-y-1 ml-4">
              <li>• All order history</li>
              <li>• Reviews and ratings</li>
              <li>• Personal information and contact</li>
              <li>• Settings and preferences</li>
              <li>• Favorite and saved items</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> This action cannot be undone. Please consider carefully before making a decision
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
              disabled={loading || deletingAccount}
            >
              Delete my account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  Enter your username "<strong className="text-red-800">{user?.username}</strong>" to confirm account deletion:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={`Enter "${user?.username}" here`}
                  disabled={deletingAccount}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteAccount}
                  className="bg-secondary-500 text-white px-6 py-3 rounded-lg hover:bg-secondary-600 transition-colors"
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  disabled={deletingAccount || deleteConfirmation !== user?.username}
                >
                  {deletingAccount ? 'Deleting account...' : 'Confirm account deletion'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 