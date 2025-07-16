# 🛒 การจัดการ Guest Orders สำหรับแอดมิน

## 📋 ภาพรวม

ระบบ Guest Orders เป็นระบบการสั่งซื้อแบบไม่ต้องล็อกอินที่แยกออกจากระบบหลัก โดยแอดมินสามารถจัดการ Guest Orders ได้ผ่านหน้า Admin ที่สร้างขึ้นใหม่

## 🔧 ฟีเจอร์การจัดการ

### 1. หน้า AdminGuestOrders (`/admin/guest-orders`)
- **ดูรายการ Guest Orders ทั้งหมด**
- **ค้นหาและกรอง**:
  - ค้นหาตาม Temporary ID, ชื่อลูกค้า, เบอร์โทร, ร้านอาหาร
  - กรองตามสถานะ (pending, paid, preparing, ready_for_pickup, delivering, completed, cancelled)
  - เรียงตามวันที่สั่งซื้อ, สถานะ, ยอดรวม, ชื่อลูกค้า

### 2. การอัปเดทสถานะ
- **อัปเดทสถานะคำสั่งซื้อ** พร้อมหมายเหตุ
- **สถานะที่รองรับ**:
  - `pending` - รอดำเนินการ
  - `paid` - ชำระเงินแล้ว
  - `preparing` - กำลังเตรียม
  - `ready_for_pickup` - พร้อมส่ง
  - `delivering` - กำลังจัดส่ง
  - `completed` - เสร็จสิ้น
  - `cancelled` - ยกเลิก

### 3. ข้อมูลที่แสดง
- **ข้อมูลคำสั่งซื้อ**: Guest Order ID, Temporary ID, วันที่สั่งซื้อ, ยอดรวม
- **ข้อมูลลูกค้า**: ชื่อ, เบอร์โทร, อีเมล, ที่อยู่จัดส่ง, หมายเหตุ
- **ข้อมูลร้านอาหาร**: ชื่อร้าน
- **รายการสินค้า**: ชื่อสินค้า, จำนวน, ราคา, ยอดรวม
- **สถานะปัจจุบัน**: แสดงด้วยสีและไอคอน

## 🎨 หน้าตาและการใช้งาน

### 1. เมนูใน AdminLayout
```
🛒 Guest Orders
```
เพิ่มในเมนูด้านข้างของ Admin Layout

### 2. หน้าจัดการ Guest Orders
- **Header**: ชื่อหน้า, ปุ่มรีเฟรช, จำนวนรายการทั้งหมด
- **Controls**: ช่องค้นหา, กรองสถานะ, เรียงลำดับ
- **Order Cards**: แสดงข้อมูลแต่ละคำสั่งซื้อ
- **Action Buttons**: อัปเดทสถานะ, ดูหน้า Tracking

### 3. Modal อัปเดทสถานะ
- เลือกสถานะใหม่
- เพิ่มหมายเหตุ (ไม่บังคับ)
- ปุ่มอัปเดทและยกเลิก

## 🔗 API Endpoints ที่ใช้

### 1. ดึงรายการ Guest Orders
```http
GET /api/guest-orders/
Authorization: Token admin_token
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "guest_order_id": 1,
      "temporary_id": "GUEST-A1B2C3D4",
      "restaurant_name": "Pizza Palace",
      "order_date": "2024-01-15T10:30:00Z",
      "total_amount": "299.00",
      "delivery_address": "123 Main St",
      "current_status": "pending",
      "customer_name": "John Doe",
      "customer_phone": "0812345678",
      "order_details": [...],
      "status_logs": [...]
    }
  ]
}
```

### 2. อัปเดทสถานะ
```http
POST /api/guest-orders/{guest_order_id}/update_status/
Authorization: Token admin_token
Content-Type: application/json

{
  "status": "preparing",
  "note": "Order is being prepared"
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "old_status": "pending",
  "new_status": "preparing"
}
```

## 📊 การแจ้งเตือน

### 1. WebSocket Notifications
- เมื่อมี Guest Order ใหม่ → แจ้งเตือนแอดมิน
- เมื่ออัปเดทสถานะ → แจ้งเตือนลูกค้าผ่าน Temporary ID

