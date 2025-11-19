# 📍 คู่มือการตั้งค่า Google Maps API Key

## ขั้นตอนการสร้าง Google Maps API Key

### 1. สร้าง Google Cloud Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. คลิกที่ dropdown project ด้านบน (ถ้ายังไม่มี project)
3. คลิก **New Project**
4. ตั้งชื่อ project (เช่น "Food Delivery App")
5. คลิก **Create**

### 2. เปิดใช้งาน APIs ที่จำเป็น

1. ใน Google Cloud Console ไปที่ **APIs & Services** > **Library**
2. ค้นหาและเปิดใช้งาน APIs ต่อไปนี้:
   - **Maps JavaScript API** - สำหรับแสดงแผนที่และ Autocomplete
   - **Geocoding API** - สำหรับแปลงที่อยู่เป็นพิกัด (lat/lng)
   - **Places API** (Optional) - สำหรับ Places Autocomplete ที่ดีขึ้น

### 3. สร้าง API Key

1. ไปที่ **APIs & Services** > **Credentials**
2. คลิก **+ CREATE CREDENTIALS** > **API Key**
3. คัดลอก API Key ที่สร้างขึ้นมา (จะแสดงใน popup)

### 4. จำกัด API Key (แนะนำเพื่อความปลอดภัย)

1. คลิกที่ API Key ที่เพิ่งสร้าง
2. ในส่วน **Application restrictions**:
   - เลือก **HTTP referrers (web sites)**
   - เพิ่ม domain ที่อนุญาต:
     - `http://localhost:*` (สำหรับ development)
     - `https://yourdomain.com/*` (สำหรับ production)
     - `https://*.yourdomain.com/*` (สำหรับ subdomain)
3. ในส่วน **API restrictions**:
   - เลือก **Restrict key**
   - เลือก APIs ที่ต้องการ:
     - Maps JavaScript API
     - Geocoding API
     - Places API (ถ้าใช้)
4. คลิก **Save**

### 5. ตั้งค่าในโปรเจกต์

#### สำหรับ Development (Local)

1. สร้างไฟล์ `.env` ในโฟลเดอร์ `frontend/` (ถ้ายังไม่มี)
2. เพิ่มบรรทัดนี้:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. แทนที่ `your_api_key_here` ด้วย API Key ที่คัดลอกมา

#### สำหรับ Production

1. ใน hosting platform ของคุณ (เช่น Vercel, Netlify, AWS):
   - ไปที่ Environment Variables settings
   - เพิ่ม variable:
     - Name: `VITE_GOOGLE_MAPS_API_KEY`
     - Value: `your_api_key_here`
2. หรือถ้าใช้ Docker:
   - เพิ่มใน docker-compose.yml หรือ Dockerfile:
   ```yaml
   environment:
     - VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### 6. รีสตาร์ท Development Server

หลังจากตั้งค่า `.env` แล้ว ต้องรีสตาร์ท development server:

```bash
cd frontend
npm run dev
```

หรือถ้าใช้ Docker:
```bash
docker-compose restart frontend
```

## ✅ ตรวจสอบว่าตั้งค่าถูกต้อง

1. เปิดหน้า Cart หรือ GuestCart
2. ดูที่ช่องกรอกที่อยู่ - ควรมี Autocomplete จาก Google Maps
3. คลิกปุ่ม "ใช้ตำแหน่งปัจจุบัน" - ควรทำงานได้
4. คลิกปุ่ม "เลือกบนแผนที่" - แผนที่ควรแสดง

## ⚠️ หมายเหตุสำคัญ

### ข้อจำกัดและค่าใช้จ่าย

- Google Maps API มี **Free Tier** ($200 credit ต่อเดือน)
- Geocoding API: $5 ต่อ 1,000 requests
- Maps JavaScript API: $7 ต่อ 1,000 loads
- ถ้าใช้เกิน free tier จะถูกคิดเงิน

### ความปลอดภัย

- **อย่า commit API Key ลง Git!**
- ตรวจสอบว่าไฟล์ `.env` อยู่ใน `.gitignore`
- ใช้ API Key restrictions เพื่อป้องกันการใช้งานผิดพลาด
- หมั่นตรวจสอบ usage ใน Google Cloud Console

### Troubleshooting

**ปัญหา: Autocomplete ไม่ทำงาน**
- ตรวจสอบว่า API Key ถูกต้อง
- ตรวจสอบว่าเปิดใช้งาน Maps JavaScript API แล้ว
- ตรวจสอบ console ใน browser สำหรับ error messages

**ปัญหา: แผนที่ไม่แสดง**
- ตรวจสอบว่า API Key มี permission สำหรับ Maps JavaScript API
- ตรวจสอบว่า domain อยู่ใน whitelist (ถ้าตั้งค่า restrictions)

**ปัญหา: Reverse geocoding ไม่ทำงาน**
- ตรวจสอบว่าเปิดใช้งาน Geocoding API แล้ว
- ตรวจสอบ quota ใน Google Cloud Console

## 📚 เอกสารเพิ่มเติม

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Pricing Information](https://developers.google.com/maps/billing-and-pricing/pricing)

