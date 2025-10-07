import React, { useState, useEffect } from 'react';
import { advertisementService } from '../../services/api';
import { toast } from '../../hooks/useNotification';

const AdminAdvertisements = () => {
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
      toast.error('ไม่สามารถโหลดข้อมูลโฆษณาได้');
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
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('รองรับเฉพาะไฟล์ JPG, PNG, GIF และ WebP');
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
      toast.error('กรุณาเลือกรูปภาพ');
      return;
    }

    setLoading(true);

    try {
      const data = {
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        image: imageFile,
      };

      console.log('Saving advertisement data:', {
        editingAd: editingAd ? editingAd.advertisement_id : null,
        data: data,
        imageFile: imageFile,
        formData: formData
      });

      if (editingAd) {
        console.log('Updating advertisement ID:', editingAd.advertisement_id);
        await advertisementService.update(editingAd.advertisement_id, data);
      } else {
        console.log('Creating new advertisement');
        await advertisementService.create(data);
      }

      toast.success(editingAd ? 'อัปเดตโฆษณาสำเร็จ' : 'เพิ่มโฆษณาสำเร็จ');
      fetchAdvertisements();
      closeModal();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'เกิดข้อผิดพลาด';
      toast.error(`ไม่สามารถบันทึกโฆษณาได้: ${errorMessage}`);
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
    if (!window.confirm('คุณต้องการลบโฆษณานี้หรือไม่?')) return;

    setLoading(true);
    try {
      await advertisementService.delete(id);
      toast.success('ลบโฆษณาสำเร็จ');
      fetchAdvertisements();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast.error('ไม่สามารถลบโฆษณาได้');
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
        <h1 className="text-3xl font-bold">จัดการโฆษณา/แบนเนอร์</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + เพิ่มโฆษณา
        </button>
      </div>

      {loading && (!Array.isArray(advertisements) || advertisements.length === 0) ? (
        <div className="text-center py-12">
          <div className="spinner-border text-primary"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
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
                  <span className="text-sm text-gray-600">ลำดับ: {ad.sort_order}</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      ad.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ad.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(ad)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(ad.advertisement_id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(advertisements) && advertisements.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">ยังไม่มีโฆษณา</p>
          <p className="text-gray-400 text-sm mt-2">คลิก "เพิ่มโฆษณา" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingAd ? 'แก้ไขโฆษณา' : 'เพิ่มโฆษณา'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปภาพโฆษณา {!editingAd && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    แนะนำ: 800x400px | ไฟล์: JPG, PNG, GIF, WebP | ขนาด: ไม่เกิน 5MB
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
                    ลำดับการแสดง
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
                    เลขน้อยจะแสดงก่อน
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
                    เปิดใช้งาน
                  </label>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'กำลังบันทึก...' : editingAd ? 'อัปเดต' : 'เพิ่ม'}
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
