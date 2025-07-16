# 🛒 Guest Order System - ระบบการสั่งซื้อแบบไม่ต้องล็อกอิน

## 📋 ภาพรวม

ระบบ Guest Order เป็นระบบการสั่งซื้อแบบไม่ต้องล็อกอินที่แยกออกจากระบบหลักอย่างชัดเจน โดยใช้ Temporary ID เพื่อติดตามคำสั่งซื้อ

## 🔑 คุณสมบัติหลัก

### ✅ **ไม่ต้องล็อกอิน**
- สั่งซื้อได้ทันทีโดยไม่ต้องสร้างบัญชี
- กรอกข้อมูลลูกค้าแบบครั้งเดียว
- ใช้ Temporary ID เพื่อติดตามคำสั่งซื้อ

### 🔍 **ติดตามคำสั่งซื้อ**
- ดูสถานะการสั่งซื้อได้จนกว่าจะเสร็จสิ้น
- หมดอายุหลังจาก 30 วัน
- ไม่สามารถดูประวัติการสั่งซื้อได้

### 🛡️ **ความปลอดภัย**
- แยกฐานข้อมูลจากระบบหลัก
- ไม่มีผลกระทบต่อระบบที่มีอยู่
- ข้อมูลลูกค้าไม่ถูกเก็บถาวร

## 🗄️ โครงสร้างฐานข้อมูล

### GuestOrder Model
```python
class GuestOrder(models.Model):
    guest_order_id = models.AutoField(primary_key=True)
    temporary_id = models.CharField(max_length=50, unique=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.CharField(max_length=255)
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # ข้อมูลลูกค้า
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, null=True)
    special_instructions = models.TextField(blank=True, null=True)
    
    # ข้อมูลการชำระเงิน
    payment_method = models.CharField(max_length=20, default='bank_transfer')
    payment_status = models.CharField(max_length=20, default='pending')
    proof_of_payment = models.ImageField(upload_to='payments/guest_proofs/')
    
    # หมดอายุ
    expires_at = models.DateTimeField()
```

### GuestOrderDetail Model
```python
class GuestOrderDetail(models.Model):
    guest_order_detail_id = models.AutoField(primary_key=True)
    guest_order = models.ForeignKey(GuestOrder, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
```

### GuestDeliveryStatusLog Model
```python
class GuestDeliveryStatusLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    guest_order = models.ForeignKey(GuestOrder, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    updated_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
```

## 🌐 API Endpoints

### 1. สร้างคำสั่งซื้อแบบไม่ต้องล็อกอิน
```http
POST /api/guest-orders/
Content-Type: multipart/form-data

{
  "order_data": {
    "restaurant": 1,
    "delivery_address": "123 Main St",
    "customer_name": "John Doe",
    "customer_phone": "0812345678",
    "customer_email": "john@example.com",
    "special_instructions": "Please deliver to front door",
    "payment_method": "bank_transfer",
    "order_items": [
      {
        "product_id": 1,
        "quantity": 2
      }
    ]
  },
  "proof_of_payment": [file]
}
```

**Response:**
```json
{
  "guest_order_id": 1,
  "temporary_id": "GUEST-A1B2C3D4",
  "restaurant": 1,
  "order_date": "2024-01-15T10:30:00Z",
  "total_amount": "299.00",
  "current_status": "pending",
  "customer_name": "John Doe",
  "customer_phone": "0812345678",
  "expires_at": "2024-02-14T10:30:00Z"
}
```

### 2. ติดตามคำสั่งซื้อ
```http
GET /api/guest-orders/track/?temporary_id=GUEST-A1B2C3D4
```

**Response:**
```json
{
  "guest_order_id": 1,
  "temporary_id": "GUEST-A1B2C3D4",
  "restaurant_name": "Pizza Palace",
  "order_date": "2024-01-15T10:30:00Z",
  "total_amount": "299.00",
  "delivery_address": "123 Main St",
  "current_status": "preparing",
  "customer_name": "John Doe",
  "order_details": [
    {
      "guest_order_detail_id": 1,
      "product_name": "Margherita Pizza",
      "quantity": 2,
      "price_at_order": "149.50",
      "subtotal": "299.00"
    }
  ],
  "status_logs": [
    {
      "status": "pending",
      "timestamp": "2024-01-15T10:30:00Z",
      "note": "Order created",
      "updated_by": null
    },
    {
      "status": "preparing",
      "timestamp": "2024-01-15T10:35:00Z",
      "note": "Order is being prepared",
      "updated_by": "restaurant_owner"
    }
  ]
}
```

### 3. อัปเดตสถานะ (เฉพาะ Admin/Restaurant Owner)
```http
POST /api/guest-orders/1/update_status/
Authorization: Token your_token_here
Content-Type: application/json

{
  "status": "delivering",
  "note": "Order is out for delivery"
}
```

## 🎨 Frontend Pages

### 1. Guest Cart (`/guest-cart`)
- หน้าแสดงตะกร้าสินค้าแบบไม่ต้องล็อกอิน
- กรอกข้อมูลลูกค้า (ชื่อ, เบอร์โทร, อีเมล)
- กรอกที่อยู่จัดส่ง
- อัปโหลดหลักฐานการโอนเงิน
- สร้าง Temporary ID อัตโนมัติ

