import React, { useState, useEffect } from 'react';
import { restaurantService, userService } from '../../services/api';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialFilter, setSpecialFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create', 'upload'
  const [availableUsers, setAvailableUsers] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Single useEffect with smart debouncing
  useEffect(() => {
    const isSearchOrFilter = searchTerm.trim() || statusFilter !== 'all' || specialFilter !== 'all';
    
    // If searching/filtering and not on page 1, reset to page 1 first
    if (isSearchOrFilter && currentPage !== 1) {
      setCurrentPage(1);
      return; // Don't fetch yet, wait for currentPage to update
    }

    const debounceTime = searchTerm.trim() ? 500 : 0;

    const timeoutId = setTimeout(() => {
      fetchRestaurants();
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, statusFilter, specialFilter]);

  // เรียก fetchAvailableUsers เฉพาะครั้งแรกเท่านั้น
  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const isSearchOrFilter = searchTerm.trim() || statusFilter !== 'all' || specialFilter !== 'all';
      
      if (isSearchOrFilter) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      console.log('🔍 Current filters - Status:', statusFilter, 'Special:', specialFilter, 'Search:', searchTerm);
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        ordering: '-created_at'
      };

      // เพิ่ม search parameter เฉพาะเมื่อมีการค้นหา
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
        console.log('✅ Adding status filter:', statusFilter);
      }

      if (specialFilter !== 'all') {
        params.is_special = specialFilter === 'special';
        console.log('✅ Adding special filter:', specialFilter === 'special');
      }

      console.log('📡 Sending API request with params:', params);
      const response = await restaurantService.getAll(params);
      console.log('📦 API response:', response.data);
      
      if (response.data.results) {
        setRestaurants(response.data.results);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      } else {
        setRestaurants(response.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('ไม่สามารถโหลดข้อมูลร้านอาหารได้');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      console.log('🔍 Fetching available users for restaurant creation...');
      
      // ลองดึงข้อมูลหลายวิธี
      let response;
      try {
        // วิธีที่ 1: ส่ง params แบบ object
        response = await userService.getAll({ page_size: 100, page: 1 });
      } catch (err) {
        console.log('🔄 Trying alternative method...');
        // วิธีที่ 2: ส่งแบบ query string
        response = await userService.getAll();
      }
      
      console.log('👥 Users API response:', response.data);
      
      // ตรวจสอบว่า response.data เป็น paginated หรือไม่
      let users = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        users = response.data.results;
        console.log('📄 Found paginated response with results');
      } else if (Array.isArray(response.data)) {
        users = response.data;
        console.log('📄 Found direct array response');
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        users = [];
      }
      
      console.log('👥 All users count:', users.length);
      console.log('👥 All users:', users);
      
      // กรองเฉพาะ users ที่เป็น restaurant owner แต่ยังไม่มีร้าน
      const usersWithoutRestaurant = users.filter(user => {
        const isRestaurantOwner = user.role === 'general_restaurant' || user.role === 'special_restaurant';
        
        // ตรวจสอบว่ายังไม่มีร้าน (หลายรูปแบบ)
        let hasNoRestaurant = false;
        
        if (!user.restaurant_info) {
          hasNoRestaurant = true; 
        } else if (user.restaurant_info === null) {
          hasNoRestaurant = true;
        } else if (typeof user.restaurant_info === 'object') {
          if (user.restaurant_info.status === 'no_restaurant') {
            hasNoRestaurant = true;
          } else if (user.restaurant_info.id === null || user.restaurant_info.id === undefined) {
            hasNoRestaurant = true;
          } else if (user.restaurant_info.name === null || user.restaurant_info.name === undefined) {
            hasNoRestaurant = true;
          }
        }
        
        const isAvailable = isRestaurantOwner && hasNoRestaurant;
        
        if (isRestaurantOwner) {
          console.log(`👤 ${user.username} (${user.role}): ${isAvailable ? '✅ Available' : '❌ Has restaurant'}`);
        }
        
        return isAvailable;
      });
      
      console.log('✅ Available users for restaurant:', usersWithoutRestaurant.length, 'users');
      console.log('✅ Available users details:', usersWithoutRestaurant);
      setAvailableUsers(usersWithoutRestaurant);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      console.error('Error details:', err.response?.data);
      setAvailableUsers([]); // Set empty array on error
    }
  };

  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      await restaurantService.partialUpdate(restaurantId, { status: newStatus });
      fetchRestaurants(); // Refresh data
      alert(`อัปเดตสถานะร้านอาหารเป็น ${newStatus === 'open' ? 'เปิด' : 'ปิด'} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Error updating restaurant status:', err);
      alert('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleSpecialStatusChange = async (restaurantId, isSpecial) => {
    try {
      await restaurantService.partialUpdate(restaurantId, { is_special: isSpecial });
      fetchRestaurants(); // Refresh data
      alert(`${isSpecial ? 'เพิ่ม' : 'ลบ'}สถานะร้านพิเศษเรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Error updating special status:', err);
      alert('ไม่สามารถอัปเดตสถานะพิเศษได้');
    }
  };

  const handleDeleteRestaurant = async (restaurantId, restaurantName) => {
    try {
      // ยืนยันการลบ
      const confirmation = window.confirm(
        `คุณแน่ใจหรือไม่ที่จะลบร้านอาหาร "${restaurantName}"?\n\nการดำเนินการนี้จะลบข้อมูลทั้งหมดของร้าน รวมถึงสินค้า และรีวิว\nการดำเนินการนี้ไม่สามารถกู้คืนได้`
      );
      
      if (!confirmation) {
        return;
      }

      console.log(`🗑️ Deleting restaurant ${restaurantId} (${restaurantName})`);
      await restaurantService.delete(restaurantId);
      fetchRestaurants(); // Refresh data
      alert(`ลบร้านอาหาร "${restaurantName}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('❌ Error deleting restaurant:', err);
      console.error('Response:', err.response?.data);
      
      let errorMessage = 'ไม่สามารถลบร้านอาหารได้';
      if (err.response?.status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์ลบร้านอาหารนี้';
      } else if (err.response?.status === 404) {
        errorMessage = 'ไม่พบร้านอาหารที่ต้องการลบ';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      alert(errorMessage);
    }
  };

  const openModal = (restaurant, type) => {
    setSelectedRestaurant(restaurant);
    setModalType(type);
    setShowModal(true);
  };

  const openCreateModal = async () => {
    // Refresh available users เมื่อเปิด modal สร้างร้าน
    await fetchAvailableUsers();
    
    setSelectedRestaurant(null);
    setModalType('create');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRestaurant(null);
    setModalType('view');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleStatusFilter = (e) => {
    console.log('🔄 Status filter changed to:', e.target.value);
    setStatusFilter(e.target.value);
  };

  const handleSpecialFilter = (e) => {
    console.log('🔄 Special filter changed to:', e.target.value);
    setSpecialFilter(e.target.value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && restaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <span className="ml-4 text-lg">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">จัดการร้านอาหาร</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={openCreateModal}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>สร้างร้านใหม่</span>
          </button>

          <div className="text-sm text-secondary-600">
            รวม {restaurants.length} ร้านอาหาร
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค้นหาร้านอาหาร
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อร้าน, คำอธิบาย, ที่อยู่..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full p-3 pr-10 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                </div>
              )}
              {searchTerm && !searching && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                  title="ล้างการค้นหา"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              สถานะ
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              <option value="open">เปิด</option>
              <option value="closed">ปิด</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ประเภท
            </label>
            <select
              value={specialFilter}
              onChange={handleSpecialFilter}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              <option value="special">ร้านพิเศษ</option>
              <option value="general">ร้านทั่วไป</option>
            </select>
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ร้านอาหาร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  เจ้าของ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  คะแนน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {restaurants.map((restaurant) => (
                <tr key={restaurant.restaurant_id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 mr-4">
                        {restaurant.image_display_url ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={restaurant.image_display_url}
                            alt={restaurant.restaurant_name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-secondary-200 flex items-center justify-center">
                            <span className="text-secondary-400 text-xl">🏪</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {restaurant.restaurant_name}
                        </div>
                        <div className="text-sm text-secondary-500 truncate max-w-xs">
                          {restaurant.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {restaurant.user_username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      restaurant.is_special 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {restaurant.is_special ? 'ร้านพิเศษ' : 'ร้านทั่วไป'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      restaurant.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.status === 'open' ? 'เปิด' : 'ปิด'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-secondary-900">
                        {restaurant.average_rating}/5
                      </span>
                      <span className="text-xs text-secondary-500 ml-1">
                        ({restaurant.total_reviews} รีวิว)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {formatDate(restaurant.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openModal(restaurant, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดู
                      </button>
                      <button
                        onClick={() => openModal(restaurant, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => openModal(restaurant, 'upload')}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        อัปโหลดรูป
                      </button>
                      <button
                        onClick={() => window.location.href = `/admin/restaurants/${restaurant.restaurant_id}/products`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        จัดการสินค้า
                      </button>
                      <button
                        onClick={() => handleStatusChange(
                          restaurant.restaurant_id, 
                          restaurant.status === 'open' ? 'closed' : 'open'
                        )}
                        className={restaurant.status === 'open' 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                        }
                      >
                        {restaurant.status === 'open' ? 'ปิด' : 'เปิด'}
                      </button>
                      <button
                        onClick={() => handleSpecialStatusChange(
                          restaurant.restaurant_id, 
                          !restaurant.is_special
                        )}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        {restaurant.is_special ? 'ยก Special' : 'ทำ Special'}
                      </button>
                      <button
                        onClick={() => handleDeleteRestaurant(restaurant.restaurant_id, restaurant.restaurant_name)}
                        className="text-red-600 hover:text-red-900 font-medium"
                        title="ลบร้านอาหาร"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {restaurants.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-30">🏪</div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              ไม่พบร้านอาหาร
            </h3>
            <p className="text-secondary-500 mb-4">
              {searchTerm.trim() || statusFilter !== 'all' || specialFilter !== 'all' 
                ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง'
                : 'ยังไม่มีร้านอาหารในระบบ'
              }
            </p>
            {(!searchTerm.trim() && statusFilter === 'all' && specialFilter === 'all') && (
              <button
                onClick={openCreateModal}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>สร้างร้านแรก</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-secondary-500 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-white bg-primary-600 border border-primary-600'
                        : 'text-secondary-500 bg-white border border-secondary-300 hover:bg-secondary-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-3 py-2 text-sm font-medium text-secondary-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-secondary-500 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <RestaurantModal
          restaurant={selectedRestaurant}
          type={modalType}
          onClose={closeModal}
          onUpdate={fetchRestaurants}
          availableUsers={availableUsers}
        />
      )}
    </div>
  );
};

// Restaurant Detail Modal Component
const RestaurantModal = ({ restaurant, type, onClose, onUpdate, availableUsers }) => {
  
  const [formData, setFormData] = useState({
    restaurant_name: restaurant?.restaurant_name || '',
    description: restaurant?.description || '',
    address: restaurant?.address || '',
    phone_number: restaurant?.phone_number || '',
    opening_hours: restaurant?.opening_hours || '',
    status: restaurant?.status || 'open',
    is_special: restaurant?.is_special || false,
    bank_account_number: restaurant?.bank_account_number || '',
    bank_name: restaurant?.bank_name || '',
    account_name: restaurant?.account_name || '',
    user: restaurant?.user || '', // เปลี่ยนจาก user_id เป็น user
    image_url: restaurant?.image_url || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(restaurant?.image_display_url || null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type !== 'edit' && type !== 'create') return;

    try {
      setLoading(true);
      
      if (type === 'create') {
        // ตรวจสอบข้อมูลที่จำเป็น
        console.log('📝 Validating form data before submission...');
        console.log('📝 Current formData:', formData);
        console.log('📝 Available users for validation:', availableUsers);
        
        if (!formData.restaurant_name || !formData.restaurant_name.trim()) {
          alert('กรุณาใส่ชื่อร้านอาหาร');
          return;
        }
        if (!formData.user || formData.user === '') {
          alert('กรุณาเลือกเจ้าของร้าน');
          console.log('❌ No user selected. Current value:', formData.user);
          return;
        }

        // เตรียมข้อมูลสำหรับส่ง API
        const createData = {
          restaurant_name: formData.restaurant_name.trim(),
          description: formData.description || '',
          address: formData.address || '',
          phone_number: formData.phone_number || '',
          opening_hours: formData.opening_hours || '',
          status: formData.status || 'open',
          is_special: Boolean(formData.is_special),
          bank_account_number: formData.bank_account_number || '',
          bank_name: formData.bank_name || '',
          account_name: formData.account_name || '',
          user: parseInt(formData.user, 10), // แปลงเป็น integer
          image_url: formData.image_url || ''
        };

        console.log('📤 Sending data to API:', createData);
        console.log('📤 user type:', typeof createData.user);
        console.log('📤 user value:', createData.user);

        // สร้างร้านใหม่
        const createResponse = await restaurantService.create(createData);
        const newRestaurant = createResponse.data;
        
        // หากมีไฟล์รูปภาพที่เลือก ให้อัปโหลดต่อ
        if (selectedFile) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', selectedFile);

            const uploadResponse = await fetch(`http://127.0.0.1:8000/api/restaurants/${newRestaurant.restaurant_id}/upload_image/`, {
              method: 'POST',
              headers: {
                'Authorization': `Token ${localStorage.getItem('token')}`
              },
              body: formDataUpload
            });

            if (uploadResponse.ok) {
              alert('สร้างร้านอาหารและอัปโหลดรูปภาพเรียบร้อยแล้ว');
            } else {
              alert('สร้างร้านอาหารเรียบร้อยแล้ว แต่อัปโหลดรูปภาพไม่สำเร็จ');
            }
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert('สร้างร้านอาหารเรียบร้อยแล้ว แต่อัปโหลดรูปภาพไม่สำเร็จ');
          }
        } else {
          alert('สร้างร้านอาหารใหม่เรียบร้อยแล้ว');
        }
      } else {
        // อัปเดตร้านที่มีอยู่
        await restaurantService.partialUpdate(restaurant.restaurant_id, formData);
        alert('อัปเดตข้อมูลร้านอาหารเรียบร้อยแล้ว');
      }
      
      onUpdate();
      onClose();
    } catch (err) {
      console.error('❌ Error saving restaurant:', err);
      console.error('❌ Request data that was sent:', formData);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error headers:', err.response?.headers);
      
      const errorMessage = type === 'create' 
        ? 'ไม่สามารถสร้างร้านอาหารได้'
        : 'ไม่สามารถอัปเดตข้อมูลได้';
      
      // แสดงข้อผิดพลาดที่เฉพาะเจาะจงจาก server
      if (err.response?.data) {
        const errors = err.response.data;
        let errorMessages = [];
        
        if (typeof errors === 'string') {
          errorMessages.push(errors);
        } else if (typeof errors === 'object') {
          for (const [field, messages] of Object.entries(errors)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
        }
        
        if (errorMessages.length > 0) {
          alert(`${errorMessage}\n\nรายละเอียด:\n${errorMessages.join('\n')}`);
        } else {
          alert(`${errorMessage}\n\nServer response: ${JSON.stringify(errors)}`);
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('รองรับเฉพาะไฟล์ JPG, PNG และ GIF');
        return;
      }

      // ตรวจสอบขนาดไฟล์ (จำกัดที่ 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
      }

      setSelectedFile(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    if (isCreateMode) {
      alert('กรุณาสร้างร้านก่อน จากนั้นค่อยอัปโหลดรูปภาพ');
      return;
    }

    try {
      setUploadLoading(true);
      
      const formDataUpload = new FormData();
      formDataUpload.append('image', selectedFile);

      // ใช้ restaurantService.uploadImage() แทน fetch โดยตรง
      const response = await restaurantService.uploadImage(restaurant.restaurant_id, formDataUpload);
      
      alert('อัปโหลดรูปภาพสำเร็จ!');
      setSelectedFile(null);
      setImagePreview(response.data.restaurant.image_display_url);
      onUpdate(); // อัปเดตรายการร้าน
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ';
      alert(errorMessage);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemovePreview = () => {
    setSelectedFile(null);
    if (isCreateMode) {
      setFormData({ ...formData, image_url: '' });
      setImagePreview(null);
    } else {
      setImagePreview(restaurant?.image_display_url || null);
    }
  };

  const isEditable = type === 'edit' || type === 'create';
  const isUploadMode = type === 'upload';
  const isCreateMode = type === 'create';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-secondary-900">
            {type === 'view' ? 'ข้อมูลร้านอาหาร' : 
             type === 'upload' ? 'อัปโหลดรูปภาพร้าน' : 
             type === 'create' ? 'สร้างร้านอาหารใหม่' :
             'แก้ไขข้อมูลร้านอาหาร'}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Image Upload Section - แสดงในทุกโหมดยกเว้น view */}
          {(isUploadMode || isEditable) && (
            <div className="mb-6 p-4 border border-secondary-200 rounded-lg bg-secondary-50">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">รูปภาพหน้าร้าน</h3>
              
              {/* Current/Preview Image */}
              {(imagePreview || formData.image_url) && (
                <div className="mb-4 text-center">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Restaurant Preview"
                    className="max-w-xs mx-auto h-48 object-cover rounded-lg border border-secondary-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {(selectedFile || isCreateMode) && (
                    <button
                      type="button"
                      onClick={handleRemovePreview}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      {isCreateMode ? 'ลบรูป' : 'ยกเลิกการเลือกรูป'}
                    </button>
                  )}
                </div>
              )}
              
              {/* URL Input - แสดงในโหมด create หรือ edit */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  URL รูปภาพ {isCreateMode && '(ทางเลือก)'}
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value });
                    if (e.target.value && !selectedFile) {
                      setImagePreview(e.target.value);
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  disabled={!isEditable}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
                />
                <p className="mt-1 text-sm text-secondary-500">
                  สามารถใส่ลิงก์รูปภาพจากอินเทอร์เน็ต
                </p>
              </div>
              
              {/* Separator */}
              <div className="mb-4 flex items-center">
                <div className="flex-grow border-t border-secondary-300"></div>
                <span className="px-4 text-sm text-secondary-500">หรือ</span>
                <div className="flex-grow border-t border-secondary-300"></div>
              </div>
              
              {/* File Input - แสดงในทุกโหมด */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  เลือกรูปภาพจากเครื่อง
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-secondary-500">
                  รองรับ JPG, PNG, GIF • ขนาดไม่เกิน 10MB
                  {isCreateMode && ' • จะอัปโหลดหลังสร้างร้านเสร็จ'}
                </p>
              </div>
              
              {/* Upload Button - แสดงเฉพาะเมื่อไม่ใช่โหมด create */}
              {!isCreateMode && selectedFile && (
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploadLoading}
                  className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadLoading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                </button>
              )}
            </div>
          )}
          
          {!isUploadMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อร้านอาหาร
              </label>
              <input
                type="text"
                value={formData.restaurant_name}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เจ้าของร้าน
              </label>
              {isCreateMode ? (
                <div>
                  <select
                    value={formData.user}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- เลือกเจ้าของร้าน --</option>
                    {availableUsers && availableUsers.length > 0 ? (
                      availableUsers.map(user => (
                        <option key={user.id || user.user_id} value={user.id || user.user_id}>
                          {user.username} ({user.email}) - Role: {user.role}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>ไม่มีผู้ใช้ที่สามารถเป็นเจ้าของร้านได้</option>
                    )}
                  </select>
                  {(!availableUsers || availableUsers.length === 0) && (
                    <div className="mt-1">
                      <p className="text-sm text-red-600">
                        ไม่พบผู้ใช้ที่สามารถเป็นเจ้าของร้านได้ (ต้องเป็นร้านทั่วไปหรือร้านพิเศษ และยังไม่มีร้าน)
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        <a href="/admin/users" className="hover:underline">
                          → ไปสร้างผู้ใช้ใหม่หรือเปลี่ยน Role ผู้ใช้ที่มีอยู่
                        </a>
                      </p>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-secondary-500">
                    ผู้ใช้ที่เลือกได้: {availableUsers ? availableUsers.length : 0} คน (ร้านทั่วไป/พิเศษที่ยังไม่มีร้าน)
                  </p>
                </div>
              ) : (
                <input
                  type="text"
                  value={restaurant?.user_username || 'ไม่พบข้อมูล'}
                  disabled
                  className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditable}
                rows={3}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ที่อยู่
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เวลาเปิด-ปิด
              </label>
              <input
                type="text"
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                disabled={!isEditable}
                placeholder="เช่น 08:00 - 22:00"
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                สถานะ
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              >
                <option value="open">เปิด</option>
                <option value="closed">ปิด</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ประเภทร้าน
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_special}
                  onChange={(e) => setFormData({ ...formData, is_special: e.target.checked })}
                  disabled={!isEditable}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded disabled:opacity-50"
                />
                <label className="ml-2 text-sm text-secondary-700">
                  ร้านพิเศษ
                </label>
              </div>
            </div>

            {/* Bank Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">ข้อมูลธนาคาร</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อธนาคาร
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เลขที่บัญชี
              </label>
              <input
                type="text"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อบัญชี
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            {/* Statistics - แสดงเฉพาะเมื่อไม่ใช่โหมดสร้างใหม่ */}
            {!isCreateMode && (
              <>
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">สถิติ</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    คะแนนเฉลี่ย
                  </label>
                  <input
                    type="text"
                    value={`${restaurant?.average_rating || 0}/5`}
                    disabled
                    className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    จำนวนรีวิว
                  </label>
                  <input
                    type="text"
                    value={`${restaurant?.total_reviews || 0} รีวิว`}
                    disabled
                    className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    วันที่สร้าง
                  </label>
                  <input
                    type="text"
                    value={restaurant?.created_at ? new Date(restaurant.created_at).toLocaleDateString('en-US') : ''}
                    disabled
                    className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    อัปเดตล่าสุด
                  </label>
                  <input
                    type="text"
                    value={restaurant?.updated_at ? new Date(restaurant.updated_at).toLocaleDateString('en-US') : ''}
                    disabled
                    className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                  />
                </div>
              </>
            )}
          </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              ปิด
            </button>
            {isEditable && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 
                  (isCreateMode ? 'กำลังสร้าง...' : 'กำลังบันทึก...') : 
                  (isCreateMode ? 'สร้างร้าน' : 'บันทึก')
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRestaurants; 