# 🔧 แก้ไขปัญหา Google Maps API Errors

## ปัญหาที่พบ

### 1. "You have included the Google Maps JavaScript API multiple times"
**สาเหตุ:** AddressPicker และ MapPicker โหลด Google Maps API แยกกัน

**แก้ไขแล้ว:** สร้าง `googleMapsLoader.js` เพื่อโหลด API แบบ shared

### 2. "REQUEST_DENIED" Error
**สาเหตุ:** 
- API Key ไม่ได้เปิดใช้งาน Geocoding API
- API Key มี restrictions ที่ไม่อนุญาต
- Billing ไม่ได้เปิดใช้งาน

### 3. "BillingNotEnabledMapError"
**สาเหตุ:** Google Cloud Project ยังไม่ได้เปิดใช้งาน Billing

---

## 🔑 วิธีแก้ไขปัญหา Billing และ API Key

### ขั้นตอนที่ 1: เปิดใช้งาน Billing

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. เลือก Project ของคุณ
3. ไปที่ **Billing** (ในเมนูด้านซ้าย)
4. คลิก **Link a billing account**
5. สร้าง Billing Account ใหม่หรือเลือกที่มีอยู่
6. กรอกข้อมูลบัตรเครดิต (Google ให้ $200 credit ฟรีต่อเดือน)

**หมายเหตุ:** Google Maps API มี Free Tier $200/เดือน ซึ่งเพียงพอสำหรับการใช้งานทั่วไป

### ขั้นตอนที่ 2: เปิดใช้งาน APIs ที่จำเป็น

1. ไปที่ **APIs & Services** > **Library**
2. ค้นหาและเปิดใช้งาน APIs ต่อไปนี้:
   - ✅ **Maps JavaScript API**
   - ✅ **Geocoding API**
   - ✅ **Places API** (Optional - สำหรับ Autocomplete ที่ดีขึ้น)

### ขั้นตอนที่ 3: ตรวจสอบ API Key Restrictions

1. ไปที่ **APIs & Services** > **Credentials**
2. คลิกที่ API Key ของคุณ
3. ตรวจสอบ **API restrictions**:
   - ต้องมี: Maps JavaScript API, Geocoding API
4. ตรวจสอบ **Application restrictions**:
   - ถ้าใช้ HTTP referrers ต้องเพิ่ม:
     - `http://localhost:*` (development)
     - `https://yourdomain.com/*` (production)

### ขั้นตอนที่ 4: ทดสอบ API Key

ใช้ curl หรือ Postman ทดสอบ:

```bash
# ทดสอบ Geocoding API
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Bangkok&key=YOUR_API_KEY"

# ทดสอบ Reverse Geocoding
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=13.7563,100.5018&key=YOUR_API_KEY"
```

ถ้าได้ response `"status": "OK"` แสดงว่าทำงานได้

---

## ✅ Checklist การตั้งค่า

- [ ] เปิดใช้งาน Billing ใน Google Cloud Console
- [ ] เปิดใช้งาน Maps JavaScript API
- [ ] เปิดใช้งาน Geocoding API
- [ ] API Key มี permissions สำหรับ APIs ที่ต้องการ
- [ ] ตั้งค่า API Key ในไฟล์ `.env` (VITE_GOOGLE_MAPS_API_KEY)
- [ ] รีสตาร์ท development server

---

## 🐛 Troubleshooting

### ถ้ายังมี error "REQUEST_DENIED"

1. ตรวจสอบว่าเปิดใช้งาน Geocoding API แล้ว
2. ตรวจสอบว่า API Key มี permission สำหรับ Geocoding API
3. ตรวจสอบว่า Billing เปิดใช้งานแล้ว
4. ลองสร้าง API Key ใหม่

### ถ้ายังมี error "BillingNotEnabledMapError"

1. ไปที่ Google Cloud Console > Billing
2. เปิดใช้งาน Billing Account
3. รอสักครู่แล้วลองใหม่

### ถ้ายังโหลด Google Maps ซ้ำ

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R หรือ Cmd+Shift+R)
3. ตรวจสอบว่าใช้ `googleMapsLoader.js` แล้ว

---

## 📚 เอกสารเพิ่มเติม

- [Google Maps Billing Setup](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

