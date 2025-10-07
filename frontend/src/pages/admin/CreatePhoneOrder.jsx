import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";

const CreatePhoneOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { translate, currentLanguage } = useLanguage();

  // Customer Information
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Order State
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      // First get all restaurants
      const restaurantsResponse = await api.get("/restaurants/");
      const restaurantsList =
        restaurantsResponse.data.results || restaurantsResponse.data;
      setRestaurants(restaurantsList);

      // Then get all menu items from all restaurants
      const allItems = [];
      for (const restaurant of restaurantsList) {
        try {
          const menuResponse = await api.get(
            `/restaurants/${restaurant.restaurant_id}/products/`
          );
          const menuItems = menuResponse.data.results || menuResponse.data;

          // Add restaurant info to each menu item
          const itemsWithRestaurant = menuItems.map((item) => ({
            ...item,
            restaurant_id: restaurant.restaurant_id,
            restaurant_name: restaurant.name,
          }));

          allItems.push(...itemsWithRestaurant);
        } catch (error) {
          // Handle error silently
        }
      }

      setAllMenuItems(allItems);
    } catch (error) {
      alert(translate("common.failed_to_load_products"));
    } finally {
      setLoading(false);
    }
  }, [translate]);

  // Load all menu items on component mount
  useEffect(() => {
    fetchAllMenuItems();
  }, [fetchAllMenuItems]);

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addToCart = (product) => {
    // Find restaurant info from restaurants list
    const restaurantInfo = restaurants.find(
      (r) => r.restaurant_id === product.restaurant_id
    );

    const existingItem = cart.find(
      (item) =>
        item.product_id === product.product_id &&
        item.restaurant_id === product.restaurant_id
    );

    if (existingItem) {
      setCart((prev) =>
        prev.map((item) =>
          item.product_id === product.product_id &&
          item.restaurant_id === product.restaurant_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const cartItem = {
        product_id: product.product_id,
        product_name: product.product_name || product.name,
        price: parseFloat(product.price),
        quantity: 1,
        restaurant_id: product.restaurant_id,
        restaurant_name:
          product.restaurant_name ||
          restaurantInfo?.name ||
          restaurantInfo?.restaurant_name ||
          "ไม่มีชื่อร้าน",
        translations: product.translations, // เก็บข้อมูล translations ไว้สำหรับการแปล
      };
      setCart((prev) => [...prev, cartItem]);
    }
  };

  const removeFromCart = (productId, restaurantId) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product_id === productId && item.restaurant_id === restaurantId
          )
      )
    );
  };

  const updateCartQuantity = (productId, restaurantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, restaurantId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId && item.restaurant_id === restaurantId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryFee;
  };

  // Filter menu items based on search term - simplified search
  const getFilteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allMenuItems;
    }

    const search = searchTerm.toLowerCase();

    const filtered = allMenuItems.filter((item) => {
      // Get menu name (try both fields) with translation
      const menuName = getTranslatedName(item, currentLanguage, item.product_name || item.name || "").toLowerCase();

      // Get restaurant name (try multiple sources)
      const restaurant = restaurants.find(
        (r) => r.restaurant_id === item.restaurant_id
      );
      const restaurantName = (
        restaurant?.name ||
        restaurant?.restaurant_name ||
        item.restaurant_name ||
        ""
      ).toLowerCase();

      // Search in both menu name and restaurant name
      const matchesMenu = menuName.includes(search);
      const matchesRestaurant = restaurantName.includes(search);

      // Match found

      return matchesMenu || matchesRestaurant;
    });

    return filtered;
  }, [searchTerm, allMenuItems, restaurants]);

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      alert(translate("admin.please_enter_customer_name"));
      return false;
    }
    if (!customerInfo.phone.trim()) {
      alert(translate("admin.please_enter_phone_number"));
      return false;
    }
    if (!customerInfo.address.trim()) {
      alert(translate("cart.please_enter_the_delivery_address"));
      return false;
    }
    if (cart.length === 0) {
      alert(translate("admin.please_add_items_to_cart"));
      return false;
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Group cart items by restaurant
      const ordersByRestaurant = cart.reduce((acc, item) => {
        const restaurantId = item.restaurant_id;
        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurant_id: restaurantId,
            restaurant_name: item.restaurant_name,
            items: [],
          };
        }
        acc[restaurantId].items.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        });
        return acc;
      }, {});

      // Create guest order payload for phone order (no email required)
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.address,
        total_delivery_fee: parseFloat(deliveryFee).toFixed(2), // Ensure decimal format
        special_instructions: customerInfo.notes || "",
        payment_method: "bank_transfer", // Default payment method
        restaurants: Object.values(ordersByRestaurant).map((restaurant) => ({
          restaurant_id: parseInt(restaurant.restaurant_id), // Ensure integer
          items: restaurant.items.map((item) => ({
            product_id: parseInt(item.product_id), // Ensure integer
            quantity: parseInt(item.quantity), // Ensure integer
          })),
        })),
      };


      // Create FormData for guest orders multi endpoint
      const formData = new FormData();
      formData.append("order_data", JSON.stringify(orderData));
      // No proof_of_payment for phone orders - will be handled separately

      const response = await api.post("/guest-orders/multi/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(translate("admin.order_created_success"));

      // Navigate to phone orders management page
      if (response.data.guest_order_id || response.data.temporary_id) {
        navigate("/admin/phone-orders", {
          state: {
            highlightOrderId: response.data.guest_order_id,
            temporaryId: response.data.temporary_id,
          },
        });
      } else {
        navigate("/admin/phone-orders");
      }
    } catch (error) {

      // Show detailed error message
      let errorMessage = translate("admin.error_creating_order") + ": ";
      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage += error.response.data;
        } else if (error.response.data.message) {
          errorMessage += error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage += error.response.data.error;
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-green-500/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  📞 {translate("admin.create_phone_order_title")}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  {translate("admin.create_phone_order_subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/admin/phone-orders")}
                className="group bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-medium">
                  {translate("admin.back_to_orders")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Customer Info & Menu */}
          <div className="xl:col-span-2 space-y-6">
            {/* Enhanced Customer Information */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    👤 {translate("admin.customer_info")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {translate("admin.enter_phone_customer_info")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{translate("admin.customer_name")} *</span>
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) =>
                      handleCustomerInfoChange("name", e.target.value)
                    }
                    className="w-full p-4 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white/80 transition-all duration-300 placeholder-gray-500"
                    placeholder={translate("admin.enter_customer_name")}
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{translate("auth.phone")} *</span>
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      handleCustomerInfoChange("phone", e.target.value)
                    }
                    className="w-full p-4 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white/80 transition-all duration-300 placeholder-gray-500"
                    placeholder={translate("admin.enter_phone_number")}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <svg
                    className="w-4 h-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{translate("order.delivery_address")} *</span>
                </label>
                <textarea
                  value={customerInfo.address}
                  onChange={(e) =>
                    handleCustomerInfoChange("address", e.target.value)
                  }
                  rows={3}
                  className="w-full p-4 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white/80 transition-all duration-300 placeholder-gray-500"
                  placeholder={translate(
                    "cart.enter_the_delivery_address_in_detail"
                  )}
                />
              </div>

              {/* <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <svg
                    className="w-4 h-4 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{translate("cart.special_instructions")}</span>
                </label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) =>
                    handleCustomerInfoChange("notes", e.target.value)
                  }
                  rows={2}
                  className="w-full p-4 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white/80 transition-all duration-300 placeholder-gray-500"
                  placeholder={translate("cart.special_instructions_detail")}
                />
              </div> */}
            </div>

            {/* Enhanced Menu Search & Display */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      🍽️ {translate("admin.all_menu_items")}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {translate("admin.select_menu_items_subtitle", {
                        count: allMenuItems.length,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative group mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translate(
                    "admin.search_menu_or_restaurant_placeholder"
                  )}
                  className="w-full pl-12 pr-4 py-4 bg-white/60 border border-white/30 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white/80 transition-all duration-300 placeholder-gray-500 text-lg"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-400 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">
                    {translate("admin.loading_menus")}
                  </p>
                </div>
              ) : getFilteredMenuItems.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {getFilteredMenuItems.map((item) => {
                    const restaurant = restaurants.find(
                      (r) => r.restaurant_id === item.restaurant_id
                    );
                    const isInCart = cart.some(
                      (cartItem) =>
                        cartItem.product_id === item.product_id &&
                        cartItem.restaurant_id === item.restaurant_id
                    );

                    return (
                      <div
                        key={`${item.product_id}-${item.restaurant_id}`}
                        className={`group bg-white/60 backdrop-blur-sm rounded-xl border transition-all duration-300 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 overflow-hidden ${
                          isInCart
                            ? "border-green-300 bg-green-50/80"
                            : "border-white/30"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex gap-4">
                            {/* Enhanced Product Image */}
                            <div className="flex-shrink-0">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={getTranslatedName(item, currentLanguage, item.name)}
                                  className="w-20 h-20 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center shadow-md ${
                                  item.image ? "hidden" : "flex"
                                }`}
                              >
                                <span className="text-3xl">🍽️</span>
                              </div>
                            </div>

                            {/* Enhanced Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-orange-600 transition-colors duration-300">
                                    {getTranslatedName(item, currentLanguage, item.product_name || item.name) ||
                                      translate("common.not_specified")}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-2 h-2 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 8 8"
                                      >
                                        <circle cx="4" cy="4" r="4" />
                                      </svg>
                                    </div>
                                    <p className="text-sm text-blue-600 font-medium">
                                      {restaurant?.name ||
                                        restaurant?.restaurant_name ||
                                        translate("common.not_specified")}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    {formatPrice(item.price)}
                                  </span>
                                  {isInCart && (
                                    <div className="flex items-center justify-end space-x-1 mt-1">
                                      <svg
                                        className="w-4 h-4 text-green-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-xs text-green-600 font-medium">
                                        {translate("cart.in_cart")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {item.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {getTranslatedDescription(item, currentLanguage, item.description)}
                                </p>
                              )}

                              <button
                                onClick={() => addToCart(item)}
                                className={`group/btn inline-flex items-center space-x-2 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium ${
                                  isInCart
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                }`}
                              >
                                <svg
                                  className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                <span>
                                  {isInCart
                                    ? translate("admin.add_more")
                                    : translate("cart.add")}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {searchTerm
                      ? translate("search.no_search_results")
                      : translate("admin.no_menu_in_system")}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? translate("search.try_different_search_or_change_type")
                      : translate("admin.please_add_menu_before_create_order")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Cart & Order Summary */}
          <div className="xl:col-span-1">
            <div className="xl:sticky xl:top-6 space-y-6">
              {/* Enhanced Cart */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      🛍️ {translate("cart.cart")}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {cart.length} {translate("common.items")}
                    </p>
                  </div>
                </div>

                {cart.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {cart.map((item, index) => {
                      return (
                        <div
                          key={`${item.product_id}-${item.restaurant_id}`}
                          className="bg-white/60 rounded-lg p-3 border border-white/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 text-sm truncate">
                                {getTranslatedName(item, currentLanguage, item.product_name) ||
                                  translate("common.not_specified")}
                              </h4>
                              <div className="flex items-center space-x-1 mt-0.5">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <p className="text-xs text-blue-600 truncate">
                                  {item.restaurant_name ||
                                    translate("common.not_specified")}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                removeFromCart(
                                  item.product_id,
                                  item.restaurant_id
                                )
                              }
                              className="p-1 rounded-lg hover:bg-red-50 transition-colors ml-2"
                            >
                              <svg
                                className="w-4 h-4 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  updateCartQuantity(
                                    item.product_id,
                                    item.restaurant_id,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartQuantity(
                                    item.product_id,
                                    item.restaurant_id,
                                    item.quantity + 1
                                  )
                                }
                                className="w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                @ {formatPrice(item.price)}
                              </p>
                              <p className="text-sm font-bold text-purple-600">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      {translate("cart.empty")}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {translate("admin.select_menu_items_for_customer")}
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Order Summary */}
              {cart.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        📊 {translate("admin.summary")}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {translate("admin.review_before_order")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/60 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">
                          {translate("order.subtotal")}:
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          {formatPrice(calculateSubtotal())}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-700 font-medium">
                            {translate("cart.delivery_fee")}:
                          </span>
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>

                        {/* Quick Delivery Fee Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            {[0, 10000, 20000, 30000].map((fee) => (
                              <button
                                key={fee}
                                onClick={() => setDeliveryFee(fee)}
                                className={`px-2 py-1 text-xs rounded-md font-medium transition-all duration-200 ${
                                  deliveryFee === fee
                                    ? "bg-green-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                                }`}
                              >
                                {fee === 0
                                  ? translate("common.free")
                                  : `${formatPrice(fee)}`}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={deliveryFee}
                              onChange={(e) =>
                                setDeliveryFee(parseFloat(e.target.value) || 0)
                              }
                              className="w-20 p-1 bg-white/90 border-2 border-green-200 rounded-lg text-right text-xs font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-2 flex justify-between items-center">
                        <span className="text-base font-bold text-gray-800">
                          {translate("order.total")}:
                        </span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatPrice(calculateTotal())}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      disabled={submitting || cart.length === 0}
                      className={`group w-full py-3 px-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform ${
                        submitting || cart.length === 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {submitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>{translate("admin.creating")}</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span>{translate("admin.create_order_now")}</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePhoneOrder;
