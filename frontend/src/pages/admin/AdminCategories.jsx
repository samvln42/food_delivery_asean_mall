import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslatedName, getTranslatedDescription } from '../../utils/translationHelpers';

const AdminCategories = () => {
  const { translate, currentLanguage } = useLanguage();
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
  }, [currentPage, searchTerm, currentLanguage]); // เพิ่ม currentLanguage

  const fetchCategories = async () => {
    try {
      const isSearching = searchTerm.trim();
      
      // Smart loading: แสดง loading เฉพาะเมื่อยังไม่มีข้อมูล หรือกำลังค้นหา
      if (categories.length === 0 || isSearching) {
        if (isSearching) {
          setSearching(true);
        } else {
          setLoading(true);
        }
      }
      
      console.log('🔍 Fetching categories with search:', searchTerm);
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        ordering: 'sort_order,category_name'
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
      setError(translate('admin.categories_load_failed'));
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleCreateCategory = async (formData) => {
    try {
      await categoryService.create(formData);
      fetchCategories(); // Refresh data
      alert(translate('admin.category_created_success'));
      closeModal();
    } catch (err) {
      console.error('Error creating category:', err);
      if (err.response?.data?.sort_order) {
        alert(translate('admin.sort_order_already_exists'));
      } else {
        alert(translate('admin.create_category_failed'));
      }
    }
  };

  const handleUpdateCategory = async (categoryId, formData) => {
    try {
      console.log('🔄 Updating category:', categoryId, formData);
      await categoryService.update(categoryId, formData);
      fetchCategories(); // Refresh data
      alert(translate('admin.category_updated_success'));
      closeModal();
    } catch (err) {
      console.error('Error updating category:', err);
      if (err.response?.data?.sort_order) {
        alert(translate('admin.sort_order_already_exists'));
      } else {
        alert(translate('admin.update_category_failed'));
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      // เช็คว่ามีสินค้าในหมวดหมู่นี้หรือไม่
      const category = categories.find(c => c.category_id === categoryId);
      const productsCount = category?.products_count || 0;
      
      if (productsCount > 0) {
        const confirmDelete = window.confirm(
          translate('admin.confirm_delete_category_with_products')
          || `หมวดหมู่นี้มี ${productsCount} สินค้า หากลบหมวดหมู่ สินค้าทั้งหมดจะถูกลบด้วย! ต้องการดำเนินการต่อหรือไม่?`
        );
        
        if (!confirmDelete) {
          setDeleteConfirm(null);
          return;
        }
      }
      
      await categoryService.delete(categoryId);
      fetchCategories(); // Refresh data
      alert(translate('admin.category_deleted_success') || 'ลบหมวดหมู่สำเร็จ');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      
      // แสดง error message ที่ชัดเจนขึ้น
      let errorMessage = translate('admin.delete_category_failed') || 'ไม่สามารถลบหมวดหมู่ได้';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
      setDeleteConfirm(null);
    }
  };

  const openModal = async (category, type) => {
    // ถ้าเป็น edit หรือ view ต้องดึงข้อมูลทุกภาษา
    if (category && (type === 'edit' || type === 'view')) {
      try {
        const response = await categoryService.getById(category.category_id, { allLanguages: true });
        setSelectedCategory(response.data);
      } catch (err) {
        console.error('Error fetching category details:', err);
        setSelectedCategory(category); // fallback ใช้ของเดิม
      }
    } else {
      setSelectedCategory(category);
    }
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
    const locale = currentLanguage === 'th' ? 'th-TH-u-ca-gregory' : currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
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
          <span className="ml-4 text-lg">{translate('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">{translate('admin.categories')}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-secondary-600">
            {translate('admin.categories_total', { count: categories.length })}
          </div>
          <button
            onClick={() => openModal(null, 'create')}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {translate('admin.add_category')}
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
              {translate('admin.search_categories')}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={translate('admin.categories_search_placeholder')}
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
                  title={translate('admin.clear_search')}
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
                  {translate('admin.table.image')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('admin.table.category_name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('admin.table.sort_order')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('admin.table.special_only')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('admin.table.product_count')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('admin.table.actions')}
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
                          alt={getTranslatedName(category, currentLanguage, category.category_name)}
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
                        {getTranslatedName(category, currentLanguage, category.category_name)}
                      </div>
                      {category.description && (
                        <div className="text-xs text-secondary-500 ml-2 truncate">
                          {getTranslatedDescription(category, currentLanguage, category.description).substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {category.sort_order || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.is_special_only 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {category.is_special_only ? translate('admin.category.special_only') : translate('admin.category.general')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {(category.products_count || 0)} {translate('common.items')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(category, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {translate('admin.action.view')}
                      </button>
                      <button
                        onClick={() => openModal(category, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {translate('admin.action.edit')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {translate('admin.action.delete')}
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
              {translate('admin.categories_empty_title')}
            </h3>
            <p className="text-secondary-500 mb-4">
              {searchTerm ? translate('admin.categories_empty_search_message') : translate('admin.categories_empty_message')}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal(null, 'create')}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                {translate('admin.add_first_category')}
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
            {searching ? translate('search.searching') : (loading ? translate('common.loading') : translate('common.load_more'))}
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
  const { translate, availableLanguages } = useLanguage();
  const [formData, setFormData] = useState({
    category_name: category?.category_name || '',
    description: category?.description || '',
    is_special_only: category?.is_special_only || false,
    sort_order: category?.sort_order || 0,
    // เพิ่มการแปลสำหรับแต่ละภาษา
    translations: {}
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.image_display_url || null);
  const [loading, setLoading] = useState(false);

  // ตั้งค่าการแปลเริ่มต้นเมื่อโหลดข้อมูลหมวดหมู่
  useEffect(() => {
    if (category?.translations) {
      const translations = {};
      category.translations.forEach(trans => {
        translations[trans.language_code] = {
          name: trans.translated_name || '',
          description: trans.translated_description || ''
        };
      });
      setFormData(prev => ({ ...prev, translations }));
    }
  }, [category]);

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
      alert(translate('admin.please_enter_category_name'));
      return;
    }

    // ตรวจสอบ sort_order ต้องเป็นตัวเลขและไม่เป็นลบ
    if (formData.sort_order < 0) {
      alert(translate('admin.sort_order_must_be_positive'));
      return;
    }

    try {
      setLoading(true);
      
      // สร้าง FormData สำหรับส่งรูปภาพ
      const submitData = new FormData();
      submitData.append('category_name', formData.category_name);
      submitData.append('description', formData.description);
      submitData.append('is_special_only', formData.is_special_only);
      submitData.append('sort_order', formData.sort_order);
      
      // เพิ่มการแปล (เฉพาะที่มีค่า)
      const validTranslations = {};
      Object.keys(formData.translations).forEach(langCode => {
        const translation = formData.translations[langCode];
        if (translation && translation.name && translation.name.trim()) {
          validTranslations[langCode] = {
            name: translation.name.trim(),
            description: translation.description ? translation.description.trim() : ''
          };
        }
      });
      console.log('📝 Valid translations to send:', validTranslations);
      submitData.append('translations', JSON.stringify(validTranslations));
      
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
  const modalTitle = type === 'create' ? translate('admin.category_modal.create_title') : 
                    type === 'edit' ? translate('admin.category_modal.edit_title') : translate('admin.category_modal.view_title');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
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
          
          {/* ชื่อหมวดหมู่ (ภาษาอังกฤษ) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('admin.category_modal.category_name_english')} *
            </label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              disabled={!isEditable}
              placeholder={translate('admin.category_modal.category_name_english')}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              required
            />
            <p className="text-xs text-secondary-500 mt-1">
              {translate('admin.category_modal.primary_name_hint')}
            </p>
          </div>

          {/* การแปลสำหรับแต่ละภาษา */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-secondary-800 mb-4">
              {translate('admin.category_modal.translations_title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableLanguages.filter(lang => lang.code !== 'en').map(lang => (
                <div key={lang.code} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                  <h4 className="text-sm font-medium text-secondary-700 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                      {lang.code.toUpperCase()}
                    </span>
                    {translate(`admin.language_${lang.code}`)}
                  </h4>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-secondary-600 mb-1">
                      {translate('admin.category_modal.category_name')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations[lang.code]?.name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [lang.code]: {
                            ...formData.translations[lang.code],
                            name: e.target.value
                          }
                        }
                      })}
                      disabled={!isEditable}
                      placeholder={`${translate('admin.category_modal.category_name')} ${translate(`admin.language_${lang.code}`)}`}
                      className="w-full p-2 border border-secondary-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">
                      {translate('admin.category_modal.description')}
                    </label>
                    <textarea
                      value={formData.translations[lang.code]?.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [lang.code]: {
                            ...formData.translations[lang.code],
                            description: e.target.value
                          }
                        }
                      })}
                      disabled={!isEditable}
                      placeholder={`${translate('admin.category_modal.description')} ${translate(`admin.language_${lang.code}`)}`}
                      rows={2}
                      className="w-full p-2 border border-secondary-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-100"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-secondary-500 mt-2">
              {translate('admin.category_modal.translations_optional_hint')}
            </p>
          </div>

          {/* คำอธิบาย (ภาษาอังกฤษ) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('admin.category_modal.description_english')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditable}
              placeholder={translate('admin.category_modal.description_english')}
              rows={3}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
            />
          </div>

          {/* การตั้งค่าอื่นๆ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {translate('admin.category_modal.sort_order')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                disabled={!isEditable}
                placeholder="0"
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
              <p className="text-xs text-secondary-500 mt-1">
                {translate('admin.category_modal.sort_order_hint')}
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_special_only}
                  onChange={(e) => setFormData({ ...formData, is_special_only: e.target.checked })}
                  disabled={!isEditable}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">
                  {translate('admin.category_modal.special_restaurant_only')}
                </span>
              </label>
            </div>
          </div>

          {/* รูปภาพหมวดหมู่ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('admin.category_modal.category_image')}
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
              {translate('admin.category_modal.supported_file_hint')}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('admin.category_modal.type')}
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
                <span className="text-sm text-secondary-700">{translate('admin.category.general')}</span>
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
                <span className="text-sm text-secondary-700">{translate('admin.category.special_only')}</span>
              </label>
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              {translate('admin.category_modal.special_only_hint')}
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
                  {translate('admin.table.sort_order')}
                </label>
                <input
                  type="text"
                  value={category.sort_order || 0}
                  disabled
                  className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('admin.table.product_count')}
                </label>
                <input
                  type="text"
                  value={`${category.products_count || 0} ${translate('common.items')}`}
                  disabled
                  className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate('admin.category_modal.status')}
                </label>
                <div className="p-3 border border-secondary-300 rounded-lg bg-secondary-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    category.is_special_only 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {category.is_special_only ? translate('admin.category.special_only') : translate('admin.category.general')}
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
              className="px-6 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              {translate('common.cancel')}
            </button>
            {isEditable && (
              <button
                type="submit"
                form="category-form"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {type === 'create' ? translate('admin.category_modal.create_category') : translate('admin.category_modal.save_changes')}
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
  const { translate } = useLanguage();
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
                {translate('admin.confirm_delete_category_title')}
              </h3>
              <p className="text-sm text-secondary-500">
                {translate('admin.confirm_delete_desc')}
              </p>
            </div>
          </div>
          
          <p className="text-secondary-700 mb-6">
            {translate('admin.confirm_delete_category', { name: getTranslatedName(category, currentLanguage, category.category_name) })}
            {category.products_count > 0 && (
              <span className="block text-red-600 text-sm mt-2">
                {translate('admin.category_has_products_warning', { count: category.products_count })}
              </span>
            )}
          </p>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              {translate('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              {translate('admin.action.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
