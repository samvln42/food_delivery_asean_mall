import React, { useState, useEffect } from 'react';
import { advertisementService } from '../../services/api';
import { toast } from '../../hooks/useNotification';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminAdvertisements = () => {
  const { translate } = useLanguage();
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    setLoading(true);
    try {
      const response = await advertisementService.getAll();
      
      // Handle paginated response
      let data = [];
      if (response.data && response.data.results) {
        // Paginated response
        data = Array.isArray(response.data.results) ? response.data.results : [];
      } else if (Array.isArray(response.data)) {
        // Direct array response
        data = response.data;
      } else {
        data = [];
      }
      
      setAdvertisements(data);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      toast.error(translate('admin.advertisements.load_error'));
      // Set empty array on error to prevent map error
      setAdvertisements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(translate('admin.advertisements.file_size_error'));
        return;
      }

      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(translate('admin.advertisements.file_type_error'));
        return;
      }

      setImageFile(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile && !editingAd) {
      toast.error(translate('admin.advertisements.select_image_required'));
      return;
    }

    setLoading(true);

    try {
      const data = {
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        image: imageFile,
      };

      if (editingAd) {
        await advertisementService.update(editingAd.advertisement_id, data);
      } else {
        await advertisementService.create(data);
      }

      toast.success(editingAd ? translate('admin.advertisements.update_success') : translate('admin.advertisements.create_success'));
      fetchAdvertisements();
      closeModal();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'เกิดข้อผิดพลาด';
      toast.error(`${translate('admin.advertisements.save_error')}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      sort_order: ad.sort_order || 0,
      is_active: ad.is_active,
    });
    setImagePreview(ad.image_display_url);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(translate('admin.advertisements.delete_confirm'))) return;

    setLoading(true);
    try {
      await advertisementService.delete(id);
      toast.success(translate('admin.advertisements.delete_success'));
      fetchAdvertisements();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast.error(translate('admin.advertisements.delete_error'));
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      sort_order: 0,
      is_active: true,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{translate('admin.advertisements.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + {translate('admin.advertisements.add_button')}
        </button>
      </div>

      {loading && (!Array.isArray(advertisements) || advertisements.length === 0) ? (
        <div className="text-center py-12">
          <div className="spinner-border text-primary"></div>
          <p className="mt-4 text-gray-600">{translate('common.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(advertisements) && advertisements.map((ad) => (
            <div key={ad.advertisement_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={ad.image_display_url || 'https://via.placeholder.com/800x400'}
                alt={`Advertisement ${ad.advertisement_id}`}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{translate('admin.advertisements.order')}: {ad.sort_order}</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      ad.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ad.is_active ? translate('admin.advertisements.active') : translate('admin.advertisements.inactive')}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(ad)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    {translate('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(ad.advertisement_id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    {translate('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(advertisements) && advertisements.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">{translate('admin.advertisements.no_advertisements')}</p>
          <p className="text-gray-400 text-sm mt-2">{translate('admin.advertisements.click_to_add')}</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingAd ? translate('admin.advertisements.edit_title') : translate('admin.advertisements.add_title')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translate('admin.advertisements.image_label')} {!editingAd && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {translate('admin.advertisements.image_requirements')}
                  </p>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-3 w-full h-48 object-cover rounded border"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translate('admin.advertisements.sort_order_label')}
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {translate('admin.advertisements.sort_order_help')}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    {translate('admin.advertisements.is_active_label')}
                  </label>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {translate('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? translate('common.saving') : editingAd ? translate('admin.advertisements.edit_title') : translate('admin.advertisements.add_button')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdvertisements;
