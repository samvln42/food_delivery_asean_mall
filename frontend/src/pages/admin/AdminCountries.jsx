import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { FaGlobe } from 'react-icons/fa';
import { countryService } from '../../services/api';

const AdminCountries = () => {
  const { translate } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sort_order: 0,
    is_active: true,
  });
  const [flagFile, setFlagFile] = useState(null);
  const [flagPreview, setFlagPreview] = useState(null);
  const flagInputRef = useRef(null);
  const blobUrlRef = useRef(null);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const res = await countryService.getAll();
      const list = res.data?.results || res.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail ||
          translate('admin.countries_load_error') ||
          'โหลดรายการประเทศไม่สำเร็จ'
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(
    () => () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    },
    []
  );

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [items, searchTerm]);

  const resetFlagPick = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFlagFile(null);
    setFlagPreview(null);
    if (flagInputRef.current) flagInputRef.current.value = '';
  };

  const openCreate = () => {
    setFormData({
      name: '',
      sort_order: items.length ? Math.max(...items.map((x) => x.sort_order || 0)) + 1 : 0,
      is_active: true,
    });
    setSelected(null);
    setModalType('create');
    resetFlagPick();
    setShowModal(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setFormData({
      name: row.name || '',
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active !== false,
    });
    setModalType('edit');
    resetFlagPick();
    setFlagPreview(row.flag_display_url || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(translate('admin.country_name_required') || 'กรุณากรอกชื่อประเทศ');
      return;
    }
    try {
      const payload = {
        name: formData.name.trim(),
        sort_order: Number(formData.sort_order) || 0,
        is_active: Boolean(formData.is_active),
      };
      let countryId = selected?.country_id;
      if (modalType === 'create') {
        const createRes = await countryService.create(payload);
        countryId = createRes.data?.country_id;
        alert(translate('admin.country_create_success') || 'เพิ่มประเทศสำเร็จ');
      } else {
        await countryService.partialUpdate(selected.country_id, payload);
        countryId = selected.country_id;
        alert(translate('admin.country_update_success') || 'บันทึกประเทศสำเร็จ');
      }
      if (flagFile && countryId) {
        try {
          const fd = new FormData();
          fd.append('flag', flagFile);
          await countryService.uploadFlag(countryId, fd);
        } catch (uploadErr) {
          console.error(uploadErr);
          alert(
            translate('admin.country_flag_upload_error') ||
              'บันทึกประเทศแล้ว แต่อัปโหลดธงไม่สำเร็จ — ลองแก้ไขแล้วอัปโหลดใหม่'
          );
        }
      }
      setShowModal(false);
      resetFlagPick();
      await fetchCountries();
    } catch (err) {
      console.error(err);
      const msg =
        typeof err.response?.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response?.data?.detail || err.message;
      alert(
        (translate('admin.country_save_error') || 'บันทึกไม่สำเร็จ') + (msg ? `\n${msg}` : '')
      );
    }
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `${translate('admin.country_delete_confirm') || 'ลบประเทศนี้?'} "${row.name}" (${translate('admin.country_delete_hint') || 'เมืองในประเทศนี้จะถูกลบด้วย'})`
      )
    ) {
      return;
    }
    try {
      await countryService.delete(row.country_id);
      alert(translate('admin.country_delete_success') || 'ลบประเทศสำเร็จ');
      await fetchCountries();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail ||
          translate('admin.country_delete_error') ||
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
          <FaGlobe className="text-primary-600 shrink-0" />
          {translate('admin.countries_title') || 'จัดการประเทศ'}
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <FiPlus className="w-5 h-5" />
          {translate('admin.country_add') || 'เพิ่มประเทศ'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={translate('admin.countries_search') || 'ค้นหาชื่อประเทศ...'}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase w-16">
                  {translate('admin.country_flag') || 'ธง'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">
                  {translate('admin.country_name') || 'ชื่อ'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase w-28">
                  {translate('admin.sort_order') || 'ลำดับ'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase w-28">
                  {translate('admin.active') || 'ใช้งาน'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase w-36">
                  {translate('admin.actions') || 'จัดการ'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-secondary-500">
                    {translate('admin.countries_empty') || 'ยังไม่มีข้อมูลประเทศ'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.country_id} className="hover:bg-secondary-50/80">
                    <td className="px-4 py-3">
                      {row.flag_display_url ? (
                        <img
                          src={row.flag_display_url}
                          alt=""
                          className="w-10 h-7 object-cover rounded border border-secondary-200"
                        />
                      ) : (
                        <span className="text-secondary-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-secondary-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-secondary-700">{row.sort_order}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          row.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-secondary-200 text-secondary-700'
                        }`}
                      >
                        {row.is_active
                          ? translate('common.yes') || 'ใช่'
                          : translate('common.no') || 'ไม่'}
                      </span>
                    </td>
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
                ? translate('admin.country_add') || 'เพิ่มประเทศ'
                : translate('admin.country_edit') || 'แก้ไขประเทศ'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {translate('admin.country_name') || 'ชื่อประเทศ'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {translate('admin.country_flag_upload') || 'รูปธงชาติ'} (JPG/PNG/GIF/WebP, max 2MB)
                </label>
                <input
                  ref={flagInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFlagFile(f || null);
                    if (blobUrlRef.current) {
                      URL.revokeObjectURL(blobUrlRef.current);
                      blobUrlRef.current = null;
                    }
                    if (f) {
                      blobUrlRef.current = URL.createObjectURL(f);
                      setFlagPreview(blobUrlRef.current);
                    } else if (modalType === 'edit' && selected?.flag_display_url) {
                      setFlagPreview(selected.flag_display_url);
                    } else {
                      setFlagPreview(null);
                    }
                  }}
                  className="w-full text-sm text-secondary-600"
                />
                {flagPreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={flagPreview}
                      alt=""
                      className="h-12 w-16 object-cover rounded border border-secondary-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (blobUrlRef.current) {
                          URL.revokeObjectURL(blobUrlRef.current);
                          blobUrlRef.current = null;
                        }
                        setFlagFile(null);
                        if (flagInputRef.current) flagInputRef.current.value = '';
                        if (modalType === 'edit' && selected?.flag_display_url) {
                          setFlagPreview(selected.flag_display_url);
                        } else {
                          setFlagPreview(null);
                        }
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      {translate('admin.country_flag_clear') || 'ล้างไฟล์ที่เลือก'}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {translate('admin.sort_order') || 'ลำดับการแสดง'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">
                  {translate('admin.country_active') || 'แสดงในรายการสาธารณะ'}
                </span>
              </label>
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

export default AdminCountries;
