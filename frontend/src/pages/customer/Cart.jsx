import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import api, { appSettingsService } from "../../services/api";
import { ErrorHandler, handleError } from "../../utils/errorHandler";
import { toast } from "../../hooks/useNotification";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../utils/formatPrice";
import { getTranslatedName, getTranslatedDescription } from "../../utils/translationUtils";
import AddressPicker from "../../components/maps/AddressPicker";
import MapPicker from "../../components/maps/MapPicker";
import {
  LuMapPin,
  LuCheck,
  LuStore,
  LuTriangleAlert,
  LuUtensilsCrossed,
  LuTrash2,
  LuLandmark,
  LuCamera,
  LuPackage,
  LuShoppingCart,
} from "react-icons/lu";
import { reverseGeocode, getGoogleMapsApiKey } from "../../utils/googleMaps";

const Cart = () => {
  const { translate, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    items: rawCartItems,
    total,
    subtotal,
    itemCount,
    deliveryFee,
    deliveryFeeLoading,
    deliveryLocation,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsByRestaurant,
    getRestaurantCount,
    setDeliveryLocation,
    recalculateDeliveryFeeNow,
    deliveryValidation,
  } = useCart();

  const cartItems = useMemo(
    () => (Array.isArray(rawCartItems) ? rawCartItems : []),
    [rawCartItems]
  );

  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [restaurantStatuses, setRestaurantStatuses] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [freeDeliveryMinimum, setFreeDeliveryMinimum] = useState(null);
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const mapPickerRef = useRef(null);

  // โหลดที่อยู่เริ่มต้นจาก profile หรือ deliveryLocation ถ้ามี
  useEffect(() => {
   if (deliveryLocation && deliveryLocation.address) {
      setDeliveryAddress(deliveryLocation.address);
    }
  }, [deliveryLocation]);

  // ดึงตำแหน่งปัจจุบันอัตโนมัติเมื่อยังไม่มี deliveryLocation
  useEffect(() => {
    if (!deliveryLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            const address = await reverseGeocode(location.lat, location.lng, getGoogleMapsApiKey());
            const locationWithAddress = {
              ...location,
              address: address
            };
            setDeliveryLocation(locationWithAddress);
            setDeliveryAddress(address);
          } catch (error) {
            console.warn('Reverse geocoding failed, using coordinates:', error);
            const fallbackAddress = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            const locationWithAddress = {
              ...location,
              address: fallbackAddress
            };
            setDeliveryLocation(locationWithAddress);
            setDeliveryAddress(fallbackAddress);
          }
        },
        (error) => {
          console.log('Geolocation not available or denied:', error);
          // แสดง popup เมื่อผู้ใช้ปฏิเสธการแชร์ตำแหน่ง
          if (error.code === 1) { // PERMISSION_DENIED
            setShowLocationPermissionModal(true);
          }
        }
      );
    }
  }, [deliveryLocation, setDeliveryLocation]); // เช็คเมื่อ deliveryLocation เปลี่ยน

  // ดึงตำแหน่งปัจจุบันเมื่อเปิด map picker และยังไม่มี deliveryLocation
  useEffect(() => {
    if (showMapPicker && !deliveryLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            const address = await reverseGeocode(location.lat, location.lng, getGoogleMapsApiKey());
            const locationWithAddress = {
              ...location,
              address: address
            };
            setDeliveryLocation(locationWithAddress);
            setDeliveryAddress(address);
          } catch (error) {
            console.warn('Reverse geocoding failed, using coordinates:', error);
            const fallbackAddress = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            const locationWithAddress = {
              ...location,
              address: fallbackAddress
            };
            setDeliveryLocation(locationWithAddress);
            setDeliveryAddress(fallbackAddress);
          }
        },
        (error) => {
          console.log('Geolocation not available or denied:', error);
          // แสดง popup เมื่อผู้ใช้ปฏิเสธการแชร์ตำแหน่ง
          if (error.code === 1) { // PERMISSION_DENIED
            setShowLocationPermissionModal(true);
          }
        }
      );
    }
  }, [showMapPicker, deliveryLocation]);

  // โหลดข้อมูลการชำระเงิน
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await appSettingsService.getPublic();
        if (response.data) {
          setPaymentInfo({
            bank_name: response.data.bank_name,
            bank_account_number: response.data.bank_account_number,
            bank_account_name: response.data.bank_account_name,
            qr_code_url: response.data.qr_code_url,
          });
          const minimumRaw =
            response.data.free_delivery_minimum_amount ??
            response.data.free_delivery_minimum;
          const minimumValue = Number(minimumRaw);
          setFreeDeliveryMinimum(
            Number.isFinite(minimumValue) && minimumValue > 0
              ? minimumValue
              : null
          );
        }
      } catch (error) {
        console.error("Error fetching payment info:", error);
        setFreeDeliveryMinimum(null);
      }
    };

    fetchPaymentInfo();
  }, []);

  // Memoize restaurant IDs เพื่อป้องกัน infinite loop
  const restaurantIds = useMemo(() => {
    if (cartItems.length === 0) return [];
    return [...new Set(cartItems.map((item) => item.restaurant_id))];
  }, [cartItems]);

  // ตรวจสอบสถานะร้านในตะกร้า
  useEffect(() => {
    let isSubscribed = true;

    const checkRestaurantStatuses = async () => {
      if (restaurantIds.length === 0) {
        setRestaurantStatuses((prev) =>
          Object.keys(prev).length === 0 ? prev : {}
        );
        return;
      }
      const statuses = {};

      try {
        for (const restaurantId of restaurantIds) {
          const response = await api.get(`/restaurants/${restaurantId}/`);
          const restaurant = response.data;
          statuses[restaurantId] = {
            name: restaurant.restaurant_name,
            status: restaurant.status,
          };
        }

        if (!isSubscribed) {
          return;
        }

        setRestaurantStatuses((prevStatuses) => {
          const prevKeys = Object.keys(prevStatuses);
          const currentKeys = Object.keys(statuses);

          const isSameLength = prevKeys.length === currentKeys.length;
          const hasSameEntries =
            isSameLength &&
            currentKeys.every(
              (key) =>
                prevStatuses[key]?.name === statuses[key]?.name &&
                prevStatuses[key]?.status === statuses[key]?.status
            );

          return hasSameEntries ? prevStatuses : statuses;
        });
      } catch (error) {
        console.error("Error checking restaurant statuses:", error);
      }
    };

    checkRestaurantStatuses();

    return () => {
      isSubscribed = false;
    };
  }, [restaurantIds]);

  // จัดกลุ่มสินค้าตามร้าน
  const itemsByRestaurant =
    typeof getItemsByRestaurant === "function"
      ? getItemsByRestaurant()
      : {};
  const restaurantCount =
    typeof getRestaurantCount === "function"
      ? getRestaurantCount()
      : 0;
  const hasFreeDeliveryMinimum =
    Number.isFinite(freeDeliveryMinimum) && freeDeliveryMinimum > 0;
  const remainingForFreeDelivery = hasFreeDeliveryMinimum
    ? Math.max(Number(freeDeliveryMinimum) - Number(subtotal), 0)
    : 0;
  const isFreeDeliveryReached =
    hasFreeDeliveryMinimum && Number(subtotal) >= Number(freeDeliveryMinimum);
  const formattedMaxDistanceKm =
    deliveryValidation?.maxDistanceKm !== null &&
    deliveryValidation?.maxDistanceKm !== undefined
      ? Number(deliveryValidation.maxDistanceKm).toFixed(2)
      : null;
  const formattedDistanceKm =
    deliveryValidation?.distanceKm !== null &&
    deliveryValidation?.distanceKm !== undefined
      ? Number(deliveryValidation.distanceKm).toFixed(2)
      : null;
  const outOfRangeMessage = formattedMaxDistanceKm
    ? translate("cart.delivery_out_of_range_max", {
        max_distance: formattedMaxDistanceKm,
      })
    : translate("cart.delivery_out_of_range");
  const outOfRangeDetailMessage = formattedMaxDistanceKm
    ? formattedDistanceKm
      ? translate("cart.delivery_out_of_range_detail_full", {
          max_distance: formattedMaxDistanceKm,
          distance: formattedDistanceKm,
        })
      : translate("cart.delivery_out_of_range_detail_max", {
          max_distance: formattedMaxDistanceKm,
        })
    : null;

  // จัดการการอัปโหลดหลักฐานการโอน
  const handleProofOfPaymentChange = (e) => {
    const file = e.target.files[0];
    setProofOfPayment(file);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty");
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.warning("Please enter delivery address");
      return;
    }

    if (deliveryValidation?.isOutOfRange) {
      toast.warning(outOfRangeMessage);
      return;
    }

    if (!proofOfPayment) {
      toast.warning("Please attach payment proof");
      return;
    }

    // ตรวจสอบการ login
    const userId = user?.id || user?.user_id;
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      toast.error("Please login before placing order");
      return;
    }

    // ตรวจสอบสถานะร้านก่อนชำระเงิน
    const restaurantIds = [
      ...new Set(cartItems.map((item) => item.restaurant_id)),
    ];
    try {
      for (const restaurantId of restaurantIds) {
        const response = await api.get(`/restaurants/${restaurantId}/`);
        const restaurant = response.data;
        if (restaurant.status !== "open") {
          toast.error(
            `Sorry, "${restaurant.restaurant_name}" is closed. Please remove items from this restaurant before ordering`
          );
          return;
        }
      }
    } catch (error) {
      console.error("Error checking restaurant status:", error);
      toast.error("Unable to check restaurant status. Please try again");
      return;
    }

    setLoading(true);
    try {

      // สร้าง FormData สำหรับส่งข้อมูลรวมไฟล์
      const formData = new FormData();

      // รวมที่อยู่หลักและรายละเอียดเพิ่มเติม
      const fullDeliveryAddress = deliveryAddressDetail.trim()
        ? `${deliveryAddress.trim()}\n${deliveryAddressDetail.trim()}`
        : deliveryAddress.trim();

      // ข้อมูลคำสั่งซื้อ
      const orderData = {
        user: userId,
        delivery_address: fullDeliveryAddress,
        delivery_latitude: deliveryLocation?.lat ? parseFloat(deliveryLocation.lat.toFixed(12)) : null,
        delivery_longitude: deliveryLocation?.lng ? parseFloat(deliveryLocation.lng.toFixed(12)) : null,
        notes: specialInstructions.trim() || "",
        restaurants: Object.keys(itemsByRestaurant).map((restaurantId) => ({
          restaurant_id: parseInt(restaurantId),
          items: itemsByRestaurant[restaurantId].items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        })),
        total_delivery_fee: parseFloat(deliveryFee.toFixed(5)),
      };

      // ข้อมูลการชำระเงิน
      const paymentData = {
        payment_method: paymentMethod,
        amount_paid: total,
        status: "pending",
      };

      formData.append("order_data", JSON.stringify(orderData));
      formData.append("payment_data", JSON.stringify(paymentData));

      // แนบไฟล์หลักฐานการโอน
      if (proofOfPayment) {
        formData.append("proof_of_payment", proofOfPayment);
      }

      // ใช้ api instance ที่ตั้งค่า headers และ baseURL ไว้แล้ว

      try {
        const response = await api.post("/orders/multi/", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // สำเร็จ
        const orderResult = response.data;
        clearCart();

        // ไม่แสดง Toast แจ้งเตือนเมื่อสั่งสำเร็จ
        navigate("/orders");
      } catch (error) {
        // ถ้า API multi ยังไม่มี ลองใช้ single restaurant order แบบเดิม
        if (error.response?.status === 404 && restaurantCount === 1) {
          await handleSingleRestaurantCheckout(token, userId);
        } else {
          const errorData = error.response?.data || error.message;
          let errorMessage = "Error occurred while placing order";
          if (typeof errorData === "object") {
            const errors = [];
            Object.keys(errorData).forEach((key) => {
              if (Array.isArray(errorData[key])) {
                errors.push(`${key}: ${errorData[key].join(", ")}`);
              } else {
                errors.push(`${key}: ${errorData[key]}`);
              }
            });
            if (errors.length > 0) {
              errorMessage = `Error occurred:\n${errors.join("\n")}`;
            }
          }
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      ErrorHandler.handleNetworkError("Order");
    } finally {
      setLoading(false);
    }
  };

  // Fallback สำหรับร้านเดียว (ใช้ API เดิม)
  const handleSingleRestaurantCheckout = async (token, userId) => {
    const restaurantId = cartItems[0]?.restaurant_id;

    // สร้าง FormData สำหรับส่งข้อมูลรวมไฟล์
    const formData = new FormData();

    // รวมที่อยู่หลักและรายละเอียดเพิ่มเติม
    const fullDeliveryAddress = deliveryAddressDetail.trim()
      ? `${deliveryAddress.trim()}\n${deliveryAddressDetail.trim()}`
      : deliveryAddress.trim();

    const orderData = {
      restaurant: restaurantId,
      user: userId,
      order_items: cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      delivery_address: fullDeliveryAddress,
      delivery_latitude: deliveryLocation?.lat ? parseFloat(deliveryLocation.lat.toFixed(12)) : null,
      delivery_longitude: deliveryLocation?.lng ? parseFloat(deliveryLocation.lng.toFixed(12)) : null,
      notes: specialInstructions.trim() || "",
    };

    // ข้อมูลการชำระเงิน
    const paymentData = {
      payment_method: paymentMethod,
      amount_paid: total,
      status: "pending",
    };

    formData.append("order_data", JSON.stringify(orderData));
    formData.append("payment_data", JSON.stringify(paymentData));

    // แนบไฟล์หลักฐานการโอน
    if (proofOfPayment) {
      formData.append("proof_of_payment", proofOfPayment);
    }

    // ไม่ต้องตั้งค่า headers เพิ่มเติม เพราะ api instance จะจัดการ Authorization header ให้อัตโนมัติ

    try {
      const response = await api.post("/orders/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearCart();
      navigate("/orders");
    } catch (error) {
      throw new Error("Single restaurant order failed");
    }
  };



  if (loading) {
    return (
      <div className="container mx-auto px-2 py-5 sm:px-4 sm:py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Processing order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-5 sm:px-4 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          {translate("cart.cart")}
        </h1>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-2 text-secondary-500 hover:text-red-600 text-sm font-medium py-1 px-2 rounded hover:bg-secondary-100 transition-colors"
          >
            <LuTrash2 className="w-4 h-4" />
            {translate("cart.clear_all")}
          </button>
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items แยกตามร้าน */}
          <div className="lg:col-span-2">
            <div className="space-y-4 sm:space-y-6">
              {/* Multi-Restaurant Info */}
              {restaurantCount > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                      <LuStore className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-blue-800 font-semibold">
                        {translate("cart.order_from_multiple_restaurants")}
                      </h3>
                      <p className="text-blue-600 text-sm">
                        {translate("cart.you_are_ordering_food_from")}{" "}
                        {restaurantCount} {translate("cart.restaurants")}{" "}
                        {translate("cart.delivery_fee")}{" "}
                        {formatCurrency(deliveryFee)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Closed Restaurant Warning */}
              {Object.values(restaurantStatuses).some(
                (status) => status.status !== "open"
              ) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
                      <LuTriangleAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-red-800 font-semibold">
                        {translate(
                          "cart.there_are_closed_restaurants_in_the_cart"
                        )}
                      </h3>
                      <p className="text-red-600 text-sm">
                        {translate("cart.restaurant")}:{" "}
                        {Object.entries(restaurantStatuses)
                          .filter(([_, status]) => status.status !== "open")
                          .map(([_, status]) => status.name)
                          .join(", ")}{" "}
                        {translate("common.is_closed")}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        {translate(
                          "cart.please_remove_the_items_from_the_closed_restaurants_before_ordering"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* แสดงสินค้าแยกตามร้าน */}
              {Object.entries(itemsByRestaurant).map(
                ([restaurantId, restaurantData]) => (
                  <div
                    key={restaurantId}
                    className="bg-white rounded-lg shadow-md p-4 sm:p-6"
                  >
                    {/* Restaurant Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg mr-3">
                          <LuStore className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700">
                            {restaurantData.restaurant.name}
                          </h2>
                          {restaurantData.restaurant.address && (
                            <p className="text-sm text-secondary-500">
                              {restaurantData.restaurant.address}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-medium text-secondary-700">
                          {formatCurrency(restaurantData.subtotal)}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {restaurantData.items.length}{" "}
                          {translate("order.items_count")}
                        </p>
                      </div>
                    </div>

                    {/* Items in this restaurant */}
                    <div className="space-y-4">
                      {restaurantData.items.map((item) => (
                        <div
                          key={item.id}
                          className="border-b pb-4 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {item.image_display_url || item.image_url ? (
                                <img
                                  src={item.image_display_url || item.image_url}
                                  alt={getTranslatedName(item, currentLanguage, item.product_name)}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <LuUtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-secondary-800 text-sm sm:text-base truncate">
                                {getTranslatedName(item, currentLanguage, item.product_name)}
                              </h3>
                              {item.special_instructions && (
                                <p className="text-xs sm:text-sm text-secondary-500 italic truncate">
                                  {translate("cart.note")}:{" "}
                                  {item.special_instructions}
                                </p>
                              )}
                              <p className="text-secondary-600 font-medium text-sm sm:text-base">
                                {formatCurrency(item.price)}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 transition-colors"
                              >
                                <span className="text-secondary-600 text-sm sm:text-base">−</span>
                              </button>
                              <span className="text-secondary-800 font-semibold min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm sm:text-base">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 transition-colors"
                              >
                                <span className="text-secondary-600 text-sm sm:text-base">+</span>
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-secondary-400 hover:text-red-500 p-2 flex-shrink-0 rounded-lg hover:bg-secondary-100 transition-colors"
                              title="ลบสินค้า"
                            >
                              <LuTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 mt-6 sm:mt-8">
              <h3 className="text-lg font-semibold text-secondary-700 mb-4">
                {translate("cart.delivery_address")}
              </h3>
              
              {/* Address Picker + Map Toggle + Confirm */}
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                {/* <AddressPickerLeaflet
                  className="w-full md:w-72 lg:w-80"
                  value={deliveryAddress}
                  onChange={(address) => {
                    setDeliveryAddress(address);
                  }}
                  onLocationSelect={(location) => {
                    setDeliveryLocation(location);
                    setDeliveryAddress(location.address);
                  }}
                required
                readOnly
                /> */}
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition-colors flex items-center justify-center gap-2 md:w-auto"
                >
                  <LuMapPin className="w-4 h-4" />{" "}
                  {showMapPicker
                    ? translate("cart.hide_map_picker")
                    : translate("cart.show_map_picker")}
                </button>
                {showMapPicker && (
                  <button
                    type="button"
                    disabled={deliveryFeeLoading}
                    onClick={async () => {
                      if (mapPickerRef.current) {
                        const loc = await mapPickerRef.current.confirmCurrentLocation();
                        if (loc) recalculateDeliveryFeeNow(loc);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 md:w-auto min-w-[140px] ${
                      deliveryFeeLoading
                        ? "bg-secondary-300 text-secondary-500 cursor-wait"
                        : deliveryLocation?.lat && deliveryLocation?.lng
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-primary-500 text-white hover:bg-primary-600"
                    }`}
                  >
                    {deliveryFeeLoading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        <span>{translate("cart.loading") || "กำลังโหลด..."}</span>
                      </>
                    ) : deliveryLocation?.lat && deliveryLocation?.lng ? (
                      <>
                        <LuCheck className="w-5 h-5 flex-shrink-0" />
                        <span>{translate("cart.select_this_location") || "เลือกตำแหน่งนี้"}</span>
                      </>
                    ) : (
                      translate("cart.select_this_location") || "เลือกตำแหน่งนี้"
                    )}
                  </button>
                )}
              </div>

              {/* Map Picker */}
              {showMapPicker && (
                <div className="mb-4">
                  <MapPicker
                    ref={mapPickerRef}
                    deferSelection
                    initialCenter={deliveryLocation ? { lat: deliveryLocation.lat, lng: deliveryLocation.lng } : { lat: 13.7563, lng: 100.5018 }}
                    onLocationSelect={(location) => {
                      setDeliveryLocation(location);
                      setDeliveryAddress(location.address);
                    }}
                    height="300px"
                  />
                </div>
              )}

              {/* Additional Address Details */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {translate("cart.delivery_address_detail")}
                </label>
                <textarea
                  value={deliveryAddressDetail}
                  onChange={(e) => setDeliveryAddressDetail(e.target.value)}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={translate("cart.delivery_address_detail_placeholder")}
                  rows="3"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  {translate("cart.delivery_address_detail_hint")}
                </p>
              </div>

            </div>

            {/* Special Instructions */}
            {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-secondary-700 mb-4">
                {translate("cart.special_instructions")}
              </h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={translate("cart.special_instructions_detail")}
                rows="2"
              />
            </div> */}

            {/* Payment Information */}
            {paymentInfo && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-secondary-700 mb-4">
                  {translate("cart.payment_information")}
                </h3>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-3">
                    {translate("cart.select_payment_method")}
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">
                        {translate("cart.bank_transfer")}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qr_payment"
                        checked={paymentMethod === "qr_payment"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">
                        {translate("cart.qr_payment")}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Bank Transfer Info */}
                {paymentMethod === "bank_transfer" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg mr-3 mt-0.5">
                        <LuLandmark className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          {translate("cart.bank_account_information")}
                        </h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p>
                            <strong>{translate("cart.bank")}:</strong>{" "}
                            {paymentInfo.bank_name ||
                              translate("common.not_specified")}
                          </p>
                          <p>
                            <strong>
                              {translate("cart.bank_account_number")}:
                            </strong>{" "}
                            {paymentInfo.bank_account_number ||
                              translate("common.not_specified")}
                          </p>
                          <p>
                            <strong>
                              {translate("cart.bank_account_name")}:
                            </strong>{" "}
                            {paymentInfo.bank_account_name ||
                              translate("common.not_specified")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Payment */}
                {paymentMethod === "qr_payment" && paymentInfo.qr_code_url && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-green-800 mb-3">
                        {translate("cart.qr_code_for_payment")}
                      </h4>
                      <div className="flex justify-center">
                        <img
                          src={paymentInfo.qr_code_url}
                          alt="QR Code Payment"
                          className="w-48 h-48 object-contain border border-green-300 rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        {translate("cart.scan_qr_code_to_pay")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Proof of Payment Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {translate("cart.proof_of_payment")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofOfPaymentChange}
                      className="hidden"
                      id="proof-of-payment"
                      required
                    />
                    <label
                      htmlFor="proof-of-payment"
                      className="cursor-pointer"
                    >
                      {proofOfPayment ? (
                        <div className="text-green-600">
                          <div className="flex justify-center mb-2">
                            <div className="p-2 bg-green-100 rounded-full">
                              <LuCheck className="w-6 h-6" />
                            </div>
                          </div>
                          <p className="text-sm font-medium break-all overflow-hidden">
                            {proofOfPayment.name}
                          </p>
                          <p className="text-xs text-secondary-500">
                            {translate("cart.click_to_change_file")}
                          </p>
                        </div>
                      ) : (
                        <div className="text-secondary-500">
                          <div className="flex justify-center mb-2">
                            <LuCamera className="w-10 h-10 text-secondary-400" />
                          </div>
                          <p className="text-sm font-medium">
                            {translate("cart.click_to_attach_proof_of_payment")}
                          </p>
                          <p className="text-xs">
                            {translate("cart.supports_files_up_to_5mb")}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <LuTriangleAlert className="w-5 h-5 text-yellow-600 flex-shrink-0 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>{translate("cart.note")}:</strong>{" "}
                      {translate("cart.attach_proof")}
                      {translate("cart.confirmed_after_check_the_payment")}
                    </div>
                  </div>
                </div>

                {deliveryValidation?.isOutOfRange && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {outOfRangeMessage}
                    {outOfRangeDetailMessage && (
                      <div className="mt-1 text-xs text-red-600">
                        {outOfRangeDetailMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-secondary-700 mb-4">
                {translate("cart.order_summary")}
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-secondary-600">
                    {translate("cart.total")} ({itemCount}{" "}
                    {translate("order.items_count")})
                  </span>
                  <span className="text-secondary-800">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {/* Delivery Fee Details */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">
                      {translate("cart.delivery_fee")}
                    </span>
                    {deliveryFeeLoading ? (
                      <span className="text-secondary-500 text-sm animate-pulse">
                        ...
                      </span>
                    ) : (
                      <span className="text-secondary-800">
                        {formatCurrency(deliveryFee)}
                      </span>
                    )}
                  </div>
                  {hasFreeDeliveryMinimum && (
                    <div
                      className={`text-xs pl-2 ${
                        isFreeDeliveryReached ? "text-green-600" : "text-secondary-500"
                      }`}
                    >
                      {isFreeDeliveryReached
                        ? translate("cart.free_delivery_unlocked", {
                            minimum: formatCurrency(freeDeliveryMinimum),
                          })
                        : translate("cart.free_delivery_from_minimum", {
                            minimum: formatCurrency(freeDeliveryMinimum),
                            remaining: formatCurrency(remainingForFreeDelivery),
                          })}
                    </div>
                  )}
                  {restaurantCount > 1 && (() => {
                    try {
                      const breakdownData = localStorage.getItem('delivery_fee_breakdown');
                      if (breakdownData) {
                        const breakdown = JSON.parse(breakdownData);
                        const feeBreakdown = breakdown.breakdown;
                        const maxFee = breakdown.actual_max_fee_from_distance || feeBreakdown.base_amount;
                        const additionalCount = breakdown.additional_restaurants || 0;
                        const perRestaurant = breakdown.additional_fee_per_restaurant || 0;
                        
                        return (
                          <div className="text-xs text-secondary-500 pl-2">
                            • {translate('cart.base_delivery_fee_label', { max_fee: formatCurrency(maxFee) })} {formatCurrency(feeBreakdown.base_amount)}
                            <br />• {translate('cart.additional_restaurant_fee_label', { count: additionalCount })} {formatCurrency(feeBreakdown.additional_amount)}
                            <br />• <span className="text-blue-600">{translate('cart.delivery_fee_explanation', {
                              base_fee: formatCurrency(feeBreakdown.base_amount),
                              count: additionalCount,
                              per_restaurant: formatCurrency(perRestaurant),
                              total: formatCurrency(feeBreakdown.total_amount)
                            })}</span>
                          </div>
                        );
                      }
                    } catch (e) {
                      console.warn('Failed to parse delivery fee breakdown:', e);
                    }
                    return null;
                  })()}
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-secondary-800">
                      {translate("cart.total")}
                    </span>
                    <span className="text-primary-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Restaurant Count Info */}
                <div className="flex items-center justify-center gap-2 text-sm text-secondary-500 pt-2 border-t">
                  <LuStore className="w-4 h-4" />
                  <span>{restaurantCount} {translate("common.restaurants")}</span>
                  <span className="text-secondary-300">•</span>
                  <LuPackage className="w-4 h-4" />
                  <span>{itemCount} {translate("order.items_count")}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={
                  loading ||
                  !deliveryAddress.trim() ||
                  deliveryValidation?.isOutOfRange ||
                  !proofOfPayment ||
                  Object.values(restaurantStatuses).some(
                    (status) => status.status !== "open"
                  )
                }
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  loading ||
                  !deliveryAddress.trim() ||
                  deliveryValidation?.isOutOfRange ||
                  !proofOfPayment ||
                  Object.values(restaurantStatuses).some(
                    (status) => status.status !== "open"
                  )
                    ? "bg-secondary-300 text-secondary-500 cursor-not-allowed"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                }`}
              >
                {loading
                  ? translate("cart.processing")
                  : Object.values(restaurantStatuses).some(
                      (status) => status.status !== "open"
                    )
                  ? translate("cart.cannot_order_closed_restaurants")
                  : !deliveryAddress.trim()
                  ? translate("cart.please_enter_the_delivery_address")
                  : deliveryValidation?.isOutOfRange
                  ? outOfRangeMessage
                  : !proofOfPayment
                  ? translate("cart.please_attach_proof_of_payment")
                  : translate("cart.order_from_restaurants", {
                      count: restaurantCount,
                    })}
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/products"
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  ← {translate("cart.back_to_choose_restaurant")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-secondary-100 rounded-full">
              <LuShoppingCart className="w-16 h-16 text-secondary-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">
            {translate("cart.empty")}
          </h2>
          <p className="text-secondary-500 mb-6">
            {translate("cart.start_ordering_from_favorite_restaurants")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/restaurants"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              {translate("cart.choose_restaurant")}
            </Link>
            <Link
              to="/categories"
              className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors"
            >
              {translate("order.choose_by_category")}
            </Link>
          </div>
        </div>
      )}

      {/* Location Permission Modal */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1100]">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary-100 rounded-full">
                  <LuMapPin className="w-12 h-12 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                {translate('cart.location_permission_title')}
              </h3>
              <p className="text-secondary-600 text-sm mb-4">
                {translate('cart.location_permission_message')}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                {translate('cart.location_permission_instructions_title')}
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Android:</strong> {translate('cart.location_permission_android')}</p>
                <p><strong>iOS:</strong> {translate('cart.location_permission_ios')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLocationPermissionModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                {translate('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowLocationPermissionModal(false);
                  // ลองเรียก geolocation อีกครั้ง
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const location = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        };
                        try {
                          const address = await reverseGeocode(location.lat, location.lng, getGoogleMapsApiKey());
                          const locationWithAddress = {
                            ...location,
                            address: address
                          };
                          setDeliveryLocation(locationWithAddress);
                          setDeliveryAddress(address);
                        } catch (error) {
                          console.warn('Reverse geocoding failed:', error);
                          const fallbackAddress = `ตำแหน่ง: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
                          const locationWithAddress = {
                            ...location,
                            address: fallbackAddress
                          };
                          setDeliveryLocation(locationWithAddress);
                          setDeliveryAddress(fallbackAddress);
                        }
                      },
                      (error) => {
                        if (error.code === 1) {
                          setShowLocationPermissionModal(true);
                        }
                      }
                    );
                  }
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
              >
                {translate('cart.try_again')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
