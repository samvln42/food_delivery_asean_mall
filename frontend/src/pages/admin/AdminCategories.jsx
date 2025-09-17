import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../services/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Single useEffect with smart debouncing
  useEffect(() => {
    const isSearching = searchTerm.trim();
    
    // If searching and not on page 1, reset to page 1 first
    if (isSearching && currentPage !== 1) {
      setCurrentPage(1);
      return; // Don't fetch yet, wait for currentPage to update
    }

    const debounceTime = isSearching ? 500 : 0;

    const timeoutId = setTimeout(() => {
      fetchCategories();
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm]);

  const fetchCategories = async () => {
    try {
      const isSearching = searchTerm.trim();
      
      if (isSearching) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      console.log('🔍 Fetching categories with search:', searchTerm);
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        ordering: 'category_name'
      };

      // เพิ่ม search parameter เฉพาะเมื่อมีการค้นหา
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('📡 Sending API request with params:', params);
      const response = await categoryService.getAll(params);
      console.log('📦 API response:', response.data);
      
      if (response.data.results) {
        const newItems = response.data.results;
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
        if (currentPage === 1) {
          setCategories(newItems);
        } else {
          setCategories(prev => [...prev, ...newItems]);
        }
      } else {
        // กรณี backend ไม่ paginate
        if (currentPage === 1) {
          setCategories(response.data);
        } else {
          setCategories(prev => [...prev, ...response.data]);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleCreateCategory = async (formData) => {
    try {
      await categoryService.create(formData);
      fetchCategories(); // Refresh data
      alert('สร้างหมวดหมู่เรียบร้อยแล้ว');
      closeModal();
    } catch (err) {
      console.error('Error creating category:', err);
      alert('ไม่สามารถสร้างหมวดหมู่ได้');
    }
  };

  const handleUpdateCategory = async (categoryId, formData) => {
    try {
      await categoryService.update(categoryId, formData);
      fetchCategories(); // Refresh data
      alert('อัปเดตหมวดหมู่เรียบร้อยแล้ว');
      closeModal();
    } catch (err) {
      console.error('Error updating category:', err);
      alert('ไม่สามารถอัปเดตหมวดหมู่ได้');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await categoryService.delete(categoryId);
      fetchCategories(); // Refresh data
      alert('ลบหมวดหมู่เรียบร้อยแล้ว');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('ไม่สามารถลบหมวดหมู่ได้ อาจมีสินค้าที่เชื่อมโยงอยู่');
    }
  };

  const openModal = (category, type) => {
    setSelectedCategory(category);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setModalType('view');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && categories.length === 0) {
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
        <h1 className="text-3xl font-bold text-secondary-800">จัดการหมวดหมู่</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-secondary-600">
            รวม {categories.length} หมวดหมู่
          </div>
          <button
            onClick={() => openModal(null, 'create')}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            เพิ่มหมวดหมู่ใหม่
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค้นหาหมวดหมู่
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อหมวดหมู่..."
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
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  รูปภาพ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ชื่อหมวดหมู่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  เฉพาะร้านพิเศษ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  จำนวนสินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {categories.map((category) => (
                <tr key={category.category_id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {category.category_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {category.image_display_url ? (
                        <img
                          src={category.image_display_url}
                          alt={category.category_name}
                          className="w-12 h-12 object-cover rounded-lg border border-secondary-300"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <span className="text-secondary-400 text-xs">🍽️</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-secondary-900">
                        {category.category_name}
                      </div>
                      {category.description && (
                        <div className="text-xs text-secondary-500 ml-2 truncate">
                          {category.description.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.is_special_only 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {category.is_special_only ? 'เฉพาะร้านพิเศษ' : 'ร้านทั่วไป'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {category.products_count || 0} รายการ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(category, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดู
                      </button>
                      <button
                        onClick={() => openModal(category, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category)}
                        className="text-red-600 hover:text-red-900"
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

        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-30">📂</div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              ไม่พบหมวดหมู่
            </h3>
            <p className="text-secondary-500 mb-4">
              {searchTerm ? 'ลองปรับเปลี่ยนคำค้นหา' : 'ยังไม่มีหมวดหมู่ในระบบ'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal(null, 'create')}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                เพิ่มหมวดหมู่แรก
              </button>
            )}
          </div>
        )}
      </div>

      {/* Load more button */}
      {currentPage < totalPages && (
        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={loading || searching}
            className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {searching ? 'กำลังค้นหา...' : (loading ? 'กำลังโหลด...' : 'โหลดเพิ่ม')}
          </button>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <CategoryModal
          category={selectedCategory}
          type={modalType}
          onClose={closeModal}
          onSave={modalType === 'create' ? handleCreateCategory : handleUpdateCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          category={deleteConfirm}
          onConfirm={() => handleDeleteCategory(deleteConfirm.category_id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// Category Modal Component
const CategoryModal = ({ category, type, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    category_name: category?.category_name || '',
    description: category?.description || '',
    is_special_only: category?.is_special_only || false
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.image_display_url || null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // สร้าง preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_name.trim()) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    try {
      setLoading(true);
      
      // สร้าง FormData สำหรับส่งรูปภาพ
      const submitData = new FormData();
      submitData.append('category_name', formData.category_name);
      submitData.append('description', formData.description);
      submitData.append('is_special_only', formData.is_special_only);
      
      // เพิ่มรูปภาพถ้ามี
      if (imageFile) {
        submitData.append('image', imageFile);
      }
      
      if (type === 'create') {
        await onSave(submitData);
      } else if (type === 'edit') {
        await onSave(category.category_id, submitData);
      }
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  const isEditable = type === 'edit' || type === 'create';
  const modalTitle = type === 'create' ? 'เพิ่มหมวดหมู่ใหม่' : 
                    type === 'edit' ? 'แก้ไขหมวดหมู่' : 'ข้อมูลหมวดหมู่';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-secondary-900">
            {modalTitle}
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="category-form" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ชื่อหมวดหมู่
            </label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              disabled={!isEditable}
              placeholder="กรอกชื่อหมวดหมู่"
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              คำอธิบาย
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditable}
              placeholder="กรอกคำอธิบายหมวดหมู่ (ไม่บังคับ)"
              rows={3}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
            />
          </div>

          {/* รูปภาพหมวดหมู่ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              รูปภาพหมวดหมู่
            </label>
            
            {/* แสดงรูปภาพปัจจุบัน */}
            {imagePreview && (
              <div className="mb-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-secondary-300"
                />
              </div>
            )}
            
            {/* ช่องอัปโหลดรูป */}
            {isEditable && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            )}
            
            <p className="text-xs text-secondary-500 mt-1">
              รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ประเภทหมวดหมู่
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_special_only"
                  value={false}
                  checked={!formData.is_special_only}
                  onChange={(e) => setFormData({ ...formData, is_special_only: false })}
                  disabled={!isEditable}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">ร้านทั่วไป</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_special_only"
                  value={true}
                  checked={formData.is_special_only}
                  onChange={(e) => setFormData({ ...formData, is_special_only: true })}
                  disabled={!isEditable}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">เฉพาะร้านพิเศษ</span>
              </label>
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              หมวดหมู่เฉพาะร้านพิเศษจะแสดงเฉพาะในร้านที่มีสถานะพิเศษเท่านั้น
            </p>
          </div>

          {category && type !== 'create' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ID
                </label>
                <input
                  type="text"
                  value={category.category_id}
                  disabled
                  className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  จำนวนสินค้า
                </label>
                <input
                  type="text"
                  value={`${category.products_count || 0} รายการ`}
                  disabled
                  className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  สถานะหมวดหมู่
                </label>
                <div className="p-3 border border-secondary-300 rounded-lg bg-secondary-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    category.is_special_only 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {category.is_special_only ? 'เฉพาะร้านพิเศษ' : 'ร้านทั่วไป'}
                  </span>
                </div>
              </div>
            </div>
          )}

          </form>
        </div>

        {/* Fixed Footer for buttons */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              ยกเลิก
            </button>
            {isEditable && (
              <button
                type="submit"
                form="category-form"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ category, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-secondary-900">
                ยืนยันการลบหมวดหมู่
              </h3>
              <p className="text-sm text-secondary-500">
                การดำเนินการนี้ไม่สามารถยกเลิกได้
              </p>
            </div>
          </div>
          
          <p className="text-secondary-700 mb-6">
            คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "<strong>{category.category_name}</strong>" ?
            {category.products_count > 0 && (
              <span className="block text-red-600 text-sm mt-2">
                ⚠️ หมวดหมู่นี้มีสินค้า {category.products_count} รายการ การลบอาจส่งผลกระทบต่อสินค้าเหล่านั้น
              </span>
            )}
          </p>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              ลบหมวดหมู่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
