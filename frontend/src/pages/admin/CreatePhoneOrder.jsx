import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";
import { BiSolidPhoneCall } from "react-icons/bi";
import {
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaStore,
  FaCheckCircle,
  FaPlus,
  FaMinus,
  FaTrash,
  FaShoppingCart,
  FaClipboardList,
  FaTruck,
  FaPaperPlane,
  FaUtensils,
  FaInbox,
} from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

const CreatePhoneOrder = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md ring-4 ring-emerald-600/15"
                aria-hidden
              >
                <BiSolidPhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-700">
                    {translate("admin.create_phone_order_title")}
                  </span>
                </h1>
                <p className="mt-1 text-sm text-slate-500 max-w-xl">
                  {translate("admin.create_phone_order_subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/phone-orders")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FaArrowLeft className="h-4 w-4 text-slate-500" />
              {translate("admin.back_to_orders")}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Customer Info & Menu */}
          <div className="xl:col-span-2 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                  <FaUser className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {translate("admin.customer_info")}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {translate("admin.enter_phone_customer_info")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 mb-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FaUser className="h-4 w-4 text-sky-600" />
                    <span>{translate("admin.customer_name")} *</span>
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) =>
                      handleCustomerInfoChange("name", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder={translate("admin.enter_customer_name")}
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FaPhone className="h-4 w-4 text-emerald-600" />
                    <span>{translate("auth.phone")} *</span>
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      handleCustomerInfoChange("phone", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder={translate("admin.enter_phone_number")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FaMapMarkerAlt className="h-4 w-4 text-violet-600" />
                  <span>{translate("order.delivery_address")} *</span>
                </label>
                <textarea
                  value={customerInfo.address}
                  onChange={(e) =>
                    handleCustomerInfoChange("address", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                    <FaUtensils className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {translate("admin.all_menu_items")}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {translate("admin.select_menu_items_subtitle", {
                        count: allMenuItems.length,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translate(
                    "admin.search_menu_or_restaurant_placeholder"
                  )}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-12 pr-12 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-slate-300"
                    aria-label="Clear search"
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {loading ? (
                <div className="flex flex-col items-center py-14">
                  <ImSpinner2 className="mb-4 h-12 w-12 animate-spin text-amber-600" />
                  <p className="font-medium text-slate-600">
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
                        className={`group overflow-hidden rounded-xl border bg-white transition hover:border-amber-200 hover:shadow-md ${
                          isInCart
                            ? "border-emerald-200 bg-emerald-50/40 ring-1 ring-emerald-100"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex gap-4">
                            <div className="shrink-0">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={getTranslatedName(item, currentLanguage, item.name)}
                                  className="h-20 w-20 rounded-xl object-cover shadow-sm transition group-hover:scale-[1.02]"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={`flex h-20 w-20 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ${
                                  item.image ? "hidden" : "flex"
                                }`}
                              >
                                <FaUtensils className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-amber-700">
                                    {getTranslatedName(item, currentLanguage, item.product_name || item.name) ||
                                      translate("common.not_specified")}
                                  </h3>
                                  <div className="mt-1 flex items-center gap-2">
                                    <FaStore className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                                    <p className="truncate text-sm font-medium text-sky-700">
                                      {restaurant?.name ||
                                        restaurant?.restaurant_name ||
                                        translate("common.not_specified")}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-2 shrink-0 text-right">
                                  <span className="text-xl font-bold text-amber-700">
                                    {formatPrice(item.price)}
                                  </span>
                                  {isInCart ? (
                                    <div className="mt-1 flex items-center justify-end gap-1 text-emerald-600">
                                      <FaCheckCircle className="h-3.5 w-3.5" />
                                      <span className="text-xs font-semibold">
                                        {translate("cart.in_cart")}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              {item.description ? (
                                <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                                  {getTranslatedDescription(item, currentLanguage, item.description)}
                                </p>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                                  isInCart
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-amber-500 text-white hover:bg-amber-600"
                                }`}
                              >
                                <FaPlus className="h-3.5 w-3.5" />
                                {isInCart
                                  ? translate("admin.add_more")
                                  : translate("cart.add")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FaInbox className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-800">
                    {searchTerm
                      ? translate("search.no_search_results")
                      : translate("admin.no_menu_in_system")}
                  </h3>
                  <p className="max-w-md text-sm text-slate-500">
                    {searchTerm
                      ? translate("search.try_different_search_or_change_type")
                      : translate("admin.please_add_menu_before_create_order")}
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="xl:col-span-1">
            <div className="space-y-6 xl:sticky xl:top-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
                    <FaShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {translate("cart.cart")}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {cart.length} {translate("common.items")}
                    </p>
                  </div>
                </div>

                {cart.length > 0 ? (
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={`${item.product_id}-${item.restaurant_id}`}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-slate-900">
                              {getTranslatedName(item, currentLanguage, item.product_name) ||
                                translate("common.not_specified")}
                            </h4>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <FaStore className="h-3 w-3 shrink-0 text-sky-600" />
                              <p className="truncate text-xs font-medium text-sky-700">
                                {item.restaurant_name ||
                                  translate("common.not_specified")}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.product_id,
                                item.restaurant_id
                              )
                            }
                            className="ml-1 rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                            aria-label="Remove item"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product_id,
                                  item.restaurant_id,
                                  item.quantity - 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
                              aria-label="Decrease"
                            >
                              <FaMinus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product_id,
                                  item.restaurant_id,
                                  item.quantity + 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700"
                              aria-label="Increase"
                            >
                              <FaPlus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              @ {formatPrice(item.price)}
                            </p>
                            <p className="text-sm font-bold text-violet-700">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FaShoppingCart className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-slate-800">
                      {translate("cart.empty")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {translate("admin.select_menu_items_for_customer")}
                    </p>
                  </div>
                )}
              </section>

              {cart.length > 0 ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                      <FaClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {translate("admin.summary")}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {translate("admin.review_before_order")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {translate("order.subtotal")}:
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatPrice(calculateSubtotal())}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FaTruck className="h-4 w-4 text-sky-600" />
                          {translate("cart.delivery_fee")}:
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {[0, 10000, 20000, 30000].map((fee) => (
                              <button
                                type="button"
                                key={fee}
                                onClick={() => setDeliveryFee(fee)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  deliveryFee === fee
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
                                }`}
                              >
                                {fee === 0
                                  ? translate("common.free")
                                  : `${formatPrice(fee)}`}
                              </button>
                            ))}
                          </div>

                          <input
                            type="number"
                            value={deliveryFee}
                            onChange={(e) =>
                              setDeliveryFee(parseFloat(e.target.value) || 0)
                            }
                            className="w-24 rounded-lg border border-slate-200 bg-white py-1.5 pr-2 text-right text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            min="0"
                            step="0.01"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-base font-bold text-slate-900">
                          {translate("order.total")}:
                        </span>
                        <span className="text-2xl font-bold text-emerald-700">
                          {formatPrice(calculateTotal())}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitOrder}
                      disabled={submitting || cart.length === 0}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold shadow-sm transition ${
                        submitting || cart.length === 0
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <ImSpinner2 className="h-5 w-5 animate-spin" />
                          <span>{translate("admin.creating")}</span>
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="h-5 w-5" />
                          <span>{translate("admin.create_order_now")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePhoneOrder;
