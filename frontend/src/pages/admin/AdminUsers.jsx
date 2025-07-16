import React, { useState, useEffect, useRef } from 'react';
import { userService } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Single useEffect with smart debouncing
  useEffect(() => {
    const isSearchOrFilter = searchTerm || roleFilter !== 'all';
    
    // If searching/filtering and not on page 1, reset to page 1 first
    if (isSearchOrFilter && currentPage !== 1) {
      setCurrentPage(1);
      return; // Don't fetch yet, wait for currentPage to update
    }

    const debounceTime = isSearchOrFilter ? 500 : 0;

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const isSearchOrFilter = searchTerm || roleFilter !== 'all';
      
      if (isSearchOrFilter) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        ordering: '-date_joined'
      };

      // เพิ่ม search parameter เฉพาะเมื่อมีการค้นหา
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // เพิ่ม role filter เฉพาะเมื่อไม่ใช่ "all"
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      const response = await userService.getAll(params);
      
      if (response.data.results) {
        setUsers(response.data.results);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
        setTotalPages(1); 
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        setUsers([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      let errorMessage = 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้';
      if (err.response?.status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งาน';
      } else if (err.response?.status === 404) {
        errorMessage = 'ไม่พบ API endpoint สำหรับผู้ใช้งาน';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };



  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.partialUpdate(userId, { role: newRole });
      fetchUsers(); // Refresh data
      alert(`อัปเดต Role ผู้ใช้เป็น ${getRoleName(newRole)} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('❌ Error updating user role:', err);
      console.error('Response:', err.response?.data);
      
      let errorMessage = 'ไม่สามารถอัปเดต Role ได้';
      if (err.response?.status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้รายนี้';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    try {
      // ยืนยันการลบ
      const confirmation = window.confirm(
        `คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${username}"?\n\nการดำเนินการนี้ไม่สามารถกู้คืนได้`
      );
      
      if (!confirmation) {
        return;
      }

      await userService.delete(userId);
      fetchUsers(); // Refresh data
      alert(`ลบผู้ใช้ "${username}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      console.error('Response:', err.response?.data);
      
      let errorMessage = 'ไม่สามารถลบผู้ใช้ได้';
      if (err.response?.status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์ลบผู้ใช้รายนี้';
      } else if (err.response?.status === 404) {
        errorMessage = 'ไม่พบผู้ใช้ที่ต้องการลบ';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      alert(errorMessage);
    }
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setModalType('create');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalType('view');
  };

  const handleSearch = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    // Reset page will be handled in useEffect
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    // Reset page will be handled in useEffect
  };

  const clearSearch = () => {
    setSearchTerm('');
    // Reset page will be handled in useEffect
  };

  const getRoleName = (role) => {
    const roleNames = {
      'customer': 'ลูกค้า',
      'general_restaurant': 'ร้านทั่วไป',
      'special_restaurant': 'ร้านพิเศษ',
      'admin': 'แอดมิน'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'customer': 'bg-blue-100 text-blue-800',
      'general_restaurant': 'bg-green-100 text-green-800',
      'special_restaurant': 'bg-yellow-100 text-yellow-800',
      'admin': 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && users.length === 0) {
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
        <h1 className="text-3xl font-bold text-secondary-800">จัดการผู้ใช้งาน</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={openCreateModal}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>เพิ่มผู้ใช้ใหม่</span>
          </button>
          <div className="text-sm text-secondary-600">
            รวม {users.length} ผู้ใช้งาน
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค้นหาผู้ใช้งาน
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้, อีเมล, เบอร์โทร..."
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
              บทบาท
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              <option value="customer">ลูกค้า</option>
              <option value="general_restaurant">ร้านทั่วไป</option>
              <option value="special_restaurant">ร้านพิเศษ</option>
              <option value="admin">แอดมิน</option>
            </select>
          </div>
        </div>
        
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ผู้ใช้งาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ข้อมูลติดต่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 mr-4">
                        <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-secondary-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {user.email}
                    </div>
                    <div className="text-sm text-secondary-500">
                      {user.phone_number || 'ไม่ระบุ'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                      
                      {user.role !== 'customer' && user.role !== 'admin' && !user.restaurant_info && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full" title="ยังไม่มีร้าน">
                          ไม่มีร้าน
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {formatDate(user.date_joined)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openModal(user, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดู
                      </button>
                      <button
                        onClick={() => openModal(user, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        แก้ไข
                      </button>
                      {user.role !== 'admin' && (
                        <>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs border border-secondary-300 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="customer">ลูกค้า</option>
                            <option value="general_restaurant">ร้านทั่วไป</option>
                            <option value="special_restaurant">ร้านพิเศษ</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            title="ลบผู้ใช้"
                          >
                            ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-30">👥</div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              ไม่พบผู้ใช้งาน
            </h3>
            <p className="text-secondary-500 mb-4">
              {searchTerm || roleFilter !== 'all' 
                ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง'
                : 'ยังไม่มีผู้ใช้งานในระบบ'
              }
            </p>
            {(!searchTerm && roleFilter === 'all') && (
              <button
                onClick={openCreateModal}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>เพิ่มผู้ใช้คนแรก</span>
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
        <UserModal
          user={selectedUser}
          type={modalType}
          onClose={closeModal}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};

// User Detail Modal Component
const UserModal = ({ user, type, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    address: user?.address || '',
    role: user?.role || 'customer',
    is_active: user?.is_active !== false,
    password: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type !== 'edit' && type !== 'create') return;

    try {
      setLoading(true);
      
      if (type === 'create') {
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!formData.username.trim()) {
          alert('กรุณาใส่ชื่อผู้ใช้');
          return;
        }
        if (!formData.email.trim()) {
          alert('กรุณาใส่อีเมล');
          return;
        }
        if (!formData.password.trim()) {
          alert('กรุณาใส่รหัสผ่าน');
          return;
        }

        // สร้างผู้ใช้ใหม่
        await userService.create(formData);
        alert('สร้างผู้ใช้ใหม่เรียบร้อยแล้ว');
      } else {
        // อัปเดตผู้ใช้ที่มีอยู่
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // ไม่เปลี่ยนรหัสผ่านหากไม่ใส่
        }
        
        await userService.partialUpdate(user.id, updateData);
        alert('อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว');
      }
      
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving user:', err);
      const errorMessage = type === 'create' 
        ? 'ไม่สามารถสร้างผู้ใช้ได้'
        : 'ไม่สามารถอัปเดตข้อมูลได้';
      
      // แสดงข้อผิดพลาดที่เฉพาะเจาะจงจาก server
      if (err.response?.data) {
        const errors = err.response.data;
        let errorMessages = [];
        
        for (const [field, messages] of Object.entries(errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        
        if (errorMessages.length > 0) {
          alert(`${errorMessage}\n\nรายละเอียด:\n${errorMessages.join('\n')}`);
        } else {
          alert(errorMessage);
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isEditable = type === 'edit' || type === 'create';
  const isCreateMode = type === 'create';

  const getRoleName = (role) => {
    const roleNames = {
      'customer': 'ลูกค้า',
      'general_restaurant': 'ร้านทั่วไป',
      'special_restaurant': 'ร้านพิเศษ',
      'admin': 'แอดมิน'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-secondary-900">
            {type === 'view' ? 'ข้อมูลผู้ใช้งาน' : 
             type === 'create' ? 'เพิ่มผู้ใช้ใหม่' :
             'แก้ไขข้อมูลผู้ใช้งาน'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อผู้ใช้ *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!isEditable}
                required={isCreateMode}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                อีเมล *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditable}
                required={isCreateMode}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                บทบาท
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              >
                <option value="customer">ลูกค้า</option>
                <option value="general_restaurant">ร้านทั่วไป</option>
                <option value="special_restaurant">ร้านพิเศษ</option>
                <option value="admin">แอดมิน</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ที่อยู่
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditable}
                rows={3}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            {isEditable && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  รหัสผ่าน {isCreateMode ? '*' : '(เว้นว่างถ้าไม่เปลี่ยน)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={isCreateMode}
                  placeholder={isCreateMode ? 'ใส่รหัสผ่าน' : 'เว้นว่างถ้าไม่เปลี่ยนรหัสผ่าน'}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {isEditable && (
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label className="ml-2 text-sm text-secondary-700">
                    เปิดใช้งานบัญชี
                  </label>
                </div>
              </div>
            )}

            {/* Statistics - แสดงเฉพาะเมื่อไม่ใช่โหมดสร้างใหม่ */}
            {!isCreateMode && (
              <>
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">ข้อมูลเพิ่มเติม</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    วันที่สมัคร
                  </label>
                  <input
                    type="text"
                    value={user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US') : ''}
                    disabled
                    className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    เข้าสู่ระบบล่าสุด
                  </label>
                  <input
                    type="text"
                    value={user?.last_login ? new Date(user.last_login).toLocaleDateString('en-US') : 'Never logged in'}
                    disabled
                    className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                  />
                </div>
              </>
            )}
          </div>

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
                  (isCreateMode ? 'สร้างผู้ใช้' : 'บันทึก')
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers; 