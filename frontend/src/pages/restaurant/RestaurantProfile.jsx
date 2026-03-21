import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { restaurantService } from '../../services/api';
import Loading from '../../components/common/Loading';

const RestaurantProfile = () => {
  const { user, updateProfile } = useAuth();
  const { translate } = useLanguage();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    restaurant_name: '',
    description: '',
    address: '',
    phone_number: '',
    opening_hours: '',
    status: 'open',
    latitude: '',
    longitude: '',
    bank_account_number: '',
    bank_name: '',
    account_name: '',
    image_url: '',
  });

  const t = (key, fallback, vars = {}) => {
    const value = translate(key, vars);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    if (user?.restaurant_info?.id) {
      fetchRestaurantData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getById(user.restaurant_info.id);
      const data = response.data;

      setRestaurant(data);
      setFormData({
        restaurant_name: data.restaurant_name || '',
        description: data.description || '',
        address: data.address || '',
        phone_number: data.phone_number || '',
        opening_hours: data.opening_hours || '',
        status: data.status || 'open',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        bank_account_number: data.bank_account_number || '',
        bank_name: data.bank_name || '',
        account_name: data.account_name || '',
        image_url: data.image_url || '',
      });

      setPreviewUrl(data.image_display_url || null);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      setMessage(t('restaurant.profile.error_load', 'Unable to load restaurant information'));
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      let updateData;

      if (selectedFile) {
        updateData = new FormData();
        updateData.append('restaurant_name', formData.restaurant_name);
        updateData.append('description', formData.description || '');
        updateData.append('address', formData.address || '');
        updateData.append('phone_number', formData.phone_number || '');
        updateData.append('opening_hours', formData.opening_hours || '');
        updateData.append('status', formData.status || 'open');
        if (formData.latitude) updateData.append('latitude', parseFloat(formData.latitude));
        if (formData.longitude) updateData.append('longitude', parseFloat(formData.longitude));
        updateData.append('bank_account_number', formData.bank_account_number || '');
        updateData.append('bank_name', formData.bank_name || '');
        updateData.append('account_name', formData.account_name || '');
        updateData.append('image', selectedFile);
      } else {
        updateData = {
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        };
      }

      await restaurantService.partialUpdate(user.restaurant_info.id, updateData);
      await fetchRestaurantData();
      await updateProfile();

      setMessage(t('restaurant.profile.save_success', 'Saved successfully'));
      setIsEditing(false);
      setSelectedFile(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        t('restaurant.profile.error_save', 'Unable to save information');
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (restaurant) {
      setFormData({
        restaurant_name: restaurant.restaurant_name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone_number: restaurant.phone_number || '',
        opening_hours: restaurant.opening_hours || '',
        status: restaurant.status || 'open',
        latitude: restaurant.latitude || '',
        longitude: restaurant.longitude || '',
        bank_account_number: restaurant.bank_account_number || '',
        bank_name: restaurant.bank_name || '',
        account_name: restaurant.account_name || '',
        image_url: restaurant.image_url || '',
      });
      setPreviewUrl(restaurant.image_display_url || null);
    }

    setIsEditing(false);
    setSelectedFile(null);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user?.restaurant_info?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {t('restaurant.profile.not_found', 'Restaurant information not found')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">{t('restaurant.profile.title', 'Restaurant information')}</h1>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="relative w-32 h-32 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Restaurant" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl text-primary-500">R</span>
              )}
            </div>
            <h2 className="text-2xl font-semibold text-secondary-700">{restaurant?.restaurant_name || t('restaurant.profile.title', 'Restaurant information')}</h2>
            {restaurant?.status && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                  restaurant.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {restaurant.status === 'open' ? t('common.open', 'Open') : t('common.closed', 'Closed')}
              </span>
            )}
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message === t('restaurant.profile.save_success', 'Saved successfully')
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.profile.image', 'Restaurant image')}</label>
                {isEditing && <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-3 border border-secondary-300 rounded-lg mb-2" />}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.name', 'Restaurant name')} *</label>
                <input type="text" name="restaurant_name" value={formData.restaurant_name} onChange={handleInputChange} placeholder={t('restaurant.profile.name_placeholder', 'Enter restaurant name')} required readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.description', 'Description')}</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder={t('restaurant.profile.description_placeholder', 'Enter restaurant description')} readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.address', 'Address')} *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder={t('restaurant.profile.address_placeholder', 'Enter restaurant address')} required readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Latitude</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="Latitude" readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Longitude</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="Longitude" readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.phone', 'Phone')}</label>
                <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder={t('restaurant.profile.phone_placeholder', 'Enter phone number')} readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.opening_hours', 'Opening hours')}</label>
                <input type="text" name="opening_hours" value={formData.opening_hours} onChange={handleInputChange} placeholder={t('restaurant.profile.opening_hours_placeholder', 'e.g. 09:00 - 21:00')} readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">{t('restaurant.status', 'Status')}</label>
                <select name="status" value={formData.status} onChange={handleInputChange} disabled={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`}>
                  <option value="open">{t('common.open', 'Open')}</option>
                  <option value="closed">{t('common.closed', 'Closed')}</option>
                </select>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-secondary-700 mb-4">{t('restaurant.profile.bank_title', 'Bank account information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">{t('admin.bank_account_number', 'Account number')}</label>
                    <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} placeholder={t('admin.bank_account_number', 'Account number')} readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">{t('admin.bank_name', 'Bank')}</label>
                    <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} placeholder={t('admin.bank_name', 'Bank')} readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">{t('admin.account_name', 'Account name')}</label>
                    <input type="text" name="account_name" value={formData.account_name} onChange={handleInputChange} placeholder={t('admin.account_name', 'Account name')} readOnly={!isEditing} className={`w-full p-3 border border-secondary-300 rounded-lg ${!isEditing ? 'bg-secondary-50' : ''}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              {!isEditing ? (
                <button type="button" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700" onClick={() => setIsEditing(true)}>
                  {t('common.edit', 'Edit')}
                </button>
              ) : (
                <>
                  <button type="button" className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg font-semibold hover:bg-secondary-300" onClick={handleCancel}>
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button type="submit" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50" disabled={saving}>
                    {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile;