### 2. Database Notifications
- สร้าง Notification ในฐานข้อมูลสำหรับแอดมินทุกคน
- เก็บประวัติการเปลี่ยนแปลงสถานะใน GuestDeliveryStatusLog

## 🛡️ ความปลอดภัย

### 1. Permission Control
- เฉพาะ Admin เท่านั้นที่เข้าถึงได้
- ใช้ `ProtectedRoute` ตรวจสอบสิทธิ์

### 2. API Security
- ใช้ Token Authentication
- ตรวจสอบ role เป็น 'admin' ใน backend

## 📱 การใช้งานสำหรับแอดมิน

### 1. เข้าถึงหน้า Guest Orders
1. ล็อกอินด้วยบัญชี Admin
2. ไปที่ `/admin/guest-orders`
3. หรือคลิก "🛒 Guest Orders" ในเมนูด้านข้าง

### 2. จัดการ Guest Orders
1. **ดูรายการ**: ดู Guest Orders ทั้งหมด
2. **ค้นหา**: ใช้ช่องค้นหาเพื่อหา Guest Order เฉพาะ
3. **กรอง**: เลือกสถานะเพื่อกรองรายการ
4. **เรียง**: เลือกการเรียงลำดับตามต้องการ

### 3. อัปเดทสถานะ
1. คลิก "อัปเดทสถานะ" ใน Guest Order Card
2. เลือกสถานะใหม่จาก dropdown
3. เพิ่มหมายเหตุ (ถ้ามี)
4. คลิก "อัปเดท"

### 4. ดูรายละเอียด
1. คลิก "▶" เพื่อขยายรายละเอียด
2. ดูข้อมูลลูกค้า, รายการสินค้า, ที่อยู่จัดส่ง
3. คลิก "ดูหน้า Tracking" เพื่อดูหน้า tracking ของลูกค้า

## 🔄 การทำงานของระบบ

### 1. เมื่อมี Guest Order ใหม่
1. ระบบสร้าง Guest Order ในฐานข้อมูล
2. สร้าง Temporary ID อัตโนมัติ
3. ส่ง WebSocket notification ไปยังแอดมิน
4. สร้าง Notification ในฐานข้อมูล

### 2. เมื่อแอดมินอัปเดทสถานะ
1. อัปเดทสถานะในฐานข้อมูล
2. บันทึกใน GuestDeliveryStatusLog
3. ส่ง WebSocket notification ไปยังลูกค้า
4. แสดง toast แจ้งเตือนความสำเร็จ

## 📈 การติดตามและรายงาน

### 1. สถิติในหน้า Admin
- จำนวน Guest Orders ทั้งหมด
- จำนวนตามสถานะ
- ยอดรวมทั้งหมด

### 2. ประวัติการเปลี่ยนแปลง
- บันทึกใน GuestDeliveryStatusLog
- เก็บข้อมูลผู้อัปเดท, เวลา, หมายเหตุ

## 🚀 ข้อดีของระบบ

### 1. แยกจากระบบหลัก
- ไม่กระทบระบบที่มีอยู่
- จัดการแยกต่างหาก
- ข้อมูลไม่ปนกัน

### 2. ง่ายต่อการจัดการ
- UI ที่ใช้งานง่าย
- ค้นหาและกรองได้
- อัปเดทสถานะได้ทันที

### 3. การแจ้งเตือนครบถ้วน
- WebSocket real-time
- Database notifications
- Toast notifications

## 🔧 การติดตั้งและใช้งาน

### 1. ไฟล์ที่เพิ่ม
- `frontend/src/pages/admin/AdminGuestOrders.jsx`
- Route ใน `frontend/src/App.jsx`
- เมนูใน `frontend/src/layouts/AdminLayout.jsx`

### 2. API ที่ใช้
- `/api/guest-orders/` (GET, POST)
- `/api/guest-orders/{id}/update_status/` (POST)
- `/api/guest-orders/track/` (GET)

### 3. การทดสอบ
1. สร้าง Guest Order ผ่านหน้า Guest Cart
2. เข้าสู่ระบบด้วยบัญชี Admin
3. ไปที่หน้า Guest Orders
4. ทดสอบการค้นหา, กรอง, อัปเดทสถานะ

ระบบพร้อมใช้งานแล้วครับ! 🎉 