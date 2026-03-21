import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiX, FiEye } from 'react-icons/fi';
import { FaTags, FaTheaterMasks } from 'react-icons/fa';
import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { venueCategoryService } from '../../services/api';

const AdminVenueCategories = () => {
  const { translate } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    icon: null,
    icon_url: '',
    sort_order: 0,
    is_active: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await venueCategoryService.getAll();
      const fetchedCategories = response.data?.results || response.data || [];
      const categoriesArray = Array.isArray(fetchedCategories) ? fetchedCategories : [];
      setCategories(categoriesArray);
      setFilteredCategories(categoriesArray);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = [...categories];

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.category_name.toLowerCase().includes(query) ||
          cat.icon.includes(query)
      );
    }

    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  const handleCreate = () => {
    setFormData({
      category_name: '',
      description: '',
      icon: null,
      icon_url: '',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setFormData({
      category_name: category.category_name || '',
      description: category.description || '',
      icon: null,
      icon_url: category.icon_url || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active !== undefined ? category.is_active : true,
    });
    setSelectedCategory(category);
    setModalType('edit');
    setShowModal(true);
  };

  const handleView = (category) => {
    setSelectedCategory(category);
    setModalType('view');
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (window.confirm(translate('entertainment.category_delete_confirm') || `ยืนยันการลบหมวดหมู่ "${category.category_name}"?`)) {
      try {
        await venueCategoryService.delete(category.category_id);
        await fetchCategories();
        alert(translate('entertainment.category_delete_success') || 'ลบหมวดหมู่สำเร็จ');
      } catch (err) {
        console.error('Error deleting category:', err);
        alert(err.response?.data?.detail || err.message || translate('entertainment.category_save_error') || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (modalType === 'create') {
        await venueCategoryService.create(formData);
        alert(translate('entertainment.category_add_success') || 'เพิ่มหมวดหมู่สำเร็จ');
      } else if (modalType === 'edit') {
        await venueCategoryService.partialUpdate(selectedCategory.category_id, formData);
        alert(translate('entertainment.category_edit_success') || 'แก้ไขหมวดหมู่สำเร็จ');
      }
      setShowModal(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert(err.response?.data?.detail || err.message || translate('entertainment.category_save_error') || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <span className="ml-4 text-lg">{translate('common.loading') || 'กำลังโหลด...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          <Squares2X2Icon className="h-6 w-6 mr-2 text-primary-600" /> {translate('entertainment.manage_categories') || 'จัดการหมวดหมู่สถานที่บันเทิง'}
        </h1>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>{translate('entertainment.add_category') || 'เพิ่มหมวดหมู่'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder={translate('entertainment.search_categories') || 'ค้นหาหมวดหมู่...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div
              key={category.category_id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {category.icon_display_url ? (
                    <img src={category.icon_display_url} alt={category.category_name} className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center text-secondary-400">
                      <FaTheaterMasks className="w-12 h-12" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {category.category_name}
                    </h3>
                    <p className="text-sm text-secondary-500">
                      {translate('entertainment.order_label') || 'ลำดับ'}: {category.sort_order}
                    </p>
                    {category.venues_count !== undefined && (
                      <p className="text-xs text-secondary-400">
                        {translate('entertainment.venues_count') || 'สถานที่'}: {category.venues_count}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleView(category)}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  title={translate('entertainment.view_details') || 'ดูรายละเอียด'}
                >
                  <FiEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="px-3 py-1 text-yellow-600 hover:bg-yellow-50 rounded"
                  title={translate('entertainment.edit') || 'แก้ไข'}
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                  title={translate('entertainment.delete') || 'ลบ'}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-secondary-500">{translate('entertainment.no_data') || 'ไม่พบข้อมูล'}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-secondary-800">
                {modalType === 'create'
                  ? translate('entertainment.add_category_title') || 'เพิ่มหมวดหมู่'
                  : modalType === 'edit'
                  ? translate('entertainment.edit_category_title') || 'แก้ไขหมวดหมู่'
                  : translate('entertainment.category_details_title') || 'รายละเอียดหมวดหมู่'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {modalType === 'view' && selectedCategory ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.category_name_label') || 'ชื่อหมวดหมู่'}
                    </label>
                    <p className="text-secondary-900">{selectedCategory.category_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.icon_label') || 'ไอคอน'}
                    </label>
                    {selectedCategory.icon_display_url ? (
                      <img src={selectedCategory.icon_display_url} alt={selectedCategory.category_name} className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="flex items-center justify-center text-secondary-400">
                        <FaTheaterMasks className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  {selectedCategory.description && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.description_label') || 'คำอธิบาย'}
                      </label>
                      <p className="text-secondary-900">{selectedCategory.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.status_label') || 'สถานะ'}
                    </label>
                    <p className="text-secondary-900">{selectedCategory.is_active ? translate('entertainment.active_status') || 'เปิดใช้งาน' : translate('entertainment.inactive_status') || 'ปิดใช้งาน'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.sort_order_label') || 'ลำดับ'}
                    </label>
                    <p className="text-secondary-900">{selectedCategory.sort_order}</p>
                  </div>
                </div>
              ) : (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.category_name_label') || 'ชื่อหมวดหมู่'} *
                    </label>
                    <input
                      type="text"
                      value={formData.category_name}
                      onChange={(e) =>
                        setFormData({ ...formData, category_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.description_label') || 'คำอธิบาย'}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows="3"
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.icon_label') || 'ไอคอน'} ({translate('entertainment.image') || 'รูปภาพ'})
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.files[0] })
                      }
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {formData.icon_url && !formData.icon && (
                      <p className="mt-2 text-sm text-secondary-500">{translate('common.or') || 'หรือ'} {translate('common.enter') || 'ใส่'} URL:</p>
                    )}
                  </div>
                  {formData.icon_url && !formData.icon && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.icon_label') || 'ไอคอน'} URL
                      </label>
                      <input
                        type="text"
                        value={formData.icon_url}
                        onChange={(e) =>
                          setFormData({ ...formData, icon_url: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.checked })
                        }
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-secondary-700">{translate('entertainment.is_active') || 'เปิดใช้งาน'}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {translate('entertainment.sort_order_label') || 'ลำดับ'}
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </form>
              )}
            </div>

            {modalType !== 'view' && (
              <div className="flex justify-end space-x-3 p-6 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  {translate('common.cancel') || 'ยกเลิก'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {translate('common.save') || 'บันทึก'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVenueCategories;