### 2. Guest Order Tracking (`/guest-order-tracking`)
- หน้าติดตามคำสั่งซื้อ
- แสดงสถานะปัจจุบัน
- Timeline ประวัติสถานะ
- รายละเอียดคำสั่งซื้อ
- ข้อความเตือนเรื่องการหมดอายุ

## 🔄 การทำงานของระบบ

### 1. การสร้างคำสั่งซื้อ
1. ผู้ใช้เลือกสินค้าและเพิ่มลงตะกร้า
2. ไปที่หน้า Guest Cart
3. กรอกข้อมูลลูกค้าและที่อยู่จัดส่ง
4. อัปโหลดหลักฐานการโอนเงิน
5. ระบบสร้าง Temporary ID และบันทึกคำสั่งซื้อ
6. Redirect ไปหน้า tracking พร้อม Temporary ID

### 2. การติดตามคำสั่งซื้อ
1. ผู้ใช้เข้าหน้า tracking พร้อม Temporary ID
2. ระบบดึงข้อมูลคำสั่งซื้อจาก Temporary ID
3. แสดงสถานะปัจจุบันและประวัติ
4. ตรวจสอบการหมดอายุ (30 วัน)

### 3. การอัปเดตสถานะ
1. Admin หรือ Restaurant Owner อัปเดตสถานะ
2. ระบบบันทึก status log
3. ส่ง WebSocket notification (ถ้ามี)

## 🛡️ ความปลอดภัย

### การป้องกัน
- Temporary ID ใช้ UUID แบบสุ่ม
- ข้อมูลหมดอายุอัตโนมัติหลัง 30 วัน
- แยกฐานข้อมูลจากระบบหลัก
- ไม่มีผลกระทบต่อระบบที่มีอยู่

### การเข้าถึง
- สร้างคำสั่งซื้อ: ไม่ต้องล็อกอิน
- ติดตามคำสั่งซื้อ: ไม่ต้องล็อกอิน (ใช้ Temporary ID)
- อัปเดตสถานะ: เฉพาะ Admin และ Restaurant Owner

## 📱 การใช้งาน

### สำหรับลูกค้า
1. เลือกสินค้าและเพิ่มลงตะกร้า
2. คลิก "Guest Order" ในเมนู
3. กรอกข้อมูลและยืนยันการสั่งซื้อ
4. บันทึก Temporary ID ที่ได้รับ
5. ใช้ Temporary ID เพื่อติดตามคำสั่งซื้อ

### สำหรับ Admin/Restaurant Owner
1. เข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์
2. ไปที่หน้า Orders หรือ Guest Orders
3. อัปเดตสถานะคำสั่งซื้อ
4. เพิ่มหมายเหตุ (ถ้ามี)

## 🔧 การติดตั้ง

### 1. รัน Migration
```bash
python manage.py makemigrations api
python manage.py migrate
```

### 2. อัปเดต Frontend Routes
เพิ่ม routes ใน `App.jsx`:
```jsx
<Route path="/guest-cart" element={<GuestCart />} />
<Route path="/guest-order-tracking" element={<GuestOrderTracking />} />
```

### 3. อัปเดต Header
เพิ่มลิงก์ "Guest Order" ในเมนูสำหรับผู้ใช้ที่ไม่ได้ล็อกอิน

## 📊 การเปรียบเทียบกับระบบหลัก

| คุณสมบัติ | ระบบหลัก | Guest Order |
|-----------|----------|-------------|
| ต้องล็อกอิน | ✅ | ❌ |
| ดูประวัติการสั่งซื้อ | ✅ | ❌ |
| ติดตามคำสั่งซื้อ | ✅ | ✅ |
| หมดอายุ | ❌ | ✅ (30 วัน) |
| Temporary ID | ❌ | ✅ |
| แยกฐานข้อมูล | ❌ | ✅ |

## 🚀 ข้อดี

1. **ความสะดวก**: สั่งซื้อได้ทันทีโดยไม่ต้องสร้างบัญชี
2. **ความปลอดภัย**: แยกจากระบบหลัก ไม่มีผลกระทบ
3. **การติดตาม**: ยังคงติดตามคำสั่งซื้อได้
4. **การจัดการ**: Admin และ Restaurant Owner จัดการได้เหมือนเดิม

## ⚠️ ข้อจำกัด

1. **ไม่ดูประวัติ**: ไม่สามารถดูประวัติการสั่งซื้อได้
2. **หมดอายุ**: ข้อมูลหายไปหลัง 30 วัน
3. **ร้านเดียว**: สั่งได้จากร้านเดียวต่อครั้ง
4. **ไม่รีวิว**: ไม่สามารถรีวิวได้

## 🔮 การพัฒนาต่อ

1. **Multi-restaurant**: รองรับการสั่งจากหลายร้าน
2. **Email notification**: ส่งอีเมลแจ้งสถานะ
3. **SMS notification**: ส่ง SMS แจ้งสถานะ
4. **QR Code**: สร้าง QR Code สำหรับ tracking
5. **Auto-cleanup**: ลบข้อมูลเก่าอัตโนมัติ 