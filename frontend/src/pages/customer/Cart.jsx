import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { appSettingsService } from '../../services/api';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    items: cartItems,
    total,
    subtotal,
    itemCount,
    deliveryFee,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsByRestaurant,
    getRestaurantCount,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [restaurantStatuses, setRestaurantStatuses] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  // โหลดที่อยู่เริ่มต้นจาก profile ถ้ามี
  useEffect(() => {
    if (user) {
      setDeliveryAddress(user.address || '');
    }
  }, [user]);

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
            qr_code_url: response.data.qr_code_url
          });
        }
      } catch (error) {
        console.error('Error fetching payment info:', error);
      }
    };

    fetchPaymentInfo();
  }, []);

  // ตรวจสอบสถานะร้านในตะกร้า
  useEffect(() => {
    const checkRestaurantStatuses = async () => {
      if (cartItems.length === 0) {
        setRestaurantStatuses({});
        return;
      }

      const restaurantIds = [...new Set(cartItems.map(item => item.restaurant_id))];
      const statuses = {};

      try {
        for (const restaurantId of restaurantIds) {
          const response = await fetch(import.meta.env.VITE_API_URL + "/restaurants/${restaurantId}/");
          if (response.ok) {
            const restaurant = await response.json();
            statuses[restaurantId] = {
              name: restaurant.restaurant_name,
              status: restaurant.status
            };
          }
        }
        setRestaurantStatuses(statuses);
      } catch (error) {
        console.error('Error checking restaurant statuses:', error);
      }
    };

    checkRestaurantStatuses();
  }, [cartItems]);

  // จัดกลุ่มสินค้าตามร้าน
  const itemsByRestaurant = getItemsByRestaurant();
  const restaurantCount = getRestaurantCount();

  // จัดการการอัปโหลดหลักฐานการโอน
  const handleProofOfPaymentChange = (e) => {
    const file = e.target.files[0];
    setProofOfPayment(file);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('ตะกร้าของคุณว่างเปล่า');
      return;
    }

    if (!deliveryAddress.trim()) {
      alert('กรุณากรอกที่อยู่จัดส่ง');
      return;
    }

    if (!proofOfPayment) {
      alert('กรุณาแนบหลักฐานการโอนเงิน');
      return;
    }

    // ตรวจสอบการ login
    const userId = user?.id || user?.user_id;
    const token = localStorage.getItem('token');
    
    if (!userId || !token) {
      alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
      return;
    }

    // ตรวจสอบสถานะร้านก่อนชำระเงิน
    const restaurantIds = [...new Set(cartItems.map(item => item.restaurant_id))];
    try {
      for (const restaurantId of restaurantIds) {
        const response = await fetch(import.meta.env.VITE_API_URL + "/restaurants/${restaurantId}/");
        if (response.ok) {
          const restaurant = await response.json();
          if (restaurant.status !== 'open') {
            alert(`ขออภัย ร้าน "${restaurant.restaurant_name}" ปิดทำการแล้ว กรุณาลบสินค้าจากร้านนี้ออกจากตะกร้าก่อนสั่งซื้อ`);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking restaurant status:', error);
      alert('ไม่สามารถตรวจสอบสถานะร้านได้ กรุณาลองใหม่อีกครั้ง');
      return;
    }

    setLoading(true);
    try {
      console.log('Cart items:', cartItems);
      console.log('Items by restaurant:', itemsByRestaurant);
      console.log('User ID:', userId);

      // สร้าง FormData สำหรับส่งข้อมูลรวมไฟล์
      const formData = new FormData();
      
      // ข้อมูลคำสั่งซื้อ
      const orderData = {
        user: userId,
        delivery_address: deliveryAddress.trim(),
        notes: specialInstructions.trim() || '',
        restaurants: Object.keys(itemsByRestaurant).map(restaurantId => ({
          restaurant_id: parseInt(restaurantId),
          items: itemsByRestaurant[restaurantId].items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
          }))
        })),
        total_delivery_fee: deliveryFee
      };

      // ข้อมูลการชำระเงิน
      const paymentData = {
        payment_method: paymentMethod,
        amount_paid: total,
        status: 'pending'
      };

      formData.append('order_data', JSON.stringify(orderData));
      formData.append('payment_data', JSON.stringify(paymentData));
      
      // แนบไฟล์หลักฐานการโอน
      if (proofOfPayment) {
        formData.append('proof_of_payment', proofOfPayment);
      }

      console.log('Sending multi-restaurant order with payment data');

      // ใช้ fetch API
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Token ${token}`);
      // ไม่ต้องระบุ Content-Type เพื่อให้ browser ตั้งค่า multipart/form-data อัตโนมัติ

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formData,
        redirect: "follow"
      };

      const response = await fetch(import.meta.env.VITE_API_URL + "/orders/multi/", requestOptions);
      const result = await response.text();
      
      console.log('API Response:', result);

      if (response.ok) {
        // สำเร็จ
        const orderResult = JSON.parse(result);
        clearCart();
        
        let successMessage = `สั่งอาหารสำเร็จแล้ว!\n`;
        if (orderResult.order_id) {
          successMessage += `หมายเลขคำสั่งซื้อ: ${orderResult.order_id}\n`;
        }
        successMessage += `จำนวนร้าน: ${restaurantCount} ร้าน\n`;
        successMessage += `รวมทั้งสิ้น: ฿${total}`;
        
        alert(successMessage);
        navigate('/orders');
      } else {
        // ถ้า API multi ยังไม่มี ลองใช้ single restaurant order แบบเดิม
        if (response.status === 404 && restaurantCount === 1) {
          console.log('Multi-restaurant API not available, falling back to single restaurant order');
          await handleSingleRestaurantCheckout(token, userId);
        } else {
          const errorData = JSON.parse(result);
          console.error('Order failed:', errorData);
          
          let errorMessage = 'เกิดข้อผิดพลาดในการสั่งอาหาร';
          if (typeof errorData === 'object') {
            const errors = [];
            Object.keys(errorData).forEach(key => {
              if (Array.isArray(errorData[key])) {
                errors.push(`${key}: ${errorData[key].join(', ')}`);
              } else {
                errors.push(`${key}: ${errorData[key]}`);
              }
            });
            if (errors.length > 0) {
              errorMessage = `เกิดข้อผิดพลาด:\n${errors.join('\n')}`;
            }
          }
          alert(errorMessage);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Fallback สำหรับร้านเดียว (ใช้ API เดิม)
  const handleSingleRestaurantCheckout = async (token, userId) => {
    const restaurantId = cartItems[0]?.restaurant_id;
    
    // สร้าง FormData สำหรับส่งข้อมูลรวมไฟล์
    const formData = new FormData();
    
    const orderData = {
      restaurant: restaurantId,
      user: userId,
      order_items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      delivery_address: deliveryAddress.trim(),
      notes: specialInstructions.trim() || ''
    };

    // ข้อมูลการชำระเงิน
    const paymentData = {
      payment_method: paymentMethod,
      amount_paid: total,
      status: 'pending'
    };

    formData.append('order_data', JSON.stringify(orderData));
    formData.append('payment_data', JSON.stringify(paymentData));
    
    // แนบไฟล์หลักฐานการโอน
    if (proofOfPayment) {
      formData.append('proof_of_payment', proofOfPayment);
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Token ${token}`);
    // ไม่ต้องระบุ Content-Type เพื่อให้ browser ตั้งค่า multipart/form-data อัตโนมัติ

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formData,
      redirect: "follow"
    };

    const response = await fetch(import.meta.env.VITE_API_URL + "/orders/", requestOptions);
    const result = await response.text();

    if (response.ok) {
      const orderResult = JSON.parse(result);
      clearCart();
      alert(`สั่งอาหารสำเร็จแล้ว!\nหมายเลขคำสั่งซื้อ: ${orderResult.id || 'ORD-' + Date.now()}\nรวม: ฿${total}`);
      navigate('/orders');
    } else {
      throw new Error('Single restaurant order failed');
    }
  };

  const formatCurrency = (amount) => {
    return Number(amount).toFixed(2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">กำลังดำเนินการสั่งซื้อ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">ตะกร้าสินค้า</h1>
      
      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items แยกตามร้าน */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Multi-Restaurant Info */}
              {restaurantCount > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🏪</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-blue-800 font-semibold">การสั่งซื้อจากหลายร้าน</h3>
                      <p className="text-blue-600 text-sm">
                        คุณกำลังสั่งอาหารจาก {restaurantCount} ร้าน ค่าจัดส่งคำนวณเป็น: ร้านแรก 30 บาท + ร้านเพิ่มเติม 20 บาทต่อร้าน
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Closed Restaurant Warning */}
              {Object.values(restaurantStatuses).some(status => status.status !== 'open') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-red-800 font-semibold">มีร้านปิดทำการในตะกร้า</h3>
                      <p className="text-red-600 text-sm">
                        ร้าน: {Object.entries(restaurantStatuses)
                          .filter(([_, status]) => status.status !== 'open')
                          .map(([_, status]) => status.name)
                          .join(', ')} ปิดทำการแล้ว
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        กรุณาลบสินค้าจากร้านที่ปิดออกจากตะกร้าก่อนสั่งซื้อ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* แสดงสินค้าแยกตามร้าน */}
              {Object.entries(itemsByRestaurant).map(([restaurantId, restaurantData]) => (
                <div key={restaurantId} className="bg-white rounded-lg shadow-md p-6">
                  {/* Restaurant Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🏪</span>
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
                      <p className="text-lg font-semibold text-primary-600">
                        ฿{formatCurrency(restaurantData.subtotal)}
                      </p>
                      <p className="text-sm text-secondary-500">
                        {restaurantData.items.length} รายการ
                      </p>
                    </div>
                  </div>
                  
                  {/* Items in this restaurant */}
                  <div className="space-y-4">
                    {restaurantData.items.map((item) => (
                      <div key={item.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center">
                            {(item.image_display_url || item.image_url) ? (
                              <img 
                                src={item.image_display_url || item.image_url} 
                                alt={item.product_name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-secondary-800">{item.product_name}</h3>
                            {item.special_instructions && (
                              <p className="text-sm text-secondary-500 italic">
                                หมายเหตุ: {item.special_instructions}
                              </p>
                            )}
                            <p className="text-primary-600 font-semibold">฿{formatCurrency(item.price)}</p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 transition-colors"
                            >
                              <span className="text-secondary-600">−</span>
                            </button>
                            <span className="text-secondary-800 font-semibold min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 transition-colors"
                            >
                              <span className="text-secondary-600">+</span>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <div className="text-center">
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 text-sm underline"
                >
                  🗑️ ล้างตะกร้าทั้งหมด
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-secondary-700 mb-4">ที่อยู่จัดส่ง</h3>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="กรอกที่อยู่จัดส่งอย่างละเอียด เช่น บ้านเลขที่ ซอี ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                rows="3"
                required
              />
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-secondary-700 mb-4">หมายเหตุพิเศษ</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผักชี, ขอช้อนส้อมเพิ่ม"
                rows="2"
              />
            </div>

            {/* Payment Information */}
            {paymentInfo && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-secondary-700 mb-4">ข้อมูลการชำระเงิน</h3>
                
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-3">เลือกวิธีการชำระเงิน</label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">โอนเงินผ่านธนาคาร</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qr_payment"
                        checked={paymentMethod === 'qr_payment'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">QR Payment</span>
                    </label>
                  </div>
                </div>

                {/* Bank Transfer Info */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-3 mt-1">🏦</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 mb-2">ข้อมูลบัญชีธนาคาร</h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p><strong>ธนาคาร:</strong> {paymentInfo.bank_name || 'ไม่ระบุ'}</p>
                          <p><strong>เลขบัญชี:</strong> {paymentInfo.bank_account_number || 'ไม่ระบุ'}</p>
                          <p><strong>ชื่อบัญชี:</strong> {paymentInfo.bank_account_name || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Payment */}
                {paymentMethod === 'qr_payment' && paymentInfo.qr_code_url && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-green-800 mb-3">QR Code สำหรับการชำระเงิน</h4>
                      <div className="flex justify-center">
                        <img
                          src={paymentInfo.qr_code_url}
                          alt="QR Code Payment"
                          className="w-48 h-48 object-contain border border-green-300 rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-green-700 mt-2">สแกน QR Code เพื่อชำระเงิน</p>
                    </div>
                  </div>
                )}

                {/* Proof of Payment Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    หลักฐานการโอนเงิน <span className="text-red-500">*</span>
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
                    <label htmlFor="proof-of-payment" className="cursor-pointer">
                      {proofOfPayment ? (
                        <div className="text-green-600">
                          <span className="text-2xl block mb-2">✅</span>
                          <p className="text-sm font-medium">{proofOfPayment.name}</p>
                          <p className="text-xs text-secondary-500">คลิกเพื่อเปลี่ยนไฟล์</p>
                        </div>
                      ) : (
                        <div className="text-secondary-500">
                          <span className="text-2xl block mb-2">📷</span>
                          <p className="text-sm font-medium">คลิกเพื่อแนบหลักฐานการโอนเงิน</p>
                          <p className="text-xs">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <span className="text-yellow-500 mr-2 mt-0.5">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <strong>หมายเหตุ:</strong> กรุณาแนบหลักฐานการโอนเงินหลังจากชำระเงินแล้ว 
                      คำสั่งซื้อจะได้รับการยืนยันหลังจากที่เราตรวจสอบการชำระเงินแล้ว
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-secondary-700 mb-4">สรุปคำสั่งซื้อ</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-secondary-600">ยอดรวม ({itemCount} รายการ)</span>
                  <span className="text-secondary-800">฿{formatCurrency(subtotal)}</span>
                </div>
                
                {/* Delivery Fee Details */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">ค่าจัดส่ง</span>
                    <span className="text-secondary-800">฿{formatCurrency(deliveryFee)}</span>
                  </div>
                  {restaurantCount > 1 && (
                    <div className="text-xs text-secondary-500 pl-2">
                      • ร้านแรก: ฿30<br/>
                      • ร้านเพิ่มเติม: ฿{20 * (restaurantCount - 1)} ({restaurantCount - 1} ร้าน × ฿20)
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-secondary-800">ยอดชำระ</span>
                    <span className="text-primary-600">฿{formatCurrency(total)}</span>
                  </div>
                </div>
                
                {/* Restaurant Count Info */}
                <div className="text-center text-sm text-secondary-500 pt-2 border-t">
                  🏪 {restaurantCount} ร้าน • 📦 {itemCount} รายการ
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading || !deliveryAddress.trim() || !proofOfPayment || Object.values(restaurantStatuses).some(status => status.status !== 'open')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  loading || !deliveryAddress.trim() || !proofOfPayment || Object.values(restaurantStatuses).some(status => status.status !== 'open')
                    ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {loading 
                  ? 'กำลังดำเนินการ...' 
                  : Object.values(restaurantStatuses).some(status => status.status !== 'open')
                  ? 'ไม่สามารถสั่งซื้อได้ (ร้านปิด)'
                  : !deliveryAddress.trim()
                  ? 'กรุณากรอกที่อยู่จัดส่ง'
                  : !proofOfPayment
                  ? 'กรุณาแนบหลักฐานการโอน'
                  : `สั่งซื้อจาก ${restaurantCount} ร้าน`
                }
              </button>
              
              <div className="mt-4 text-center">
                <Link 
                  to="/restaurants" 
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  ← กลับไปเลือกร้านอาหาร
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">🛒</div>
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">ตะกร้าของคุณว่างเปล่า</h2>
          <p className="text-secondary-500 mb-6">เริ่มสั่งอาหารจากร้านที่คุณชื่นชอบกันเถอะ! ตอนนี้คุณสามารถสั่งจากหลายร้านในครั้งเดียวได้แล้ว</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/restaurants" 
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              เลือกร้านอาหาร
            </Link>
            <Link 
              to="/categories" 
              className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors"
            >
              เลือกตามหมวดหมู่
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 