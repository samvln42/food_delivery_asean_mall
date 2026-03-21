import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import {
  FaClipboardList,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaChair,
  FaCalendarAlt,
  FaDownload,
  FaSync,
  FaQrcode,
  FaEdit,
  FaTrash,
  FaTimes,
} from 'react-icons/fa';

const RestaurantTables = () => {
  const { token } = useAuth();
  const { translate, currentLanguage } = useLanguage();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  const [tableNumber, setTableNumber] = useState('');
  const [seats, setSeats] = useState(4);
  const [isActive, setIsActive] = useState(true);

  const t = (key, fallback, vars = {}) => {
    const value = translate(key, vars);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLocale = () => {
    if (currentLanguage === 'th') return 'th-TH';
    if (currentLanguage === 'ko') return 'ko-KR';
    return 'en-US';
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/restaurant-tables/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTables(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(t('restaurant.tables.error_load', 'Unable to load table data'));
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (tableId) => {
    try {
      await axios.post(
        `${API_CONFIG.BASE_URL}/restaurant-tables/${tableId}/generate-qr/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      await fetchTables();
    } catch (err) {
      console.error('Error generating QR code:', err);
      alert(t('restaurant.tables.error_generate_qr', 'Unable to generate QR code'));
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/restaurant-tables/`,
        {
          table_number: tableNumber,
          seats,
          is_active: isActive,
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      await generateQRCode(response.data.table_id);
      resetForm();
      await fetchTables();
    } catch (err) {
      console.error('Error adding table:', err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        t('restaurant.tables.error_create', 'Unable to create table');
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTable = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await axios.put(
        `${API_CONFIG.BASE_URL}/restaurant-tables/${editingTable.table_id}/`,
        {
          table_number: tableNumber,
          seats,
          is_active: isActive,
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      resetForm();
      await fetchTables();
    } catch (err) {
      console.error('Error updating table:', err);
      setError(err.response?.data?.error || t('restaurant.tables.error_update', 'Unable to update table'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm(t('restaurant.tables.delete_confirm', 'Are you sure you want to delete this table?'))) return;

    try {
      setLoading(true);
      await axios.delete(`${API_CONFIG.BASE_URL}/restaurant-tables/${tableId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      await fetchTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      setError(t('restaurant.tables.error_delete', 'Unable to delete table'));
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async (qrCodeUrl, tableNo) => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `table_${tableNo}_qr.png`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      window.open(qrCodeUrl, '_blank');
    }
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setShowAddModal(false);
    setTableNumber(table.table_number);
    setSeats(table.seats);
    setIsActive(table.is_active);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingTable(null);
    setTableNumber('');
    setSeats(4);
    setIsActive(true);
  };

  if (loading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">{t('restaurant.tables.loading', 'Loading table data...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center gap-2">
          <FaClipboardList className="w-8 h-8 text-primary-600" /> {t('restaurant.tables.title', 'Manage tables')}
        </h1>
        <button
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md"
          onClick={() => setShowAddModal(true)}
        >
          <span className="flex items-center gap-2">
            <FaPlus className="w-4 h-4" /> {t('restaurant.tables.add_new', 'Add new table')}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex justify-between items-center rounded">
          <p className="text-red-700 flex items-center gap-2">
            <FaTimesCircle className="w-5 h-5" /> {error}
          </p>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 font-bold text-xl">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.table_id} className={`bg-white rounded-xl shadow-lg ${!table.is_active ? 'opacity-70 bg-secondary-50' : ''}`}>
            <div className="p-5 border-b-2 border-secondary-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-secondary-800">
                  {t('restaurant.tables.table_number', 'Table {number}', { number: table.table_number })}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${table.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {table.is_active ? t('restaurant.tables.active', 'Active') : t('restaurant.tables.inactive', 'Inactive')}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-5 space-y-2 text-secondary-600 text-sm">
                <p className="flex items-center gap-2">
                  <FaChair className="w-4 h-4" />
                  {t('restaurant.tables.seats', 'Seats')}: <span className="font-semibold text-secondary-800">{table.seats}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4" />
                  {t('restaurant.tables.created_at', 'Created at')}:{' '}
                  <span className="font-semibold text-secondary-800">{new Date(table.created_at).toLocaleDateString(getLocale())}</span>
                </p>
              </div>

              {table.qr_code_image_display_url ? (
                <div className="bg-secondary-50 rounded-lg p-5 mb-4 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-lg border-4 border-green-500 mb-4">
                    <img src={table.qr_code_image_display_url} alt={`QR Table ${table.table_number}`} className="w-48 h-48 object-contain" />
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button className="bg-secondary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold" onClick={() => downloadQRCode(table.qr_code_image_display_url, table.table_number)}>
                      <span className="flex items-center gap-2"><FaDownload className="w-4 h-4" />{t('restaurant.tables.download_qr', 'Download QR')}</span>
                    </button>
                    <button className="bg-secondary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold" onClick={() => generateQRCode(table.table_id)}>
                      <span className="flex items-center gap-2"><FaSync className="w-4 h-4" />{t('restaurant.tables.regenerate_qr', 'Regenerate')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-6 mb-4 text-center border border-yellow-200">
                  <p className="text-yellow-800 mb-4 font-medium">{t('restaurant.tables.no_qr', 'No QR Code yet')}</p>
                  <button className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold" onClick={() => generateQRCode(table.table_id)}>
                    <span className="flex items-center gap-2"><FaQrcode className="w-4 h-4" />{t('restaurant.tables.generate_qr', 'Generate QR Code')}</span>
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg" onClick={() => openEditModal(table)}><FaEdit className="w-4 h-4" /></button>
                <button className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg" onClick={() => handleDeleteTable(table.table_id)}><FaTrash className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}

        {tables.length === 0 && !loading && (
          <div className="col-span-full text-center py-16 bg-secondary-50 rounded-xl">
            <p className="text-secondary-500 text-lg">{t('restaurant.tables.empty', 'No tables yet. Click "Add new table" to get started')}</p>
          </div>
        )}
      </div>

      {(showAddModal || editingTable) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">
                <span className="flex items-center gap-2">
                  {editingTable ? <FaEdit className="w-5 h-5" /> : <FaPlus className="w-5 h-5" />}
                  {editingTable ? t('restaurant.tables.edit_table', 'Edit table') : t('restaurant.tables.add_new', 'Add new table')}
                </span>
              </h2>

              <form onSubmit={editingTable ? handleUpdateTable : handleAddTable}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">{t('restaurant.tables.form.table_number', 'Table number')} *</label>
                    <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder={t('restaurant.tables.form.table_number_placeholder', 'e.g. A1, B2, 101')} required className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">{t('restaurant.tables.form.seats', 'Seats')} *</label>
                    <input type="number" value={seats} onChange={(e) => setSeats(parseInt(e.target.value, 10))} min="1" max="20" required className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg" />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5" />
                      <span className="text-sm font-medium text-secondary-700">{t('restaurant.tables.form.active_label', 'Enable this table')}</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="button" className="flex-1 bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg font-semibold" onClick={resetForm}>
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button type="submit" className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50" disabled={loading}>
                    {loading ? t('common.saving', 'Saving...') : editingTable ? t('common.save', 'Save') : t('restaurant.tables.form.add_table', 'Add table')}
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

export default RestaurantTables;
