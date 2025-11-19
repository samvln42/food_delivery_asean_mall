# คู่มือการตั้งค่า Google Maps API สำหรับระบบคำนวณค่าจัดส่ง

## 📋 สารบัญ
1. [การตั้งค่า Google Maps API Key](#การตั้งค่า-google-maps-api-key)
2. [การติดตั้ง Dependencies](#การติดตั้ง-dependencies)
3. [การใช้งาน Components](#การใช้งาน-components)
4. [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
5. [การใช้งานใน Cart และ GuestCart](#การใช้งานใน-cart-และ-guestcart)

---

## 🔑 การตั้งค่า Google Maps API Key

### ขั้นตอนที่ 1: สร้าง Google Cloud Project
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. เปิดใช้งาน **Maps JavaScript API** และ **Geocoding API**

### ขั้นตอนที่ 2: สร้าง API Key
1. ไปที่ **APIs & Services** > **Credentials**
2. คลิก **Create Credentials** > **API Key**
3. คัดลอก API Key ที่ได้
4. (แนะนำ) จำกัด API Key ให้ใช้เฉพาะ domain ของคุณ:
   - Application restrictions: HTTP referrers
   - API restrictions: Maps JavaScript API, Geocoding API

### ขั้นตอนที่ 3: ตั้งค่า API Key ใน Frontend
สร้างไฟล์ `.env` ในโฟลเดอร์ `frontend/`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

## 📦 การติดตั้ง Dependencies

ไม่จำเป็นต้องติดตั้ง package เพิ่มเติม เพราะเราใช้ Google Maps JavaScript API โดยตรงผ่าน script tag

แต่ถ้าต้องการใช้ React wrapper library (แนะนำ):

```bash
cd frontend
npm install @react-google-maps/api
```

---

## 🎨 การใช้งาน Components

### 1. AddressPicker Component
Component สำหรับเลือกที่อยู่ด้วย Google Places Autocomplete

```jsx
import AddressPicker from '../components/maps/AddressPicker';

function MyComponent() {
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);

  const handleLocationSelect = (locationData) => {
    setLocation(locationData);
    // locationData = { lat, lng, address, place_id }
  };

  return (
    <AddressPicker
      value={address}
      onChange={setAddress}
      onLocationSelect={handleLocationSelect}
      placeholder="กรอกที่อยู่"
      required
    />
  );
}
```

### 2. MapPicker Component
Component สำหรับเลือกที่อยู่โดยคลิกบนแผนที่

```jsx
import MapPicker from '../components/maps/MapPicker';

function MyComponent() {
  const handleLocationSelect = (locationData) => {
    // locationData = { lat, lng, address }
    console.log('Selected location:', locationData);
  };

  return (
    <MapPicker
      initialCenter={{ lat: 13.7563, lng: 100.5018 }}
      onLocationSelect={handleLocationSelect}
      zoom={15}
      height="400px"
    />
  );
}
```

---

## 🔧 การตั้งค่า Environment Variables

### Frontend (.env)
```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# API URL (มีอยู่แล้ว)
VITE_API_URL=https://your-api-url.com/api/
```

### Backend (.env)
ไม่จำเป็นต้องตั้งค่าเพิ่มเติม เพราะการคำนวณระยะทางใช้ Haversine formula ที่คำนวณฝั่ง Backend

---

## 🛒 การใช้งานใน Cart และ GuestCart

### ตัวอย่างการแก้ไข Cart.jsx

```jsx
import { useState } from 'react';
import AddressPicker from '../../components/maps/AddressPicker';
import { deliveryFeeService } from '../../services/api';

function Cart() {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const handleLocationSelect = async (location) => {
    setDeliveryLocation(location);
    
    // คำนวณค่าจัดส่ง
    if (location && cartItems.length > 0) {
      await calculateDeliveryFee(location);
    }
  };

  const calculateDeliveryFee = async (location) => {
    try {
      const restaurantIds = Object.keys(itemsByRestaurant);
      
      if (restaurantIds.length === 1) {
        // Single restaurant
        const response = await deliveryFeeService.calculate({
          restaurant_id: parseInt(restaurantIds[0]),
          delivery_latitude: location.lat,
          delivery_longitude: location.lng
        });
        setDeliveryFee(response.data.delivery_fee);
      } else {
        // Multi-restaurant
        const response = await deliveryFeeService.calculateMulti({
          restaurant_ids: restaurantIds.map(id => parseInt(id)),
          delivery_latitude: location.lat,
          delivery_longitude: location.lng
        });
        setDeliveryFee(response.data.total_delivery_fee);
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
    }
  };

  return (
    <div>
      <AddressPicker
        value={deliveryAddress}
        onChange={setDeliveryAddress}
        onLocationSelect={handleLocationSelect}
        placeholder="กรอกที่อยู่จัดส่ง"
        required
      />
      
      {deliveryFee > 0 && (
        <p>ค่าจัดส่ง: {deliveryFee} บาท</p>
      )}
    </div>
  );
}
```

---

## 📝 API Endpoints

### 1. คำนวณค่าจัดส่งสำหรับร้านเดียว
```
POST /api/calculate-delivery-fee/
Body: {
  "restaurant_id": 1,
  "delivery_latitude": 13.7563,
  "delivery_longitude": 100.5018
}
Response: {
  "delivery_fee": 25.00,
  "distance_km": 3.5
}
```

### 2. คำนวณค่าจัดส่งสำหรับหลายร้าน
```
POST /api/calculate-multi-restaurant-delivery-fee/
Body: {
  "restaurant_ids": [1, 2, 3],
  "delivery_latitude": 13.7563,
  "delivery_longitude": 100.5018
}
Response: {
  "total_delivery_fee": 30.00,
  "max_distance_km": 5.2,
  "restaurants": [
    {
      "restaurant_id": 1,
      "restaurant_name": "ร้านอาหาร A",
      "distance_km": 3.5,
      "delivery_fee": 25.00
    },
    ...
  ]
}
```

---

## ⚠️ หมายเหตุสำคัญ

1. **API Key Security**: 
   - อย่า commit API Key ลง Git
   - ใช้ environment variables
   - จำกัด API Key ใน Google Cloud Console

2. **API Quotas**:
   - Google Maps API มี free tier (เดือนละ $200 credit)
   - Geocoding API: $5 per 1,000 requests
   - Maps JavaScript API: $7 per 1,000 loads

3. **Error Handling**:
   - Component จะแสดง warning ถ้าไม่มี API Key
   - ระบบจะยังทำงานได้แต่ไม่มี Autocomplete

4. **Restaurant Coordinates**:
   - Admin ต้องกรอก latitude/longitude ของร้านใน Admin Settings
   - ถ้าร้านไม่มี coordinates จะไม่สามารถคำนวณค่าจัดส่งได้

---

## 🚀 ขั้นตอนต่อไป

1. ✅ เพิ่ม latitude/longitude ใน Restaurant model (ทำแล้ว)
2. ✅ สร้าง API endpoints (ทำแล้ว)
3. ✅ สร้าง Google Maps components (ทำแล้ว)
4. ⏳ แก้ไข CartContext ให้คำนวณตามระยะทาง
5. ⏳ แก้ไข Cart และ GuestCart ให้ใช้ AddressPicker
6. ⏳ อัปเดต Admin Settings ให้กรอกพิกัดร้าน

---

## 📚 เอกสารเพิ่มเติม

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Google Maps API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

