import React, { useState, useEffect } from "react";
import { appSettingsService } from "../../services/api";
import { toast } from "../../hooks/useNotification";
import { useCart } from "../../contexts/CartContext";

// ค่าเริ่มต้นสำหรับ App Settings
const DEFAULT_SETTINGS = {
    general: {
    app_name: "Food Delivery",
    app_description: "ระบบสั่งอาหารออนไลน์",
    app_logo: "",
    app_icon: "",
    contact_email: "support@fooddelivery.com",
    contact_phone: "02-xxx-xxxx",
    contact_address: "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    timezone: "Asia/Bangkok",
    language: "th",
    hero_title: "Order Food Easily, Delivered to Your Home",
    hero_subtitle:
      "Choose from premium restaurants, fast, delicious and safe delivery",
    feature_1_title: "Fast Delivery",
    feature_1_description: "Food delivered to you within 30-45 minutes",
    feature_1_icon: "🚚",
    feature_2_title: "Quality Food",
    feature_2_description: "Quality restaurants, carefully selected",
    feature_2_icon: "🍽️",
    feature_3_title: "Easy Payment",
    feature_3_description: "Multiple payment methods supported",
    feature_3_icon: "💳",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    meta_keywords: "",
    meta_description: "",
    maintenance_mode: false,
    maintenance_message:
      "The system is under maintenance, please try again later",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    },
    delivery: {
      base_delivery_fee: 15,
      free_delivery_minimum: 200,
      max_delivery_distance: 10,
    delivery_time_slots: "09:00-21:00",
      rush_hour_multiplier: 1.5,
      weekend_multiplier: 1.2,
      enable_scheduled_delivery: true,
      max_advance_booking_days: 7,
    multi_restaurant_base_fee: 2,
    multi_restaurant_additional_fee: 1,
    per_km_fee: 5,
    },
    payment: {
      enable_credit_card: true,
      enable_debit_card: true,
      enable_bank_transfer: true,
      enable_cash_on_delivery: true,
      enable_qr_payment: true,
      minimum_order_amount: 50,
      service_fee_percentage: 2.5,
      vat_percentage: 7,
    },
    notification: {
      enable_email_notifications: true,
      enable_sms_notifications: true,
      enable_push_notifications: true,
      email_order_confirmation: true,
      email_status_updates: true,
      sms_order_confirmation: false,
      sms_status_updates: true,
      push_order_updates: true,
      push_promotions: false,
    },
    security: {
      enable_two_factor_auth: false,
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      session_timeout_minutes: 60,
      max_login_attempts: 5,
      lockout_duration_minutes: 30,
    },
    business: {
      restaurant_commission_rate: 15,
      special_restaurant_commission_rate: 10,
      minimum_payout_amount: 1000,
    payout_schedule: "weekly",
      auto_approve_restaurants: false,
      require_restaurant_verification: true,
      max_products_per_restaurant: 100,
      enable_reviews: true,
      min_review_rating: 1,
      max_review_rating: 5,
    },
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("app");
  const [appSettingsLoading, setAppSettingsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const { refreshDeliverySettings } = useCart();

  const tabs = [
    { id: "app", name: "ข้อมูลแอป", icon: "📱" },
    { id: "delivery", name: "การจัดส่ง", icon: "🚚" },
    { id: "payment", name: "การชำระเงิน", icon: "💳" },
    { id: "notification", name: "การแจ้งเตือน", icon: "🔔" },
    { id: "security", name: "ความปลอดภัย", icon: "🔒" },
    { id: "business", name: "ธุรกิจ", icon: "💼" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setAppSettingsLoading(true);
      
      const response = await appSettingsService.getAll();
      
      let fetchedAppSettings = null;

      // Determine the actual app settings object from the response
      if (response.data?.results?.[0]) {
        fetchedAppSettings = response.data.results[0];
      } else if (response.data && !Array.isArray(response.data)) {
        fetchedAppSettings = response.data;
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        fetchedAppSettings = response.data[0];
      }

      if (fetchedAppSettings) {
        // Set appSettings state directly (used for appSettings.id and file uploads)
        setAppSettings(fetchedAppSettings);

        // Construct the new settings state for form inputs
        const newSettings = {
          general: {
            app_name:
              fetchedAppSettings.app_name ?? DEFAULT_SETTINGS.general.app_name,
            app_description:
              fetchedAppSettings.app_description ??
              DEFAULT_SETTINGS.general.app_description,
            contact_email:
              fetchedAppSettings.contact_email ??
              DEFAULT_SETTINGS.general.contact_email,
            contact_phone:
              fetchedAppSettings.contact_phone ??
              DEFAULT_SETTINGS.general.contact_phone,
            contact_address:
              fetchedAppSettings.contact_address ??
              DEFAULT_SETTINGS.general.contact_address,
            timezone:
              fetchedAppSettings.timezone ?? DEFAULT_SETTINGS.general.timezone,
            language:
              fetchedAppSettings.language ?? DEFAULT_SETTINGS.general.language,
            hero_title:
              fetchedAppSettings.hero_title ??
              DEFAULT_SETTINGS.general.hero_title,
            hero_subtitle:
              fetchedAppSettings.hero_subtitle ??
              DEFAULT_SETTINGS.general.hero_subtitle,
            feature_1_title:
              fetchedAppSettings.feature_1_title ??
              DEFAULT_SETTINGS.general.feature_1_title,
            feature_1_description:
              fetchedAppSettings.feature_1_description ??
              DEFAULT_SETTINGS.general.feature_1_description,
            feature_1_icon:
              fetchedAppSettings.feature_1_icon ??
              DEFAULT_SETTINGS.general.feature_1_icon,
            feature_2_title:
              fetchedAppSettings.feature_2_title ??
              DEFAULT_SETTINGS.general.feature_2_title,
            feature_2_description:
              fetchedAppSettings.feature_2_description ??
              DEFAULT_SETTINGS.general.feature_2_description,
            feature_2_icon:
              fetchedAppSettings.feature_2_icon ??
              DEFAULT_SETTINGS.general.feature_2_icon,
            feature_3_title:
              fetchedAppSettings.feature_3_title ??
              DEFAULT_SETTINGS.general.feature_3_title,
            feature_3_description:
              fetchedAppSettings.feature_3_description ??
              DEFAULT_SETTINGS.general.feature_3_description,
            feature_3_icon:
              fetchedAppSettings.feature_3_icon ??
              DEFAULT_SETTINGS.general.feature_3_icon,
            facebook_url:
              fetchedAppSettings.facebook_url ??
              DEFAULT_SETTINGS.general.facebook_url,
            instagram_url:
              fetchedAppSettings.instagram_url ??
              DEFAULT_SETTINGS.general.instagram_url,
            twitter_url:
              fetchedAppSettings.twitter_url ??
              DEFAULT_SETTINGS.general.twitter_url,
            meta_keywords:
              fetchedAppSettings.meta_keywords ??
              DEFAULT_SETTINGS.general.meta_keywords,
            meta_description:
              fetchedAppSettings.meta_description ??
              DEFAULT_SETTINGS.general.meta_description,
            maintenance_mode:
              fetchedAppSettings.maintenance_mode ??
              DEFAULT_SETTINGS.general.maintenance_mode,
            maintenance_message:
              fetchedAppSettings.maintenance_message ??
              DEFAULT_SETTINGS.general.maintenance_message,
            bank_name:
              fetchedAppSettings.bank_name ??
              DEFAULT_SETTINGS.general.bank_name,
            bank_account_number:
              fetchedAppSettings.bank_account_number ??
              DEFAULT_SETTINGS.general.bank_account_number,
            bank_account_name:
              fetchedAppSettings.bank_account_name ??
              DEFAULT_SETTINGS.general.bank_account_name,
          },
          delivery: {
            base_delivery_fee:
              fetchedAppSettings.base_delivery_fee ??
              DEFAULT_SETTINGS.delivery.base_delivery_fee,
            free_delivery_minimum:
              fetchedAppSettings.free_delivery_minimum ??
              DEFAULT_SETTINGS.delivery.free_delivery_minimum,
            max_delivery_distance:
              fetchedAppSettings.max_delivery_distance ??
              DEFAULT_SETTINGS.delivery.max_delivery_distance,
            delivery_time_slots:
              fetchedAppSettings.delivery_time_slots ??
              DEFAULT_SETTINGS.delivery.delivery_time_slots,
            enable_scheduled_delivery:
              fetchedAppSettings.enable_scheduled_delivery ??
              DEFAULT_SETTINGS.delivery.enable_scheduled_delivery,
            rush_hour_multiplier:
              fetchedAppSettings.rush_hour_multiplier ??
              DEFAULT_SETTINGS.delivery.rush_hour_multiplier,
            weekend_multiplier:
              fetchedAppSettings.weekend_multiplier ??
              DEFAULT_SETTINGS.delivery.weekend_multiplier,
            multi_restaurant_base_fee:
              fetchedAppSettings.multi_restaurant_base_fee ??
              DEFAULT_SETTINGS.delivery.multi_restaurant_base_fee,
            multi_restaurant_additional_fee:
              fetchedAppSettings.multi_restaurant_additional_fee ??
              DEFAULT_SETTINGS.delivery.multi_restaurant_additional_fee,
            per_km_fee:
              fetchedAppSettings.per_km_fee ??
              DEFAULT_SETTINGS.delivery.per_km_fee,
          },
          payment: {
            enable_credit_card:
              fetchedAppSettings.enable_credit_card ??
              DEFAULT_SETTINGS.payment.enable_credit_card,
            enable_debit_card:
              fetchedAppSettings.enable_debit_card ??
              DEFAULT_SETTINGS.payment.enable_debit_card,
            enable_bank_transfer:
              fetchedAppSettings.enable_bank_transfer ??
              DEFAULT_SETTINGS.payment.enable_bank_transfer,
            enable_cash_on_delivery:
              fetchedAppSettings.enable_cash_on_delivery ??
              DEFAULT_SETTINGS.payment.enable_cash_on_delivery,
            enable_qr_payment:
              fetchedAppSettings.enable_qr_payment ??
              DEFAULT_SETTINGS.payment.enable_qr_payment,
            minimum_order_amount:
              fetchedAppSettings.minimum_order_amount ??
              DEFAULT_SETTINGS.payment.minimum_order_amount,
            service_fee_percentage:
              fetchedAppSettings.service_fee_percentage ??
              DEFAULT_SETTINGS.payment.service_fee_percentage,
            vat_percentage:
              fetchedAppSettings.vat_percentage ??
              DEFAULT_SETTINGS.payment.vat_percentage,
          },
          notification: {
            enable_email_notifications:
              fetchedAppSettings.enable_email_notifications ??
              DEFAULT_SETTINGS.notification.enable_email_notifications,
            enable_sms_notifications:
              fetchedAppSettings.enable_sms_notifications ??
              DEFAULT_SETTINGS.notification.enable_sms_notifications,
            enable_push_notifications:
              fetchedAppSettings.enable_push_notifications ??
              DEFAULT_SETTINGS.notification.enable_push_notifications,
            email_order_confirmation:
              fetchedAppSettings.email_order_confirmation ??
              DEFAULT_SETTINGS.notification.email_order_confirmation,
            email_status_updates:
              fetchedAppSettings.email_status_updates ??
              DEFAULT_SETTINGS.notification.email_status_updates,
            sms_order_confirmation:
              fetchedAppSettings.sms_order_confirmation ??
              DEFAULT_SETTINGS.notification.sms_order_confirmation,
            sms_status_updates:
              fetchedAppSettings.sms_status_updates ??
              DEFAULT_SETTINGS.notification.sms_status_updates,
            push_order_updates:
              fetchedAppSettings.push_order_updates ??
              DEFAULT_SETTINGS.notification.push_order_updates,
            push_promotions:
              fetchedAppSettings.push_promotions ??
              DEFAULT_SETTINGS.notification.push_promotions,
          },
          security: {
            enable_two_factor_auth:
              fetchedAppSettings.enable_two_factor_auth ??
              DEFAULT_SETTINGS.security.enable_two_factor_auth,
            password_min_length:
              fetchedAppSettings.password_min_length ??
              DEFAULT_SETTINGS.security.password_min_length,
            password_require_uppercase:
              fetchedAppSettings.password_require_uppercase ??
              DEFAULT_SETTINGS.security.password_require_uppercase,
            password_require_lowercase:
              fetchedAppSettings.password_require_lowercase ??
              DEFAULT_SETTINGS.security.password_require_lowercase,
            password_require_numbers:
              fetchedAppSettings.password_require_numbers ??
              DEFAULT_SETTINGS.security.password_require_numbers,
            password_require_symbols:
              fetchedAppSettings.password_require_symbols ??
              DEFAULT_SETTINGS.security.password_require_symbols,
            session_timeout_minutes:
              fetchedAppSettings.session_timeout_minutes ??
              DEFAULT_SETTINGS.security.session_timeout_minutes,
            max_login_attempts:
              fetchedAppSettings.max_login_attempts ??
              DEFAULT_SETTINGS.security.max_login_attempts,
            lockout_duration_minutes:
              fetchedAppSettings.lockout_duration_minutes ??
              DEFAULT_SETTINGS.security.lockout_duration_minutes,
          },
          business: {
            restaurant_commission_rate:
              fetchedAppSettings.restaurant_commission_rate ??
              DEFAULT_SETTINGS.business.restaurant_commission_rate,
            special_restaurant_commission_rate:
              fetchedAppSettings.special_restaurant_commission_rate ??
              DEFAULT_SETTINGS.business.special_restaurant_commission_rate,
            minimum_payout_amount:
              fetchedAppSettings.minimum_payout_amount ??
              DEFAULT_SETTINGS.business.minimum_payout_amount,
            payout_schedule:
              fetchedAppSettings.payout_schedule ??
              DEFAULT_SETTINGS.business.payout_schedule,
            auto_approve_restaurants:
              fetchedAppSettings.auto_approve_restaurants ??
              DEFAULT_SETTINGS.business.auto_approve_restaurants,
            require_restaurant_verification:
              fetchedAppSettings.require_restaurant_verification ??
              DEFAULT_SETTINGS.business.require_restaurant_verification,
            max_products_per_restaurant:
              fetchedAppSettings.max_products_per_restaurant ??
              DEFAULT_SETTINGS.business.max_products_per_restaurant,
            enable_reviews:
              fetchedAppSettings.enable_reviews ??
              DEFAULT_SETTINGS.business.enable_reviews,
            min_review_rating:
              fetchedAppSettings.min_review_rating ??
              DEFAULT_SETTINGS.business.min_review_rating,
            max_review_rating:
              fetchedAppSettings.max_review_rating ??
              DEFAULT_SETTINGS.business.max_review_rating,
          },
        };
        setSettings(newSettings);
      } else {
        console.warn("No app settings found, using DEFAULT_SETTINGS.");
        toast.warning("Application settings not found, loading defaults.");
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("You do not have permission to view settings");
      } else {
        toast.error("Unable to load settings");
      }
    } finally {
      setAppSettingsLoading(false);
    }
  };

  const saveAppSettings = async () => {
    if (!appSettings?.id) return;
    
    setAppSettingsLoading(true);
    try {
      // สร้างข้อมูลที่จะส่ง โดยกรองเฉพาะฟิลด์ที่มีค่า
      const dataToSend = {};
      
      // ฟิลด์ text/string
      const textFields = [
        "app_name",
        "app_description",
        "contact_email",
        "contact_phone",
        "contact_address",
        "hero_title",
        "hero_subtitle",
        "feature_1_title",
        "feature_1_description",
        "feature_1_icon",
        "feature_2_title",
        "feature_2_description",
        "feature_2_icon",
        "feature_3_title",
        "feature_3_description",
        "feature_3_icon",
        "facebook_url",
        "instagram_url",
        "twitter_url",
        "meta_keywords",
        "meta_description",
        "maintenance_message",
        "timezone",
        "bank_name",
        "bank_account_number",
        "bank_account_name",
      ];

      textFields.forEach((field) => {
        if (appSettings[field] !== undefined && appSettings[field] !== null) {
          dataToSend[field] = appSettings[field];
        }
      });
      
      // ฟิลด์ boolean
      if (appSettings.maintenance_mode !== undefined) {
        dataToSend.maintenance_mode = Boolean(appSettings.maintenance_mode);
      }
      
      // ไฟล์อัปโหลด
      if (appSettings.app_logo instanceof File) {
        dataToSend.app_logo = appSettings.app_logo;
      }
      if (appSettings.app_banner instanceof File) {
        dataToSend.app_banner = appSettings.app_banner;
      }
      if (appSettings.qr_code_image instanceof File) {
        dataToSend.qr_code_image = appSettings.qr_code_image;
      }

      const response = await appSettingsService.patch(
        appSettings.id,
        dataToSend
      );
      toast.success("Application settings saved successfully");
      
      // โหลดข้อมูลใหม่หลังจากบันทึก
      await fetchSettings();
    } catch (error) {
      console.error("Error saving app settings:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("You do not have permission to save settings");
        } else {
        toast.error("Unable to save settings");
      }
    } finally {
      setAppSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (activeTab === "app") {
      return saveAppSettings();
    }
    
    setLoading(true);
    try {
      // บันทึก delivery settings
      if (appSettings?.id && activeTab === "delivery") {
        const deliveryData = {
          base_delivery_fee:
            parseFloat(settings.delivery.base_delivery_fee) || 0,
          free_delivery_minimum:
            parseFloat(settings.delivery.free_delivery_minimum) || 0,
          max_delivery_distance:
            parseFloat(settings.delivery.max_delivery_distance) || 0,
          per_km_fee: parseFloat(settings.delivery.per_km_fee) || 0,
          multi_restaurant_base_fee:
            parseFloat(settings.delivery.multi_restaurant_base_fee) || 0,
          multi_restaurant_additional_fee:
            parseFloat(settings.delivery.multi_restaurant_additional_fee) || 0,
          delivery_time_slots: settings.delivery.delivery_time_slots,
          enable_scheduled_delivery:
            settings.delivery.enable_scheduled_delivery,
          rush_hour_multiplier:
            parseFloat(settings.delivery.rush_hour_multiplier) || 0,
          weekend_multiplier:
            parseFloat(settings.delivery.weekend_multiplier) || 0,
        };

        const response = await appSettingsService.patch(
          appSettings.id,
          deliveryData
        );
        toast.success("Delivery settings saved successfully");
        
        // โหลดข้อมูลใหม่หลังจากบันทึก
        await fetchSettings();
        
        // รีเฟรชการตั้งค่าค่าจัดส่งใน CartContext
        await refreshDeliverySettings();
      } else {
        // For other tabs, just show success message for now
        toast.success("Settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Unable to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAppSettingsChange = (field, value) => {
    setAppSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      setAppSettings((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleCheckboxChange = (section, field) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field],
      },
    }));
  };

  const renderAppSettings = () => {
    if (!appSettings) {
      return (
        <div className="text-center py-8">
          <div className="text-secondary-500">กำลังโหลดข้อมูล...</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary-800">
            ข้อมูลแอปพลิเคชัน
          </h3>
          <p className="text-sm text-secondary-600">
            แก้ไขข้อมูลพื้นฐานของแอปพลิเคชัน ใช้ปุ่ม "บันทึกการตั้งค่า"
            ด้านบนเพื่อบันทึกการเปลี่ยนแปลง
          </p>
        </div>

        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            ข้อมูลพื้นฐาน
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อแอปพลิเคชัน
              </label>
              <input
                type="text"
                value={appSettings.app_name || ""}
                onChange={(e) =>
                  handleAppSettingsChange("app_name", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                คำอธิบายแอป
              </label>
              <input
                type="text"
                value={appSettings.app_description || ""}
                onChange={(e) =>
                  handleAppSettingsChange("app_description", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Logo and Banner */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            รูปภาพ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                โลโก้แอป
              </label>
              <div className="space-y-3">
                {appSettings.logo_url && (
                  <div className="flex justify-center">
                    <img
                      src={appSettings.logo_url}
                      alt="Current Logo"
                      className="h-20 w-auto object-contain border border-secondary-200 rounded-lg p-2"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload("app_logo", e)}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-secondary-500">
                  รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                แบนเนอร์หน้าแรก
              </label>
              <div className="space-y-3">
                {appSettings.banner_url && (
                  <div className="flex justify-center">
                    <img
                      src={appSettings.banner_url}
                      alt="Current Banner"
                      className="h-20 w-auto object-cover border border-secondary-200 rounded-lg"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload("app_banner", e)}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-secondary-500">
                  รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            ข้อมูลติดต่อ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                อีเมลติดต่อ
              </label>
              <input
                type="email"
                value={appSettings.contact_email || ""}
                onChange={(e) =>
                  handleAppSettingsChange("contact_email", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={appSettings.contact_phone || ""}
                onChange={(e) =>
                  handleAppSettingsChange("contact_phone", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ที่อยู่
              </label>
              <textarea
                value={appSettings.contact_address || ""}
                onChange={(e) =>
                  handleAppSettingsChange("contact_address", e.target.value)
                }
                rows={3}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            หน้าแรก (Hero Section)
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                หัวข้อหลัก
              </label>
              <input
                type="text"
                value={appSettings.hero_title || ""}
                onChange={(e) =>
                  handleAppSettingsChange("hero_title", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                คำบรรยายหัวข้อ
              </label>
              <textarea
                value={appSettings.hero_subtitle || ""}
                onChange={(e) =>
                  handleAppSettingsChange("hero_subtitle", e.target.value)
                }
                rows={2}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            คุณสมบัติแอป
          </h4>
          <div className="space-y-4">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className="border-b border-secondary-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
              >
                <h5 className="text-md font-medium text-secondary-700 mb-3">
                  คุณสมบัติที่ {num}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      หัวข้อ
                    </label>
                    <input
                      type="text"
                      value={appSettings[`feature_${num}_title`] || ""}
                      onChange={(e) =>
                        handleAppSettingsChange(
                          `feature_${num}_title`,
                          e.target.value
                        )
                      }
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      ไอคอน (Emoji หรือ FontAwesome class)
                    </label>
                    <input
                      type="text"
                      value={appSettings[`feature_${num}_icon`] || ""}
                      onChange={(e) =>
                        handleAppSettingsChange(
                          `feature_${num}_icon`,
                          e.target.value
                        )
                      }
                      placeholder="เช่น 🚚 หรือ fa-truck"
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      คำบรรยาย
                    </label>
                    <textarea
                      value={appSettings[`feature_${num}_description`] || ""}
                      onChange={(e) =>
                        handleAppSettingsChange(
                          `feature_${num}_description`,
                          e.target.value
                        )
                      }
                      rows={2}
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            Social Media
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                value={appSettings.facebook_url || ""}
                onChange={(e) =>
                  handleAppSettingsChange("facebook_url", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                value={appSettings.instagram_url || ""}
                onChange={(e) =>
                  handleAppSettingsChange("instagram_url", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Twitter URL
              </label>
              <input
                type="url"
                value={appSettings.twitter_url || ""}
                onChange={(e) =>
                  handleAppSettingsChange("twitter_url", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://twitter.com/yourprofile"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            SEO (Search Engine Optimization)
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Keywords (คั่นด้วย comma)
              </label>
              <textarea
                value={appSettings.meta_keywords || ""}
                onChange={(e) =>
                  handleAppSettingsChange("meta_keywords", e.target.value)
                }
                rows={3}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="อาหาร, เดลิเวอรี่, สั่งอาหาร, ร้านอาหาร, กรุงเทพ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                คำอธิบาย Meta
              </label>
              <textarea
                value={appSettings.meta_description || ""}
                onChange={(e) =>
                  handleAppSettingsChange("meta_description", e.target.value)
                }
                rows={3}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="สั่งอาหารออนไลน์ง่าย ๆ ส่งตรงถึงบ้านคุณ"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            ตั้งค่าระบบ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Timezone
              </label>
              <input
                type="text"
                value={appSettings.timezone || ""}
                onChange={(e) =>
                  handleAppSettingsChange("timezone", e.target.value)
                }
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="เช่น Asia/Bangkok"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={appSettings.maintenance_mode || false}
                onChange={(e) =>
                  handleAppSettingsChange("maintenance_mode", e.target.checked)
                }
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="text-sm text-secondary-700">
                โหมดบำรุงรักษา (Maintenance Mode)
              </span>
            </label>
            {appSettings.maintenance_mode && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  ข้อความโหมดบำรุงรักษา
                </label>
                <textarea
                  value={appSettings.maintenance_message || ""}
                  onChange={(e) =>
                    handleAppSettingsChange(
                      "maintenance_message",
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bank Transfer / QR Payment Settings */}
        <div className="bg-white p-6 rounded-lg border border-secondary-200">
          <h4 className="text-md font-semibold text-secondary-800 mb-4">
            การโอนเงิน/QR Payment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อธนาคาร
              </label>
                  <input
                    type="text"
                value={appSettings.bank_name || ""}
                onChange={(e) =>
                  handleAppSettingsChange("bank_name", e.target.value)
                }
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                เลขบัญชี
              </label>
                  <input
                    type="text"
                value={appSettings.bank_account_number || ""}
                onChange={(e) =>
                  handleAppSettingsChange("bank_account_number", e.target.value)
                }
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ชื่อบัญชี
              </label>
                  <input
                    type="text"
                value={appSettings.bank_account_name || ""}
                onChange={(e) =>
                  handleAppSettingsChange("bank_account_name", e.target.value)
                }
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                รูปภาพ QR Code
              </label>
              <div className="space-y-3">
                {appSettings.qr_code_url && (
                  <div className="flex justify-center">
                    <img
                      src={appSettings.qr_code_url}
                      alt="Current QR Code"
                      className="h-40 w-auto object-contain border border-secondary-200 rounded-lg p-2"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload("qr_code_image", e)}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-secondary-500">
                  รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeliverySettings = () => (
    <div className="space-y-6">
      {/* ส่วนที่ 1: การตั้งค่าทั่วไปเกี่ยวกับการจัดส่ง */}
      {/*
      <div className="bg-white p-6 rounded-lg border border-secondary-200">
        <h4 className="text-md font-semibold text-secondary-800 mb-4">การจัดส่ง</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">ค่าจัดส่งพื้นฐาน</label>
            <input
              type="number"
              value={settings.delivery.base_delivery_fee ?? ''}
              onChange={(e) => handleInputChange('delivery', 'base_delivery_fee', e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">ค่าจัดส่งเริ่มต้นที่ลูกค้าต้องจ่ายต่อครั้ง</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">ยอดขั้นต่ำสำหรับจัดส่งฟรี</label>
            <input
              type="number"
              value={settings.delivery.free_delivery_minimum ?? ''}
              onChange={(e) => handleInputChange('delivery', 'free_delivery_minimum', e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">จำนวนเงินขั้นต่ำที่ลูกค้าต้องสั่งเพื่อรับการจัดส่งฟรี</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">ระยะทางจัดส่งสูงสุด (กม.)</label>
            <input
              type="number"
              value={settings.delivery.max_delivery_distance ?? ''}
              onChange={(e) => handleInputChange('delivery', 'max_delivery_distance', e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">ระยะทางสูงสุดที่อนุญาตสำหรับการจัดส่ง</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">ช่วงเวลาให้บริการ</label>
            <input
              type="text"
              value={settings.delivery.delivery_time_slots ?? ''}
              onChange={(e) => handleInputChange('delivery', 'delivery_time_slots', e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="เช่น 09:00-21:00"
            />
            <p className="mt-1 text-xs text-secondary-500">ช่วงเวลาที่เปิดให้บริการจัดส่ง</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">ค่าจัดส่งต่อ กม.</label>
            <input
              type="number"
              value={settings.delivery.per_km_fee ?? ''}
              onChange={(e) => handleInputChange('delivery', 'per_km_fee', e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">ค่าจัดส่งที่คิดเพิ่มต่อกิโลเมตร</p>
          </div>
        </div>
      </div>
      */}

      {/* ส่วนที่ 2: ค่าจัดส่งแบบหลายร้าน */}
      <div className="bg-white p-6 rounded-lg border border-secondary-200">
        <h4 className="text-md font-semibold text-secondary-800 mb-4">
          ค่าจัดส่งแบบหลายร้าน
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค่าจัดส่งพื้นฐานสำหรับหลายร้าน
            </label>
            <input
              type="number"
              value={settings.delivery.multi_restaurant_base_fee ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "delivery",
                  "multi_restaurant_base_fee",
                  e.target.value
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">
              ค่าจัดส่งพื้นฐานเมื่อสั่งจาก 1 ร้าน
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค่าจัดส่งเพิ่มเติมต่อร้าน
            </label>
            <input
              type="number"
              value={settings.delivery.multi_restaurant_additional_fee ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "delivery",
                  "multi_restaurant_additional_fee",
                  e.target.value
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">
              ค่าจัดส่งเพิ่มเติมสำหรับแต่ละร้านที่เพิ่มขึ้น
            </p>
          </div>
        </div>

        {/* ตัวอย่างการคำนวณ */}
        <div className="mt-6 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
          <h5 className="text-md font-semibold text-secondary-800 mb-2">
            ตัวอย่างการคำนวณ:
          </h5>
          <ul className="list-disc list-inside text-sm text-secondary-700 space-y-1">
            <li>
              สั่งจาก 1 ร้าน:{" "}
              {parseFloat(
                settings.delivery.multi_restaurant_base_fee || 0
              ).toFixed(2)}
            </li>
            <li>
              สั่งจาก 2 ร้าน:{" "}
              {(
                parseFloat(settings.delivery.multi_restaurant_base_fee || 0) +
                parseFloat(
                  settings.delivery.multi_restaurant_additional_fee || 0
                )
              ).toFixed(2)}
            </li>
            <li>
              สั่งจาก 3 ร้าน:{" "}
              {(
                parseFloat(settings.delivery.multi_restaurant_base_fee || 0) +
                2 *
                  parseFloat(
                    settings.delivery.multi_restaurant_additional_fee || 0
                  )
              ).toFixed(2)}
            </li>
          </ul>
        </div>
      </div>

      {/* ส่วนที่ 3: การตั้งค่าการจัดส่งตามช่วงเวลาและตามสถานการณ์พิเศษ */}
      <div className="bg-white p-6 rounded-lg border border-secondary-200">
        <h4 className="text-md font-semibold text-secondary-800 mb-4">
          การตั้งค่าขั้นสูง
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              เปิดใช้งานการจัดส่งตามเวลาที่กำหนด
            </label>
            <input
              type="checkbox"
              checked={settings.delivery.enable_scheduled_delivery ?? false}
              onChange={() =>
                handleCheckboxChange("delivery", "enable_scheduled_delivery")
              }
              className="form-checkbox h-5 w-5 text-primary-600"
            />
            <p className="mt-1 text-xs text-secondary-500">
              อนุญาตให้ลูกค้ากำหนดเวลาจัดส่งล่วงหน้าได้
            </p>
        </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ตัวคูณสำหรับช่วงเวลาเร่งด่วน
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.delivery.rush_hour_multiplier ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "delivery",
                  "rush_hour_multiplier",
                  e.target.value
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">
              ค่าจัดส่งจะถูกคูณด้วยค่านี้ในช่วงเวลาเร่งด่วน (เช่น 1.2
              สำหรับเพิ่ม 20%)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ตัวคูณสำหรับวันหยุดสุดสัปดาห์
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.delivery.weekend_multiplier ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "delivery",
                  "weekend_multiplier",
                  e.target.value
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-secondary-500">
              ค่าจัดส่งจะถูกคูณด้วยค่านี้ในวันหยุดสุดสัปดาห์ (เช่น 1.5
              สำหรับเพิ่ม 50%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          วิธีการชำระเงิน
        </h3>
        <div className="space-y-3">
          {[
            { key: "enable_bank_transfer", label: "โอนเงินผ่านธนาคาร" },
            { key: "enable_qr_payment", label: "QR Payment" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payment[key]}
                onChange={() => handleCheckboxChange("payment", key)}
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="text-sm text-secondary-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          ค่าบริการและภาษี
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ยอดขั้นต่ำในการสั่งซื้อ
            </label>
            <input
              type="number"
              value={settings.payment.minimum_order_amount}
              onChange={(e) =>
                handleInputChange(
                  "payment",
                  "minimum_order_amount",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ค่าบริการ (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.payment.service_fee_percentage}
              onChange={(e) =>
                handleInputChange(
                  "payment",
                  "service_fee_percentage",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ภาษีมูลค่าเพิ่ม (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.payment.vat_percentage}
              onChange={(e) =>
                handleInputChange(
                  "payment",
                  "vat_percentage",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          ช่องทางการแจ้งเตือน
        </h3>
        <div className="space-y-3">
          {[
            { key: "enable_email_notifications", label: "อีเมล" },
            { key: "enable_sms_notifications", label: "SMS" },
            { key: "enable_push_notifications", label: "Push Notification" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notification[key]}
                onChange={() => handleCheckboxChange("notification", key)}
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="text-sm text-secondary-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          การแจ้งเตือนอีเมล
        </h3>
        <div className="space-y-3">
          {[
            { key: "email_order_confirmation", label: "ยืนยันการสั่งซื้อ" },
            { key: "email_status_updates", label: "อัปเดตสถานะคำสั่งซื้อ" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notification[key]}
                onChange={() => handleCheckboxChange("notification", key)}
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="text-sm text-secondary-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          การยืนยันตัวตน
        </h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.security.enable_two_factor_auth}
              onChange={() =>
                handleCheckboxChange("security", "enable_two_factor_auth")
              }
              className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <span className="text-sm text-secondary-700">
              เปิดใช้งานการยืนยันตัวตนสองขั้นตอน (2FA)
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          นโยบายรหัสผ่าน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ความยาวขั้นต่ำ
            </label>
            <input
              type="number"
              value={settings.security.password_min_length}
              onChange={(e) =>
                handleInputChange(
                  "security",
                  "password_min_length",
                  parseInt(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ระยะเวลา Session (นาที)
            </label>
            <input
              type="number"
              value={settings.security.session_timeout_minutes}
              onChange={(e) =>
                handleInputChange(
                  "security",
                  "session_timeout_minutes",
                  parseInt(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            {
              key: "password_require_uppercase",
              label: "ต้องมีตัวอักษรพิมพ์ใหญ่",
            },
            {
              key: "password_require_lowercase",
              label: "ต้องมีตัวอักษรพิมพ์เล็ก",
            },
            { key: "password_require_numbers", label: "ต้องมีตัวเลข" },
            { key: "password_require_symbols", label: "ต้องมีสัญลักษณ์พิเศษ" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.security[key]}
                onChange={() => handleCheckboxChange("security", key)}
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="text-sm text-secondary-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          ค่าคอมมิชชั่น
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ร้านอาหารทั่วไป (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.business.restaurant_commission_rate}
              onChange={(e) =>
                handleInputChange(
                  "business",
                  "restaurant_commission_rate",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ร้านอาหารพิเศษ (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.business.special_restaurant_commission_rate}
              onChange={(e) =>
                handleInputChange(
                  "business",
                  "special_restaurant_commission_rate",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          การจัดการร้านอาหาร
        </h3>
        <div className="space-y-3">
          {[
            {
              key: "auto_approve_restaurants",
              label: "อนุมัติร้านอาหารอัตโนมัติ",
            },
            {
              key: "require_restaurant_verification",
              label: "ต้องการการยืนยันตัวตนของร้านอาหาร",
            },
            { key: "enable_reviews", label: "เปิดใช้งานระบบรีวิว" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.business[key]}
                onChange={() => handleCheckboxChange("business", key)}
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <span className="text-sm text-secondary-700">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            จำนวนเมนูสูงสุดต่อร้าน
          </label>
          <input
            type="number"
            value={settings.business.max_products_per_restaurant}
            onChange={(e) =>
              handleInputChange(
                "business",
                "max_products_per_restaurant",
                parseInt(e.target.value)
              )
            }
            className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          การจ่ายเงิน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ยอดขั้นต่ำในการจ่ายเงิน
            </label>
            <input
              type="number"
              value={settings.business.minimum_payout_amount}
              onChange={(e) =>
                handleInputChange(
                  "business",
                  "minimum_payout_amount",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ตารางการจ่ายเงิน
            </label>
            <select
              value={settings.business.payout_schedule}
              onChange={(e) =>
                handleInputChange("business", "payout_schedule", e.target.value)
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="daily">รายวัน</option>
              <option value="weekly">รายสัปดาห์</option>
              <option value="monthly">รายเดือน</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">
          การรีวิว
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              คะแนนรีวิวต่ำสุด
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={settings.business.min_review_rating}
              onChange={(e) =>
                handleInputChange(
                  "business",
                  "min_review_rating",
                  parseInt(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              คะแนนรีวิวสูงสุด
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={settings.business.max_review_rating}
              onChange={(e) =>
                handleInputChange(
                  "business",
                  "max_review_rating",
                  parseInt(e.target.value)
                )
              }
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "app":
        return renderAppSettings();
      case "delivery":
        return renderDeliverySettings();
      case "payment":
        return renderPaymentSettings();
      case "notification":
        return renderNotificationSettings();
      case "security":
        return renderSecuritySettings();
      case "business":
        return renderBusinessSettings();
      default:
        return renderAppSettings();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">ตั้งค่าระบบ</h1>
        <button
          onClick={saveSettings}
          disabled={loading || appSettingsLoading}
          className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading || appSettingsLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>💾 บันทึกการตั้งค่า</>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default AdminSettings; 
