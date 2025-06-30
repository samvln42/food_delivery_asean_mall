# 📖 คู่มือการใช้งานระบบ Food Delivery

## 📋 สารบัญ
1. [การเริ่มต้นใช้งาน](#การเริ่มต้นใช้งาน)
2. [การใช้งานสำหรับลูกค้า](#การใช้งานสำหรับลูกค้า)
3. [การใช้งานสำหรับร้านอาหาร](#การใช้งานสำหรับร้านอาหาร)
4. [การใช้งานสำหรับผู้ดูแลระบบ](#การใช้งานสำหรับผู้ดูแลระบบ)
5. [การทดสอบด้วย Postman](#การทดสอบด้วย-postman)
6. [คำถามที่พบบ่อย](#คำถามที่พบบ่อย)
7. [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## 🚀 การเริ่มต้นใช้งาน

### ความต้องการของระบบ
- Python 3.8+
- MySQL 5.7+
- Postman (สำหรับทดสอบ API)

### การติดตั้งระบบ

#### 1. เตรียมสภาพแวดล้อม
```bash
# Clone project
cd Backend

# สร้าง virtual environment
python -m venv venv

# เปิดใช้งาน virtual environment
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

#### 2. ติดตั้ง dependencies
```bash
pip install -r requirements.txt
```

#### 3. ตั้งค่าฐานข้อมูล
```sql
-- เข้า MySQL
mysql -u root -p

-- สร้างฐานข้อมูล
CREATE DATABASE food_delivery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 4. สร้างไฟล์ .env
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=food_delivery_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
```

#### 5. รัน migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### 6. สร้าง superuser
```bash
python manage.py createsuperuser
```

#### 7. เริ่มเซิร์ฟเวอร์
```bash
python manage.py runserver
```

### การเข้าถึงระบบ
- **API Base URL**: `http://localhost:8000/api/`
- **Admin Panel**: `http://localhost:8000/admin/`

---

## 👥 การใช้งานสำหรับลูกค้า (Customer)

### 1. การสมัครสมาชิก

#### API Request
```http
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
    "username": "customer1",
    "email": "customer@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "role": "customer",
    "phone_number": "0812345678",
    "address": "123 ถนนสุขุมวิท กรุงเทพฯ"
}
```

#### ผลลัพธ์ที่ได้
```json
{
    "user": {
        "id": 2,
        "username": "customer1",
        "email": "customer@example.com",
        "role": "customer",
        "phone_number": "0812345678",
        "address": "123 ถนนสุขุมวิท กรุงเทพฯ"
    },
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
    "message": "Registration successful"
}
```

### 2. การเข้าสู่ระบบ

#### API Request
```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
    "username": "customer1",
    "password": "password123"
}
```

#### การใช้ Token
หลังจากเข้าสู่ระบบแล้ว ใช้ token ในการเรียก API อื่นๆ:
```http
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

### 3. การค้นหาร้านอาหาร

#### ดูร้านอาหารทั้งหมด
```http
GET http://localhost:8000/api/restaurants/
```

#### ค้นหาร้านอาหาร
```http
GET http://localhost:8000/api/restaurants/?search=อาหารไทย
```

#### ดูร้านพิเศษ
```http
GET http://localhost:8000/api/restaurants/special/
```

### 4. การดูเมนูอาหาร

#### ดูเมนูของร้านเฉพาะ
```http
GET http://localhost:8000/api/products/?restaurant_id=1
```

#### ดูเมนูตามหมวดหมู่
```http
GET http://localhost:8000/api/products/?category_id=1
```

#### ค้นหาเมนู
```http
GET http://localhost:8000/api/products/?search=ผัดไทย
```

### 5. การสั่งอาหาร

#### สร้างคำสั่งซื้อ
```http
POST http://localhost:8000/api/orders/
Content-Type: application/json
Authorization: Token your-token-here

{
    "restaurant_id": 1,
    "delivery_address": "456 ถนนรัชดาภิเษก กรุงเทพฯ",
    "delivery_latitude": 13.7563,
    "delivery_longitude": 100.5018,
    "order_details": [
        {
            "product_id": 1,
            "quantity": 2
        },
        {
            "product_id": 2,
            "quantity": 1
        }
    ]
}
```

### 6. การชำระเงิน

#### สร้างการชำระเงิน
```http
POST http://localhost:8000/api/payments/
Content-Type: application/json
Authorization: Token your-token-here

{
    "order_id": 1,
    "payment_method": "qr_code",
    "transaction_id": "TXN123456789"
}
```

#### อัปโหลดหลักฐานการโอน
```http
POST http://localhost:8000/api/payments/1/confirm/
Content-Type: application/json
Authorization: Token your-token-here

{
    "proof_of_payment_url": "https://example.com/payment-proof.jpg"
}
```

### 7. การติดตามคำสั่งซื้อ

#### ดูคำสั่งซื้อของตัวเอง
```http
GET http://localhost:8000/api/orders/
Authorization: Token your-token-here
```

#### ดูรายละเอียดคำสั่งซื้อ
```http
GET http://localhost:8000/api/orders/1/
Authorization: Token your-token-here
```

#### ดูประวัติสถานะ
```http
GET http://localhost:8000/api/orders/1/status-logs/
Authorization: Token your-token-here
```

### 8. การให้รีวิว

#### รีวิวร้านอาหาร
```http
POST http://localhost:8000/api/reviews/
Content-Type: application/json
Authorization: Token your-token-here

{
    "order_id": 1,
    "rating_restaurant": 5,
    "comment_restaurant": "อาหารอร่อยมาก บริการดีเยี่ยม"
}
```

#### รีวิวสินค้า
```http
POST http://localhost:8000/api/product-reviews/
Content-Type: application/json
Authorization: Token your-token-here

{
    "order_detail_id": 1,
    "rating_product": 4,
    "comment_product": "ผัดไทยรสชาติดี แต่เผ็ดไปนิด"
}
```

### 9. การจัดการรายการโปรด

#### เพิ่มร้านโปรด
```http
POST http://localhost:8000/api/favorites/
Content-Type: application/json
Authorization: Token your-token-here

{
    "favorite_type": "restaurant",
    "restaurant_id": 1
}
```

#### เพิ่มเมนูโปรด
```http
POST http://localhost:8000/api/favorites/
Content-Type: application/json
Authorization: Token your-token-here

{
    "favorite_type": "product",
    "restaurant_id": 1,
    "product_id": 1
}
```

#### ดูรายการโปรด
```http
GET http://localhost:8000/api/favorites/
Authorization: Token your-token-here
```

---

## 🏪 การใช้งานสำหรับร้านอาหาร (Restaurant Owner)

### 1. การสมัครเป็นร้านอาหาร

#### สมัครเป็น General Restaurant
```http
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
    "username": "restaurant1",
    "email": "restaurant@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "role": "general_restaurant",
    "phone_number": "02-123-4567",
    "address": "789 ถนนสีลม กรุงเทพฯ"
}
```

### 2. การสร้างข้อมูลร้าน

#### สร้างร้านอาหาร
```http
POST http://localhost:8000/api/restaurants/
Content-Type: application/json
Authorization: Token your-token-here

{
    "restaurant_name": "ร้านอาหารไทยอร่อย",
    "description": "ร้านอาหารไทยต้นตำรับ รสชาติดั้งเดิม",
    "address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    "phone_number": "02-123-4567",
    "is_special": false,
    "opening_hours": "08:00-22:00",
    "bank_account_number": "1234567890",
    "bank_name": "ธนาคารกรุงเทพ",
    "account_name": "ร้านอาหารไทยอร่อย"
}
```

### 3. การจัดการเมนูอาหาร

#### เพิ่มหมวดหมู่ (ถ้าจำเป็น)
```http
POST http://localhost:8000/api/categories/
Content-Type: application/json

{
    "category_name": "อาหารไทย"
}
```

#### เพิ่มเมนูอาหาร
```http
POST http://localhost:8000/api/products/
Content-Type: application/json
Authorization: Token your-token-here

{
    "restaurant_id": 1,
    "category_id": 1,
    "product_name": "ผัดไทย",
    "description": "ผัดไทยรสชาติดั้งเดิม เส้นเหนียวนุ่ม",
    "price": 45.00,
    "is_available": true
}
```

#### แก้ไขเมนู
```http
PUT http://localhost:8000/api/products/1/
Content-Type: application/json
Authorization: Token your-token-here

{
    "restaurant_id": 1,
    "category_id": 1,
    "product_name": "ผัดไทยพิเศษ",
    "description": "ผัดไทยรสชาติดั้งเดิม พร้อมกุ้งสดใหญ่",
    "price": 55.00,
    "is_available": true
}
```

#### เปิด/ปิดการขายเมนู
```http
PATCH http://localhost:8000/api/products/1/
Content-Type: application/json
Authorization: Token your-token-here

{
    "is_available": false
}
```

### 4. การจัดการคำสั่งซื้อ

#### ดูคำสั่งซื้อของร้าน
```http
GET http://localhost:8000/api/orders/
Authorization: Token your-token-here
```

#### อัปเดตสถานะคำสั่งซื้อ
```http
POST http://localhost:8000/api/orders/1/update-status/
Content-Type: application/json
Authorization: Token your-token-here

{
    "status": "preparing",
    "note": "เริ่มเตรียมอาหาร คาดว่าจะเสร็จใน 15 นาที"
}
```

#### ลำดับสถานะที่ร้านจัดการ
1. **paid** → **preparing** (ยืนยันรับออเดอร์)
2. **preparing** → **ready_for_pickup** (อาหารพร้อม)
3. **ready_for_pickup** → **delivering** (ส่งให้คนขับ)
4. **delivering** → **completed** (จัดส่งเสร็จ)

### 5. การจัดการการชำระเงิน

#### ดูการชำระเงินของร้าน
```http
GET http://localhost:8000/api/payments/
Authorization: Token your-token-here
```

#### ยืนยันการรับเงิน
```http
POST http://localhost:8000/api/payments/1/confirm/
Content-Type: application/json
Authorization: Token your-token-here

{
    "proof_of_payment_url": "https://example.com/verified-payment.jpg"
}
```

### 6. การดูสถิติร้าน

#### Dashboard ร้าน
```http
GET http://localhost:8000/api/dashboard/restaurant/
Authorization: Token your-token-here
```

#### สถิติร้าน
```http
GET http://localhost:8000/api/analytics/restaurant/?date_from=2024-01-01&date_to=2024-12-31
Authorization: Token your-token-here
```

#### รายงานยอดขาย
```http
GET http://localhost:8000/api/reports/sales/?date_from=2024-01-01&date_to=2024-12-31
Authorization: Token your-token-here
```

---

## 👑 การใช้งานสำหรับผู้ดูแลระบบ (Admin)

### 1. การเข้าสู่ระบบ Admin

#### ผ่าน API
```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
    "username": "admin_username",
    "password": "admin_password"
}
```

#### ผ่าน Django Admin Panel
เข้าไปที่ `http://localhost:8000/admin/`

### 2. การจัดการผู้ใช้

#### ดูรายการผู้ใช้ทั้งหมด
```http
GET http://localhost:8000/api/users/
Authorization: Token admin-token-here
```

#### ดูสถิติผู้ใช้
```http
GET http://localhost:8000/api/users/statistics/
Authorization: Token admin-token-here
```

#### แก้ไขข้อมูลผู้ใช้
```http
PUT http://localhost:8000/api/users/2/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "username": "updated_username",
    "email": "updated@example.com",
    "role": "special_restaurant",
    "phone_number": "02-999-8888",
    "address": "New Address"
}
```

### 3. การจัดการร้านอาหาร

#### ดูร้านอาหารทั้งหมด
```http
GET http://localhost:8000/api/restaurants/
Authorization: Token admin-token-here
```

#### อนุมัติร้านเป็น Special Restaurant
```http
PUT http://localhost:8000/api/restaurants/1/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "is_special": true
}
```

#### เปลี่ยนสถานะร้าน
```http
PUT http://localhost:8000/api/restaurants/1/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "status": "closed"
}
```

### 4. การจัดการหมวดหมู่

#### เพิ่มหมวดหมู่ใหม่
```http
POST http://localhost:8000/api/categories/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "category_name": "เครื่องดื่ม"
}
```

#### แก้ไขหมวดหมู่
```http
PUT http://localhost:8000/api/categories/1/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "category_name": "อาหารไทยต้นตำรับ"
}
```

### 5. การจัดการคำสั่งซื้อ

#### ดูคำสั่งซื้อทั้งหมด
```http
GET http://localhost:8000/api/orders/
Authorization: Token admin-token-here
```

#### แทรกแซงคำสั่งซื้อ (กรณีฉุกเฉิน)
```http
POST http://localhost:8000/api/orders/1/update-status/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "status": "cancelled",
    "note": "ยกเลิกโดย Admin เนื่องจากปัญหาระบบ"
}
```

### 6. การจัดการการชำระเงิน

#### ดูการชำระเงินทั้งหมด
```http
GET http://localhost:8000/api/payments/
Authorization: Token admin-token-here
```

#### ยืนยัน/ปฏิเสธการชำระเงิน
```http
POST http://localhost:8000/api/payments/1/confirm/
Content-Type: application/json
Authorization: Token admin-token-here

{
    "proof_of_payment_url": "https://example.com/admin-verified.jpg"
}
```

### 7. การดูสถิติและรายงาน

#### Dashboard Admin
```http
GET http://localhost:8000/api/dashboard/admin/
Authorization: Token admin-token-here
```

#### สถิติรายวัน
```http
GET http://localhost:8000/api/analytics/daily/?date_from=2024-01-01&date_to=2024-12-31
Authorization: Token admin-token-here
```

#### รายงานยอดขายทั้งระบบ
```http
GET http://localhost:8000/api/reports/sales/?date_from=2024-01-01&date_to=2024-12-31
Authorization: Token admin-token-here
```

#### รายงานสินค้าขายดี
```http
GET http://localhost:8000/api/reports/products/?date_from=2024-01-01&date_to=2024-12-31
Authorization: Token admin-token-here
```

---

## 🧪 การทดสอบด้วย Postman

### การตั้งค่า Postman Environment

#### 1. สร้าง Environment
- Environment Name: `Food Delivery Local`
- Variables:
  ```
  base_url: http://localhost:8000
  token: {{token_value}}
  ```

#### 2. การใช้ Variables
```http
{{base_url}}/api/auth/login/
Authorization: Token {{token}}
```

### การสร้าง Collection

#### 1. สร้าง Collection ใหม่
- Collection Name: `Food Delivery API`
- Description: `API testing for Food Delivery System`

#### 2. จัดกลุ่ม Requests
```
📁 Food Delivery API
├── 📁 Authentication
│   ├── POST Register
│   ├── POST Login
│   ├── POST Logout
│   └── GET Profile
├── 📁 Restaurants
│   ├── GET List Restaurants
│   ├── POST Create Restaurant
│   ├── GET Restaurant Details
│   └── PUT Update Restaurant
├── 📁 Products
│   ├── GET List Products
│   ├── POST Create Product
│   └── PUT Update Product
├── 📁 Orders
│   ├── GET List Orders
│   ├── POST Create Order
│   └── POST Update Status
└── 📁 Payments
    ├── POST Create Payment
    └── POST Confirm Payment
```

### Pre-request Scripts

#### Auto Token Management
```javascript
// ใน Pre-request Script ของ Login request
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
});
```

### Test Scripts

#### ตัวอย่าง Test Script
```javascript
// ตรวจสอบ status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// ตรวจสอบ response time
pm.test("Response time is less than 200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});

// ตรวจสอบ response body
pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
});
```

### การรัน Collection

#### Manual Testing
1. เลือก Collection
2. คลิก "Run"
3. เลือก Environment
4. กำหนด Iterations
5. คลิก "Run Food Delivery API"

#### Automated Testing
```bash
# ใช้ Newman (Postman CLI)
npm install -g newman

# รัน collection
newman run collection.json -e environment.json
```

---

## ❓ คำถามที่พบบ่อย (FAQ)

### Q1: ทำไมได้ "Authentication credentials were not provided"?
**A:** ตรวจสอบว่าได้ใส่ Authorization header หรือยัง
```http
Authorization: Token your-token-here
```

### Q2: ทำไมสร้างร้านอาหารไม่ได้?
**A:** ตรวจสอบว่า:
1. ได้ login ด้วย role `general_restaurant` หรือ `special_restaurant`
2. ยังไม่เคยสร้างร้านมาก่อน (1 user = 1 restaurant)

### Q3: ทำไมสั่งอาหารไม่ได้?
**A:** ตรวจสอบว่า:
1. Restaurant มีสถานะ `open`
2. Product มี `is_available = true`
3. ข้อมูล order_details ถูกต้อง

### Q4: ทำไมไม่สามารถอัปเดตสถานะคำสั่งซื้อได้?
**A:** ตรวจสอบว่า:
1. เป็นเจ้าของร้านที่รับออเดอร์นั้น
2. สถานะที่เปลี่ยนเป็นไปตาม lifecycle
3. คำสั่งซื้อยังไม่ถูกยกเลิก

### Q5: ทำไมการชำระเงินไม่สำเร็จ?
**A:** ตรวจสอบว่า:
1. Order มีสถานะ `pending` หรือ `paid`
2. ยังไม่มี Payment สำหรับ Order นั้น
3. ข้อมูล payment ถูกต้อง

### Q6: ทำไมไม่เห็นข้อมูลบางอย่าง?
**A:** ตรวจสอบสิทธิ์การเข้าถึงตาม role:
- `customer`: เห็นเฉพาะข้อมูลตัวเอง
- `restaurant`: เห็นข้อมูลร้านตัวเอง
- `admin`: เห็นข้อมูลทั้งหมด

### Q7: ทำไม Token หมดอายุ?
**A:** Token ไม่หมดอายุใน development แต่ถ้าหมดอายุให้ login ใหม่

### Q8: ทำไมรีวิวไม่ได้?
**A:** ตรวจสอบว่า:
1. Order มีสถานะ `completed`
2. ยังไม่เคยรีวิว Order นั้นมาก่อน
3. เป็นเจ้าของ Order

---

## 🔧 การแก้ไขปัญหา (Troubleshooting)

### ปัญหาการเชื่อมต่อฐานข้อมูล

#### อาการ
```
django.db.utils.OperationalError: (2003, "Can't connect to MySQL server")
```

#### วิธีแก้
1. ตรวจสอบว่า MySQL server ทำงานอยู่
2. ตรวจสอบ credentials ในไฟล์ `.env`
3. ตรวจสอบ port และ host

### ปัญหา Migration

#### อาการ
```
django.db.utils.ProgrammingError: (1146, "Table 'food_delivery_db.accounts_user' doesn't exist")
```

#### วิธีแก้
```bash
# ลบ migration files (ยกเว้น __init__.py)
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# สร้าง migration ใหม่
python manage.py makemigrations accounts
python manage.py makemigrations api
python manage.py migrate
```

### ปัญหา CSRF Token

#### อาการ
```
{"detail": "CSRF Failed: CSRF token missing."}
```

#### วิธีแก้
ระบบได้ปิด CSRF สำหรับ API endpoints แล้ว หากยังมีปัญหา:
1. ตรวจสอบ middleware ใน `settings.py`
2. ตรวจสอบว่า URL ขึ้นต้นด้วย `/api/`

### ปัญหา Permission Denied

#### อาการ
```
{"detail": "You do not have permission to perform this action."}
```

#### วิธีแก้
1. ตรวจสอบ role ของผู้ใช้
2. ตรวจสอบว่าเป็นเจ้าของ resource หรือไม่
3. ตรวจสอบการใส่ Authorization header

### ปัญหา Validation Error

#### อาการ
```
{
    "field_name": ["This field is required."]
}
```

#### วิธีแก้
1. ตรวจสอบ required fields ใน request body
2. ตรวจสอบ data type ของแต่ละ field
3. ตรวจสอบ constraints (เช่น unique, foreign key)

### ปัญหา Server Error (500)

#### วิธีแก้
1. ดู log ใน console
2. ตรวจสอบ Django debug toolbar
3. ตรวจสอบ database connection
4. ตรวจสอบ syntax error ในโค้ด

### การ Debug

#### เปิด Debug Mode
```python
# ใน settings.py
DEBUG = True
```

#### ดู Database Queries
```python
# ใน settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

#### ใช้ Django Shell
```bash
python manage.py shell

# ทดสอบ queries
from api.models import Restaurant
restaurants = Restaurant.objects.all()
print(restaurants)
```

---

## 📞 การติดต่อและการสนับสนุน

### Technical Support
- **Email**: support@fooddelivery.com
- **GitHub Issues**: [Repository Issues](https://github.com/your-repo/issues)
- **Documentation**: README.md และไฟล์นี้

### Development Team
- **Backend Developer**: [Your Name]
- **Database Administrator**: [DBA Name]
- **API Documentation**: [Doc Maintainer]

### Business Hours
- **Support Hours**: จันทร์-ศุกร์ 9:00-18:00
- **Emergency Support**: 24/7 สำหรับ production issues

---

## 📝 การอัปเดตเอกสาร

### Version History
- **v1.0** (2025-06-19): เอกสารเริ่มต้น
- **v1.1** (TBD): เพิ่มฟีเจอร์ใหม่

### Contributing
หากต้องการช่วยปรับปรุงเอกสาร:
1. Fork repository
2. สร้าง branch ใหม่
3. แก้ไขเอกสาร
4. สร้าง Pull Request

---

*คู่มือนี้อัปเดตล่าสุด: 2025-06-19* 