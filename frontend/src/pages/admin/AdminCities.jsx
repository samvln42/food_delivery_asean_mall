import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { countryService, cityService } from '../../services/api';

const AdminCities = () => {
  const { translate } = useLanguage();
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    country: '',
    name: '',
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cRes, ciRes] = await Promise.all([
        countryService.getAll(),
        cityService.getAll(),
      ]);
      const cList = cRes.data?.results || cRes.data || [];
      const ciList = ciRes.data?.results || ciRes.data || [];
      setCountries(Array.isArray(cList) ? cList : []);
      setCities(Array.isArray(ciList) ? ciList : []);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail ||
          translate('admin.cities_load_error') ||
          'โหลดข้อมูลเมืองไม่สำเร็จ'
      );
      setCountries([]);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    let list = cities;
    if (filterCountry) {
      list = list.filter((x) => String(x.country) === String(filterCountry));
    }
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.country_name || '').toLowerCase().includes(q)
    );
  }, [cities, searchTerm, filterCountry]);

  const openCreate = () => {
    setFormData({
      country: filterCountry || '',
      name: '',
    });
    setSelected(null);
    setModalType('create');
    setShowModal(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setFormData({
      country: String(row.country ?? ''),
      name: row.name || '',
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.country) {
      alert(translate('admin.city_country_required') || 'กรุณาเลือกประเทศ');
      return;
    }
    if (!formData.name.trim()) {
      alert(translate('admin.city_name_required') || 'กรุณากรอกชื่อเมือง');
      return;
    }
    try {
      const payload = {
        country: parseInt(formData.country, 10),
        name: formData.name.trim(),
      };
      if (modalType === 'create') {
        await cityService.create(payload);
        alert(translate('admin.city_create_success') || 'เพิ่มเมืองสำเร็จ');
      } else {
        await cityService.partialUpdate(selected.city_id, payload);
        alert(translate('admin.city_update_success') || 'บันทึกเมืองสำเร็จ');
      }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      const msg =
        typeof err.response?.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response?.data?.detail || err.message;
      alert((translate('admin.city_save_error') || 'บันทึกไม่สำเร็จ') + (msg ? `\n${msg}` : ''));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`${translate('admin.city_delete_confirm') || 'ลบเมืองนี้?'} "${row.name}"`)) {
      return;
    }
    try {
      await cityService.delete(row.city_id);
      alert(translate('admin.city_delete_success') || 'ลบเมืองสำเร็จ');
      await loadAll();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail ||
          translate('admin.city_delete_error') ||
          'ลบไม่สำเร็จ — อาจมีร้านหรือสถานที่ยังอ้างอิงอยู่'
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        <span className="ml-3 text-secondary-700">
          {translate('common.loading') || 'กำลังโหลด...'}
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800 flex items-center gap-2">
          <FaMapMarkerAlt className="text-primary-600 shrink-0" />
          {translate('admin.cities_title') || 'จัดการเมือง'}
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <FiPlus className="w-5 h-5" />
          {translate('admin.city_add') || 'เพิ่มเมือง'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-secondary-600 mb-1">
            {translate('admin.cities_search_label') || 'ค้นหา'}
          </label>
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={translate('admin.cities_search') || 'ค้นหาชื่อเมืองหรือประเทศ...'}
              className="h-10 w-full rounded-lg border border-secondary-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-600 mb-1">
            {translate('admin.filter_by_country') || 'กรองตามประเทศ'}
          </label>
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="h-10 w-full rounded-lg border border-secondary-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{translate('common.all') || 'ทั้งหมด'}</option>
            {countries.map((c) => (
              <option key={c.country_id} value={String(c.country_id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">
                  {translate('admin.city_name') || 'ชื่อเมือง'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">
                  {translate('admin.country_name') || 'ประเทศ'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase w-36">
                  {translate('admin.actions') || 'จัดการ'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-secondary-500">
                    {translate('admin.cities_empty') || 'ยังไม่มีข้อมูลเมือง'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.city_id} className="hover:bg-secondary-50/80">
                    <td className="px-4 py-3 text-secondary-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-secondary-700">{row.country_name || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center p-2 rounded-lg text-primary-600 hover:bg-primary-50"
                        title={translate('common.edit') || 'แก้ไข'}
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="inline-flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50"
                        title={translate('common.delete') || 'ลบ'}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-secondary-500 hover:bg-secondary-100"
            >
              <FiX className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4 pr-8">
              {modalType === 'create'
                ? translate('admin.city_add') || 'เพิ่มเมือง'
                : translate('admin.city_edit') || 'แก้ไขเมือง'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {translate('admin.country_name') || 'ประเทศ'} *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">{translate('admin.select_country') || '— เลือกประเทศ —'}</option>
                  {countries.map((c) => (
                    <option key={c.country_id} value={String(c.country_id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {translate('admin.city_name') || 'ชื่อเมือง'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
              >
                {translate('common.cancel') || 'ยกเลิก'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              >
                {translate('common.save') || 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCities;
