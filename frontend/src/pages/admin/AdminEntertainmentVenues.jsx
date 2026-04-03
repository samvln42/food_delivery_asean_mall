import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiSearch, FiEdit2, FiTrash2, FiEye, FiPlus, FiX, FiImage, FiUpload, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaMapMarkerAlt, FaPhone, FaClock, FaStar, FaTheaterMasks } from 'react-icons/fa';
import { LuMapPin } from 'react-icons/lu';
import { entertainmentVenueService, venueCategoryService } from '../../services/api';
import MapPicker from '../../components/maps/MapPicker';

const AdminEntertainmentVenues = () => {
  const { translate } = useLanguage();
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create', 'gallery'
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [venueImages, setVenueImages] = useState([]);
  const [formData, setFormData] = useState({
    venue_name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    phone_number: '',
    opening_hours: '',
    venue_type: '',
    category: null,
    status: 'open',
    image: null,
  });

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.venue_type = typeFilter;
      
      const response = await entertainmentVenueService.getAll(params);
      const fetchedVenues = response.data?.results || response.data || [];
      setVenues(fetchedVenues);
      setFilteredVenues(fetchedVenues);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await venueCategoryService.getAll();
      setCategories(response.data?.results || response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVenues();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, typeFilter]);


  const handleCreate = () => {
    setFormData({
      venue_name: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
      phone_number: '',
      opening_hours: '',
      venue_type: '',
      category: null,
      status: 'open',
      image: null,
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleEdit = (venue) => {
    setFormData({
      venue_name: venue.venue_name || '',
      description: venue.description || '',
      address: venue.address || '',
      latitude: venue.latitude || '',
      longitude: venue.longitude || '',
      phone_number: venue.phone_number || '',
      opening_hours: venue.opening_hours || '',
      venue_type: venue.venue_type || '',
      category: venue.category || null,
      status: venue.status || 'open',
      image: null,
    });
    setSelectedVenue(venue);
    setModalType('edit');
    setShowModal(true);
  };

  const handleView = (venue) => {
    setSelectedVenue(venue);
    setModalType('view');
    setShowModal(true);
  };

  const handleDelete = async (venue) => {
    if (window.confirm(translate('entertainment.delete_confirm') || `ยืนยันการลบ "${venue.venue_name}"?`)) {
      try {
        await entertainmentVenueService.delete(venue.venue_id);
        await fetchVenues();
        alert(translate('entertainment.delete_success') || 'ลบสถานที่สำเร็จ');
      } catch (err) {
        console.error('Error deleting venue:', err);
        alert(err.response?.data?.detail || err.message || translate('entertainment.save_error') || 'เกิดข้อผิดพลาดในการลบสถานที่');
      }
    }
  };

  const handleManageGallery = async (venue) => {
    setSelectedVenue(venue);
    try {
      const response = await entertainmentVenueService.getImages(venue.venue_id);
      setVenueImages(response.data || []);
      setShowGalleryModal(true);
    } catch (err) {
      console.error('Error fetching images:', err);
      setVenueImages([]);
      setShowGalleryModal(true);
    }
  };

  const handleAddImage = async (e) => {
    const files = Array.from(e.target.files);
    if (!selectedVenue) return;
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('sort_order', venueImages.length + 1);
        formData.append('caption', '');
        
        const response = await entertainmentVenueService.uploadImage(selectedVenue.venue_id, formData);
        setVenueImages([...venueImages, response.data]);
      }
      alert('อัปโหลดรูปภาพสำเร็จ');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!selectedVenue) return;
    if (window.confirm(translate('entertainment.delete_image') || 'ยืนยันการลบรูปภาพนี้?')) {
      try {
        await entertainmentVenueService.deleteImage(selectedVenue.venue_id, imageId);
        setVenueImages(venueImages.filter((img) => img.image_id !== imageId));
        alert('ลบรูปภาพสำเร็จ');
      } catch (err) {
        console.error('Error deleting image:', err);
        alert(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ');
      }
    }
  };

  const handleUpdateCaption = (imageId, caption) => {
    setVenueImages(
      venueImages.map((img) =>
        img.image_id === imageId ? { ...img, caption } : img
      )
    );
  };

  const handleMoveImage = (imageId, direction) => {
    const index = venueImages.findIndex((img) => img.image_id === imageId);
    if (index === -1) return;

    const newImages = [...venueImages];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }

    // Update sort_order
    newImages.forEach((img, idx) => {
      img.sort_order = idx + 1;
    });

    setVenueImages(newImages);
  };

  const handleSaveGallery = async () => {
    if (!selectedVenue) return;
    
    try {
      // Prepare images data for batch update
      const imagesData = venueImages.map((img, index) => ({
        image_id: img.image_id,
        caption: img.caption || '',
        sort_order: index + 1,
        is_primary: img.is_primary || false,
      }));
      
      await entertainmentVenueService.batchUpdateImages(selectedVenue.venue_id, imagesData);
      alert('บันทึกรูปภาพสำเร็จ');
      setShowGalleryModal(false);
      await fetchVenues(); // Refresh venues to get updated images
    } catch (err) {
      console.error('Error saving gallery:', err);
      alert(err.response?.data?.detail || err.message || 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ');
    }
  };

  const handleSave = async () => {
    try {
      // Prepare data for API
      const dataToSend = { ...formData };
      
      // Convert empty strings to null for optional fields
      if (dataToSend.latitude === '') dataToSend.latitude = null;
      if (dataToSend.longitude === '') dataToSend.longitude = null;
      if (dataToSend.phone_number === '') dataToSend.phone_number = null;
      if (dataToSend.opening_hours === '') dataToSend.opening_hours = null;
      if (dataToSend.description === '') dataToSend.description = null;
      if (dataToSend.venue_type === '') dataToSend.venue_type = null;
      
      // Convert category to integer if it's a string
      if (dataToSend.category && typeof dataToSend.category === 'string') {
        dataToSend.category = parseInt(dataToSend.category) || null;
      }
      
      // Convert latitude/longitude to number if they're strings and round to 12 decimal places
      if (dataToSend.latitude && typeof dataToSend.latitude === 'string') {
        const lat = parseFloat(dataToSend.latitude);
        if (!isNaN(lat)) {
          // Round to 12 decimal places
          dataToSend.latitude = Math.round(lat * 1e12) / 1e12;
        } else {
          dataToSend.latitude = null;
        }
      }
      if (dataToSend.longitude && typeof dataToSend.longitude === 'string') {
        const lng = parseFloat(dataToSend.longitude);
        if (!isNaN(lng)) {
          // Round to 12 decimal places
          dataToSend.longitude = Math.round(lng * 1e12) / 1e12;
        } else {
          dataToSend.longitude = null;
        }
      }
      // Also round if they're already numbers
      if (typeof dataToSend.latitude === 'number' && !isNaN(dataToSend.latitude)) {
        dataToSend.latitude = Math.round(dataToSend.latitude * 1e12) / 1e12;
      }
      if (typeof dataToSend.longitude === 'number' && !isNaN(dataToSend.longitude)) {
        dataToSend.longitude = Math.round(dataToSend.longitude * 1e12) / 1e12;
      }
      
      if (modalType === 'create') {
        await entertainmentVenueService.create(dataToSend);
        alert(translate('entertainment.add_success') || 'เพิ่มสถานที่สำเร็จ');
      } else if (modalType === 'edit') {
        await entertainmentVenueService.partialUpdate(selectedVenue.venue_id, dataToSend);
        alert(translate('entertainment.edit_success') || 'แก้ไขสถานที่สำเร็จ');
      }
      setShowModal(false);
      await fetchVenues();
    } catch (err) {
      console.error('Error saving venue:', err);
      const errorMessage = err.response?.data?.detail || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.message) ||
                          translate('entertainment.save_error') || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      alert(errorMessage);
    }
  };

  const getUniqueTypes = () => {
    const types = [...new Set(venues.map((v) => v.venue_type).filter(Boolean))];
    return types;
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary-800">
          <FaTheaterMasks className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mr-2 text-primary-600 inline-block" /> {translate('entertainment.manage_venues') || 'จัดการสถานที่บันเทิง'}
        </h1>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>{translate('entertainment.add_venue') || 'เพิ่มสถานที่'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('common.search') || 'ค้นหา'}
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder={translate('entertainment.search_placeholder') || 'ค้นหาชื่อ, คำอธิบาย, หมวดหมู่...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('entertainment.status_filter') || 'สถานะ'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{translate('common.all') || 'ทั้งหมด'}</option>
              <option value="open">{translate('common.open') || 'เปิด'}</option>
              <option value="closed">{translate('common.closed') || 'ปิด'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {translate('entertainment.category_filter') || 'หมวดหมู่'}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{translate('common.all') || 'ทั้งหมด'}</option>
              {getUniqueTypes().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Venues Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.image_header') || 'รูปภาพ'}
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.venue_name_header') || 'ชื่อสถานที่'}
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.category_header') || 'หมวดหมู่'}
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.status_header') || 'สถานะ'}
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.rating_header') || 'เรตติ้ง'}
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.created_date_header') || 'วันที่สร้าง'}
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {translate('entertainment.actions_header') || 'การจัดการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredVenues.length > 0 ? (
                filteredVenues.map((venue) => (
                  <tr key={venue.venue_id} className="hover:bg-secondary-50">
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-12 xl:h-16 xl:w-16 rounded-lg overflow-hidden bg-secondary-200">
                        {venue.image_display_url ? (
                          <img
                            src={venue.image_display_url}
                            alt={venue.venue_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xl xl:text-2xl text-secondary-400">
                            <FaTheaterMasks className="h-8 w-8 xl:h-10 xl:w-10" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4">
                      <div className="text-sm font-medium text-secondary-900">
                        {venue.venue_name}
                      </div>
                      <div className="text-xs xl:text-sm text-secondary-500 line-clamp-1">
                        {venue.description}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
                        {venue.venue_type}
                      </span>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          venue.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {venue.status === 'open' ? translate('common.open') || 'เปิด' : translate('common.closed') || 'ปิด'}
                      </span>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1 text-xs" />
                        <span className="text-xs xl:text-sm font-medium">
                          {Number(venue.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="text-xs xl:text-sm text-secondary-500 ml-1">
                          ({venue.total_reviews || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-secondary-500">
                      {new Date(venue.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1 xl:space-x-2">
                        <button
                          onClick={() => handleView(venue)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title={translate('entertainment.view_details') || 'ดูรายละเอียด'}
                        >
                          <FiEye className="w-4 h-4 xl:w-5 xl:h-5" />
                        </button>
                        <button
                          onClick={() => handleManageGallery(venue)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title={translate('entertainment.manage_images') || 'จัดการรูปภาพ'}
                        >
                          <FiImage className="w-4 h-4 xl:w-5 xl:h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(venue)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title={translate('entertainment.edit') || 'แก้ไข'}
                        >
                          <FiEdit2 className="w-4 h-4 xl:w-5 xl:h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(venue)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title={translate('entertainment.delete') || 'ลบ'}
                        >
                          <FiTrash2 className="w-4 h-4 xl:w-5 xl:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-secondary-500">
                    {translate('entertainment.no_data') || 'ไม่พบข้อมูล'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Venues Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {filteredVenues.length > 0 ? (
          filteredVenues.map((venue) => (
            <div
              key={venue.venue_id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden bg-secondary-200">
                    {venue.image_display_url ? (
                      <img
                        src={venue.image_display_url}
                        alt={venue.venue_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl text-secondary-400">
                        <FaTheaterMasks className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-1 truncate">
                    {venue.venue_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary-500 line-clamp-2 mb-2">
                    {venue.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
                      {venue.venue_type}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        venue.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {venue.status === 'open' ? translate('common.open') || 'เปิด' : translate('common.closed') || 'ปิด'}
                    </span>
                    <div className="flex items-center">
                      <FaStar className="text-yellow-400 mr-1 text-xs" />
                      <span className="text-xs font-medium">
                        {Number(venue.average_rating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-secondary-500 ml-1">
                        ({venue.total_reviews || 0})
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleView(venue)}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-1"
                    >
                      <FiEye className="w-4 h-4" />
                      <span className="hidden sm:inline">{translate('common.view') || 'ดู'}</span>
                    </button>
                    <button
                      onClick={() => handleManageGallery(venue)}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-purple-50 text-purple-600 rounded hover:bg-purple-100 flex items-center justify-center gap-1"
                    >
                      <FiImage className="w-4 h-4" />
                      <span className="hidden sm:inline">{translate('entertainment.image') || 'รูป'}</span>
                    </button>
                    <button
                      onClick={() => handleEdit(venue)}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 flex items-center justify-center gap-1"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{translate('entertainment.edit') || 'แก้ไข'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(venue)}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center gap-1"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{translate('entertainment.delete') || 'ลบ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-secondary-500">{translate('entertainment.no_data') || 'ไม่พบข้อมูล'}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto m-2 sm:m-0">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-secondary-800 pr-2">
                {modalType === 'create'
                  ? translate('entertainment.add_venue_title') || 'เพิ่มสถานที่บันเทิง'
                  : modalType === 'edit'
                  ? translate('entertainment.edit_venue_title') || 'แก้ไขสถานที่บันเทิง'
                  : translate('entertainment.venue_details_title') || 'รายละเอียดสถานที่'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-secondary-400 hover:text-secondary-600 flex-shrink-0"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {modalType === 'view' && selectedVenue ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.venue_name_label') || 'ชื่อสถานที่'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.venue_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.category_label') || 'หมวดหมู่'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.venue_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.status_label') || 'สถานะ'}
                      </label>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          selectedVenue.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedVenue.status === 'open' ? translate('common.open') || 'เปิด' : translate('common.closed') || 'ปิด'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.rating_label') || 'เรตติ้ง'}
                      </label>
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span>{Number(selectedVenue.average_rating || 0).toFixed(1)}</span>
                        <span className="text-secondary-500 ml-1">
                          ({selectedVenue.total_reviews || 0} {translate('entertainment.reviews_label') || 'รีวิว'})
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.description_label') || 'คำอธิบาย'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.description}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <FaMapMarkerAlt className="inline mr-1" />
                        {translate('entertainment.address_label') || 'ที่อยู่'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <FaPhone className="inline mr-1" />
                        {translate('entertainment.phone_label') || 'เบอร์โทร'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.phone_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <FaClock className="inline mr-1" />
                        {translate('entertainment.opening_hours_label') || 'เวลาเปิด-ปิด'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.opening_hours}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.latitude_label') || 'ละติจูด'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.latitude}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.longitude_label') || 'ลองจิจูด'}
                      </label>
                      <p className="text-secondary-900">{selectedVenue.longitude}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.venue_name_label') || 'ชื่อสถานที่'} *
                      </label>
                      <input
                        type="text"
                        value={formData.venue_name}
                        onChange={(e) =>
                          setFormData({ ...formData, venue_name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.category_label') || 'หมวดหมู่'}
                      </label>
                      <select
                        value={formData.category || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value || null })
                        }
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">-- {translate('entertainment.category') || 'เลือกหมวดหมู่'} --</option>
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.venue_type') || 'ประเภท'} ({translate('common.deprecated') || 'เก่า'} - {translate('entertainment.use_category') || 'ใช้หมวดหมู่แทน'})
                      </label>
                      <input
                        type="text"
                        value={formData.venue_type}
                        onChange={(e) =>
                          setFormData({ ...formData, venue_type: e.target.value })
                        }
                        placeholder={translate('entertainment.venue_type_placeholder') || 'เช่น คาราโอเกะ, บาร์'}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="col-span-2">
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
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.address_label') || 'ที่อยู่'} *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    {/* Location Picker */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.location_label') || 'ตำแหน่งสถานที่'}
                      </label>
                      
                      
                      <MapPicker
                        initialCenter={{
                          lat: formData.latitude ? parseFloat(formData.latitude) : 13.7563,
                          lng: formData.longitude ? parseFloat(formData.longitude) : 100.5018
                        }}
                        onLocationSelect={(location) => {
                          setFormData(prev => ({
                            ...prev,
                            latitude: location.lat.toString(),
                            longitude: location.lng.toString()
                          }));
                        }}
                        height="250px"
                        zoom={formData.latitude ? 17 : 12}
                      />
                      
                      <p className="mt-2 text-xs text-secondary-500">
                        <LuMapPin className="inline w-3 h-3 mr-1" />
                        {translate('entertainment.map_hint') || 'เลื่อนแผนที่เพื่อเลือกตำแหน่ง'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.phone_label') || 'เบอร์โทร'}
                      </label>
                      <input
                        type="text"
                        value={formData.phone_number}
                        onChange={(e) =>
                          setFormData({ ...formData, phone_number: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.opening_hours_label') || 'เวลาเปิด-ปิด'}
                      </label>
                      <input
                        type="text"
                        value={formData.opening_hours}
                        onChange={(e) =>
                          setFormData({ ...formData, opening_hours: e.target.value })
                        }
                        placeholder={translate('entertainment.opening_hours_placeholder') || 'เช่น 10:00 - 22:00'}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.status_label') || 'สถานะ'}
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="open">{translate('common.open') || 'เปิด'}</option>
                        <option value="closed">{translate('common.closed') || 'ปิด'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        {translate('entertainment.image') || 'รูปภาพ'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.files[0] })
                        }
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {modalType !== 'view' && (
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  {translate('common.cancel') || 'ยกเลิก'}
                </button>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {translate('common.save') || 'บันทึก'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery Management Modal */}
      {showGalleryModal && selectedVenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto m-2 sm:m-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-secondary-800 truncate">
                  📷 {translate('entertainment.gallery_modal_title') || 'จัดการรูปภาพ'}
                </h2>
                <p className="text-xs sm:text-sm text-secondary-500 mt-1 truncate">
                  {selectedVenue.venue_name}
                </p>
                <p className="text-xs sm:text-sm text-secondary-500 mt-1 hidden sm:block">
                  {translate('entertainment.manage_images') || 'อัปโหลด, จัดการ และเรียงลำดับรูปภาพ'}
                </p>
              </div>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="text-secondary-400 hover:text-secondary-600 flex-shrink-0 self-end sm:self-auto"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Upload Section */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-secondary-50 rounded-lg">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <FiUpload className="inline mr-2" />
                  {translate('entertainment.upload_image') || 'อัปโหลดรูปภาพใหม่'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImage}
                  className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  {translate('common.supports_files') || 'สามารถเลือกหลายรูปได้ (รองรับ JPG, PNG, GIF)'}
                </p>
              </div>

              {/* Images Grid */}
              {venueImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {venueImages
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((image, index) => (
                      <div
                        key={image.image_id}
                        className="relative group bg-secondary-100 rounded-lg overflow-hidden"
                      >
                        <div className="aspect-square">
                          <img
                            src={image.image_display_url || image.image_url || image.image}
                            alt={image.caption || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          #{image.sort_order}
                        </div>
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col space-y-0.5 sm:space-y-1">
                          <button
                            onClick={() => handleMoveImage(image.image_id, 'up')}
                            disabled={index === 0}
                            className={`p-0.5 sm:p-1 rounded ${
                              index === 0
                                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                            title={translate('common.move_up') || 'ย้ายขึ้น'}
                          >
                            <FiArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveImage(image.image_id, 'down')}
                            disabled={index === venueImages.length - 1}
                            className={`p-0.5 sm:p-1 rounded ${
                              index === venueImages.length - 1
                                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                            title={translate('common.move_down') || 'ย้ายลง'}
                          >
                            <FiArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-1.5 sm:p-2">
                          <input
                            type="text"
                            value={image.caption || ''}
                            onChange={(e) =>
                              handleUpdateCaption(image.image_id, e.target.value)
                            }
                            placeholder={translate('entertainment.image_caption') || 'เพิ่มคำอธิบาย...'}
                            className="w-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-white bg-transparent border border-white border-opacity-30 rounded focus:outline-none focus:border-white placeholder-white placeholder-opacity-50"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteImage(image.image_id)}
                          className="absolute top-1 left-1 sm:top-2 sm:left-2 p-1 sm:p-1.5 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title={translate('entertainment.delete_image') || 'ลบรูป'}
                        >
                          <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiImage className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <p className="text-secondary-500">{translate('entertainment.no_images') || 'ยังไม่มีรูปภาพ'}</p>
                  <p className="text-sm text-secondary-400 mt-2">
                    {translate('entertainment.upload_image') || 'อัปโหลดรูปภาพเพื่อเริ่มต้น'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="w-full sm:w-auto px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
              >
                {translate('common.cancel') || 'ยกเลิก'}
              </button>
              <button
                onClick={handleSaveGallery}
                className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {translate('entertainment.save_gallery') || 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntertainmentVenues;
