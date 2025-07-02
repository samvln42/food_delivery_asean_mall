import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    username: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        username: user.username || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // จำลองการอัพเดทข้อมูล (ต้องเชื่อมต่อกับ API จริงในอนาคต)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Profile updated successfully');
      setIsEditing(false);
      
      // ซ่อนข้อความหลังจาก 3 วินาที
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // รีเซ็ตข้อมูลกลับเป็นค่าเดิม
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        username: user.username || ''
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">My profile</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-primary-500">
                {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-secondary-700">
              {profile.first_name || profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`.trim()
                : 'Personal information'
              }
            </h2>
            {user?.role && (
              <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm mt-2">
                {user.role === 'customer' ? 'Customer' : 
                 user.role === 'general_restaurant' ? 'General restaurant' :
                 user.role === 'special_restaurant' ? 'Special restaurant' :
                 user.role === 'admin' ? 'Admin' : user.role}
              </span>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleInputChange}
                    className={`w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      !isEditing ? 'bg-secondary-50' : ''
                    }`}
                    placeholder="Enter first name"
                    readOnly={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleInputChange}
                    className={`w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      !isEditing ? 'bg-secondary-50' : ''
                    }`}
                    placeholder="Enter last name"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={profile.username}
                  onChange={handleInputChange}
                  className={`w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    !isEditing ? 'bg-secondary-50' : ''
                  }`}
                  placeholder="Enter username"
                  readOnly={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className={`w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    !isEditing ? 'bg-secondary-50' : ''
                  }`}
                  placeholder="Enter email"
                  readOnly={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleInputChange}
                  className={`w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    !isEditing ? 'bg-secondary-50' : ''
                  }`}
                  placeholder="Enter phone number"
                  readOnly={!isEditing}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6">
                {!isEditing ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Edit information
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Change password
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full bg-secondary-300 text-secondary-700 py-3 px-4 rounded-lg hover:bg-secondary-400 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Account Info */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-secondary-700 mb-4">Account information</h3>
            <div className="space-y-2 text-sm text-secondary-600">
              <div className="flex justify-between">
                <span>Member since:</span>
                <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user?.is_email_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.is_email_verified ? 'Verified' : 'Not verified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Account status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user?.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 