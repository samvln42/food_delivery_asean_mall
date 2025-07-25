import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService, productService, categoryService } from '../../services/api';

const AdminRestaurantProducts = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantInfo();
      fetchProducts();
    }
  }, [restaurantId, currentPage, searchTerm, categoryFilter, availabilityFilter]);

  // แยก useEffect สำหรับ fetchCategories เพื่อรอให้ restaurant โหลดเสร็จก่อน
  useEffect(() => {
    if (restaurant) {
      fetchCategories();
    }
  }, [restaurant]);

  const fetchRestaurantInfo = async () => {
    try {
      const response = await restaurantService.getById(restaurantId);
      setRestaurant(response.data);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError('ไม่สามารถโหลดข้อมูลร้านอาหารได้');
    }
  };

  const fetchCategories = async () => {
    try {
      const params = { page_size: 100 };
      
      // เพิ่ม parameter restaurant_type ตามประเภทร้าน
      if (restaurant) {
        params.restaurant_type = restaurant.is_special ? 'special' : 'general';
      }
      
      const response = await categoryService.getAll(params);
      const allCategories = response.data.results || response.data;
      setCategories(allCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        search: searchTerm,
        restaurant_id: restaurantId,
        ordering: '-created_at'
      };

      if (categoryFilter) {
        params.category = categoryFilter;
      }

      if (availabilityFilter) {
        params.is_available = availabilityFilter === 'available';
      }

      const response = await productService.getAll(params);
      
      if (response.data.results) {
        setProducts(response.data.results);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      } else {
        setProducts(response.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (formData, imageFile) => {
    try {
      // ถ้ามีไฟล์รูปภาพ ให้ใช้ FormData
      if (imageFile) {
        const formDataWithFile = new FormData();
        formDataWithFile.append('product_name', formData.product_name);
        formDataWithFile.append('description', formData.description || '');
        formDataWithFile.append('price', formData.price);
        formDataWithFile.append('category', formData.category);
        formDataWithFile.append('restaurant', restaurantId);
        formDataWithFile.append('is_available', formData.is_available);
        formDataWithFile.append('image', imageFile);
        // ไม่ส่ง image_url ถ้ามีไฟล์ เพราะไฟล์มีความสำคัญกว่า
        
        // ใช้ productService.create() แทน fetch()
        await productService.create(formDataWithFile);
      } else {
        // ไม่มีไฟล์รูปภาพ ใช้วิธีเดิม (อาจมี image_url)
        await productService.create({ ...formData, restaurant: restaurantId });
      }
      
      fetchProducts(); // Refresh data
      alert('สร้างสินค้าเรียบร้อยแล้ว');
      closeModal();
    } catch (err) {
      console.error('Error creating product:', err);
      alert(err.message || 'ไม่สามารถสร้างสินค้าได้');
    }
  };

  const handleUpdateProduct = async (productId, formData) => {
    try {
      await productService.update(productId, { ...formData, restaurant: restaurantId });
      fetchProducts(); // Refresh data
      alert('อัปเดตสินค้าเรียบร้อยแล้ว');
      closeModal();
    } catch (err) {
      console.error('Error updating product:', err);
      alert('ไม่สามารถอัปเดตสินค้าได้');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productService.delete(productId);
      fetchProducts(); // Refresh data
      alert('ลบสินค้าเรียบร้อยแล้ว');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('ไม่สามารถลบสินค้าได้');
    }
  };

  const handleToggleAvailability = async (productId, isAvailable) => {
    try {
      await productService.partialUpdate(productId, { is_available: !isAvailable });
      fetchProducts(); // Refresh data
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('ไม่สามารถเปลี่ยนสถานะสินค้าได้');
    }
  };

  const openModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setModalType('view');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAvailabilityFilter = (e) => {
    setAvailabilityFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !restaurant) {
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
      {/* Header with Restaurant Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/restaurants')}
              className="text-secondary-600 hover:text-secondary-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-secondary-800">
                จัดการสินค้า - {restaurant?.restaurant_name}
              </h1>
              <p className="text-secondary-600 mt-1">
                จัดการสินค้าของร้าน {restaurant?.restaurant_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-secondary-600">จำนวนสินค้า</div>
              <div className="text-lg font-semibold text-secondary-900">{products.length} รายการ</div>
            </div>
            <button
              onClick={() => openModal(null, 'create')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>

        {restaurant && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-secondary-50 rounded-lg">
            <div>
              <div className="text-sm text-secondary-600">ประเภทร้าน</div>
              <div className={`text-sm font-medium ${restaurant.is_special ? 'text-yellow-600' : 'text-gray-600'}`}>
                {restaurant.is_special ? 'ร้านพิเศษ' : 'ร้านทั่วไป'}
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-600">สถานะ</div>
              <div className={`text-sm font-medium ${restaurant.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                {restaurant.status === 'open' ? 'เปิดให้บริการ' : 'ปิดร้าน'}
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-600">คะแนนเฉลี่ย</div>
              <div className="text-sm font-medium text-secondary-900">
                {restaurant.average_rating}/5 ({restaurant.total_reviews} รีวิว)
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-600">จำนวนสินค้าทั้งหมด</div>
              <div className="text-sm font-medium text-secondary-900">{restaurant.products_count || 0} รายการ</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค้นหาสินค้า
            </label>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              หมวดหมู่
            </label>
            <select
              value={categoryFilter}
              onChange={handleCategoryFilter}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                  {category.is_special_only && ' (เฉพาะร้านพิเศษ)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              สถานะ
            </label>
            <select
              value={availabilityFilter}
              onChange={handleAvailabilityFilter}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">ทุกสถานะ</option>
              <option value="available">มีให้บริการ</option>
              <option value="unavailable">ไม่มีให้บริการ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ราคา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  สถานะ
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
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {(product.image_display_url || product.image_url) && (
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.image_display_url || product.image_url}
                            alt={product.product_name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className={(product.image_display_url || product.image_url) ? 'ml-4' : ''}>
                        <div className="text-sm font-medium text-secondary-900">
                          {product.product_name}
                        </div>
                        <div className="text-sm text-secondary-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {product.category_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">
                      {formatPrice(product.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_available ? 'มีให้บริการ' : 'ไม่มีให้บริการ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {formatDate(product.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openModal(product, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดู
                      </button>
                      <button
                        onClick={() => openModal(product, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(product.product_id, product.is_available)}
                        className={product.is_available 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                        }
                      >
                        {product.is_available ? 'ปิดขาย' : 'เปิดขาย'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product)}
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

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-30">🍽️</div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              ไม่พบสินค้า
            </h3>
            <p className="text-secondary-500 mb-4">
              {searchTerm || categoryFilter || availabilityFilter
                ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง' 
                : 'ยังไม่มีสินค้าในร้านนี้'
              }
            </p>
            {!searchTerm && !categoryFilter && !availabilityFilter && (
              <button
                onClick={() => openModal(null, 'create')}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                เพิ่มสินค้าแรก
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

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct}
          type={modalType}
          categories={categories}
          restaurant={restaurant}
          onClose={closeModal}
          onSave={modalType === 'create' ? handleCreateProduct : handleUpdateProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          product={deleteConfirm}
          onConfirm={() => handleDeleteProduct(deleteConfirm.product_id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, type, categories, restaurant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    product_name: product?.product_name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || '',
    image_url: product?.image_url || '',
    is_available: product?.is_available !== undefined ? product.is_available : true
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // ตั้งค่า preview รูปภาพเมื่อเปิด modal
  React.useEffect(() => {
    if (product?.image_display_url) {
      setImagePreview(product.image_display_url);
    } else if (product?.image_url) {
      setImagePreview(product.image_url);
    }
  }, [product]);

  // ใช้หมวดหมู่ที่ได้จาก API โดยตรง (Backend กรองให้แล้ว)
  const availableCategories = categories;

  // ฟังก์ชันจัดการการเลือกไฟล์
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('รองรับเฉพาะไฟล์ JPG, PNG และ GIF');
        e.target.value = '';
        return;
      }

      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ฟังก์ชันอัปโหลดรูปภาพ
  const handleImageUpload = async () => {
    if (!selectedFile || !product) {
      return;
    }

    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`http://127.0.0.1:8000/api/products/${product.product_id}/upload_image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('อัปโหลดรูปภาพสำเร็จ');
        
        // อัปเดต preview ด้วย URL ใหม่
        if (data.product?.image_display_url) {
          setImagePreview(data.product.image_display_url);
        }
        
        // รีเฟรชข้อมูลสินค้า
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploadLoading(false);
      setSelectedFile(null);
    }
  };

  // ฟังก์ชันลบรูปภาพ preview
  const handleRemovePreview = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setFormData({ ...formData, image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_name.trim()) {
      alert('กรุณากรอกชื่อสินค้า');
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      alert('กรุณากรอกราคาที่ถูกต้อง');
      return;
    }
    
    if (!formData.category) {
      alert('กรุณาเลือกหมวดหมู่');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      if (type === 'create') {
        // ส่งไฟล์ไปพร้อมกับข้อมูลสินค้าตอนสร้างใหม่
        await onSave(submitData, selectedFile);
      } else if (type === 'edit') {
        await onSave(product.product_id, submitData);
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  const isEditable = type === 'edit' || type === 'create';
  const modalTitle = type === 'create' ? 'เพิ่มสินค้าใหม่' : 
                    type === 'edit' ? 'แก้ไขสินค้า' : 'ข้อมูลสินค้า';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                disabled={!isEditable}
                placeholder="กรอกชื่อสินค้า"
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ราคา *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={!isEditable}
                placeholder="0.00"
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                หมวดหมู่ *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={!isEditable}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {availableCategories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                    {category.is_special_only && ' (เฉพาะร้านพิเศษ)'}
                  </option>
                ))}
              </select>
              {restaurant && !restaurant.is_special && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ ร้านนี้เป็นร้านทั่วไป ไม่สามารถเลือกหมวดหมู่เฉพาะร้านพิเศษได้
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                สถานะ
              </label>
              <div className="flex items-center space-x-4 pt-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={() => setFormData({ ...formData, is_available: true })}
                    disabled={!isEditable}
                    className="mr-2 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">มีให้บริการ</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_available"
                    checked={!formData.is_available}
                    onChange={() => setFormData({ ...formData, is_available: false })}
                    disabled={!isEditable}
                    className="mr-2 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">ไม่มีให้บริการ</span>
                </label>
              </div>
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
                placeholder="คำอธิบายสินค้า"
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                รูปภาพสินค้า
              </label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {isEditable && (
                    <button
                      type="button"
                      onClick={handleRemovePreview}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {isEditable && (
                <div className="space-y-4">
                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      อัปโหลดรูปภาพจากเครื่อง
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {selectedFile && product && type === 'edit' && (
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={uploadLoading}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadLoading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-secondary-500 mt-1">
                      รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                      {selectedFile && type === 'create' && (
                        <span className="text-blue-600 block">
                          ✓ ไฟล์จะถูกอัปโหลดพร้อมกับการบันทึกสินค้า
                        </span>
                      )}
                    </p>
                  </div>

                  {/* URL Input Section */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      หรือใส่ URL รูปภาพ
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          if (e.target.value) {
                            setImagePreview(e.target.value);
                            setSelectedFile(null);
                          }
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isEditable && !imagePreview && (
                <div className="text-center py-8 border-2 border-dashed border-secondary-300 rounded-lg">
                  <div className="text-secondary-400 text-sm">ไม่มีรูปภาพ</div>
                </div>
              )}
            </div>
          </div>

          {product && type !== 'create' && (
            <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
              <h3 className="text-lg font-medium text-secondary-900 mb-2">ข้อมูลเพิ่มเติม</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary-600">ID:</span>
                  <span className="ml-2 font-medium">{product.product_id}</span>
                </div>
                <div>
                  <span className="text-secondary-600">วันที่สร้าง:</span>
                  <span className="ml-2 font-medium">
                    {new Date(product.created_at).toLocaleDateString('en-US')}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-600">อัปเดตล่าสุด:</span>
                  <span className="ml-2 font-medium">
                    {new Date(product.updated_at).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ product, onConfirm, onCancel }) => {
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
                ยืนยันการลบสินค้า
              </h3>
              <p className="text-sm text-secondary-500">
                การดำเนินการนี้ไม่สามารถยกเลิกได้
              </p>
            </div>
          </div>
          
          <p className="text-secondary-700 mb-6">
            คุณแน่ใจหรือไม่ที่จะลบสินค้า "<strong>{product.product_name}</strong>" ?
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
              ลบสินค้า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantProducts; 