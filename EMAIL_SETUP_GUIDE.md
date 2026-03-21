# 📧 คู่มือการตั้งค่าและแก้ไขปัญหา Email

## 📋 สารบัญ
1. [การตั้งค่า Email](#การตั้งค่า-email)
2. [การแก้ไขปัญหา Email Verification](#การแก้ไขปัญหา-email-verification)
3. [Troubleshooting](#troubleshooting)

---

## 🔧 การตั้งค่า Email

### การตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root ของโปรเจค และเพิ่มค่าต่อไปนี้:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DB_NAME=food_delivery_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306

# Email Settings (Gmail Example)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Food Delivery <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 📮 การตั้งค่า Gmail

#### 1. เปิดใช้งาน 2-Factor Authentication
1. ไปที่ [Google Account Security](https://myaccount.google.com/security)
2. เปิดใช้งาน "2-Step Verification"

#### 2. สร้าง App Password
1. ไปที่ [App Passwords](https://myaccount.google.com/apppasswords)
2. เลือก "Mail" และ "Other (custom name)"
3. ตั้งชื่อ "Food Delivery App"
4. คัดลอก App Password ที่ได้มาใส่ใน `EMAIL_HOST_PASSWORD`

### 🛠️ การตั้งค่าผู้ให้บริการอีเมลอื่นๆ

#### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### 🧪 การทดสอบระบบอีเมล

#### 1. ใช้ Console Backend (สำหรับทดสอบ)
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
อีเมลจะแสดงใน console แทนการส่งจริง

#### 2. ใช้ File Backend (สำหรับทดสอบ)
```env
EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend
EMAIL_FILE_PATH=/tmp/app-messages
```
อีเมลจะถูกบันทึกเป็นไฟล์

#### 3. ทดสอบการส่งอีเมล
```python
# ใน Django shell
python manage.py shell

from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'This is a test message.',
    settings.DEFAULT_FROM_EMAIL,
    ['recipient@example.com'],
    fail_silently=False,
)
```

### 🔒 ความปลอดภัย

#### 1. อย่าใส่รหัสผ่านจริงใน code
- ใช้ Environment Variables เท่านั้น
- อย่า commit ไฟล์ `.env` ลง Git

#### 2. ใช้ App Password
- อย่าใช้รหัสผ่านหลักของ Gmail
- ใช้ App Password ที่สร้างเฉพาะ

#### 3. จำกัดสิทธิ์
- ใช้อีเมลเฉพาะสำหรับ app
- ตั้งค่า rate limiting

### 🚀 การใช้งาน

#### 1. สมัครสมาชิกใหม่
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "confirm_password": "password123"
  }'
```

#### 2. ยืนยันอีเมล
```bash
curl -X POST http://localhost:8000/api/auth/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification-token-from-email"
  }'
```

#### 3. ส่งอีเมลยืนยันใหม่
```bash
curl -X POST http://localhost:8000/api/auth/resend-verification/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## 🔧 การแก้ไขปัญหา Email Verification

### ปัญหาที่พบ
Users ที่สร้างโดย admin ไม่สามารถ login เข้าระบบได้ แม้ว่าจะมี `is_email_verified = True` แล้วก็ตาม

### การแก้ไขที่ทำไปแล้ว

#### 1. แก้ไข Frontend Logic (AuthContext.jsx)
```javascript
// เปลี่ยนจาก
if (!user.is_email_verified && user.role !== 'admin')

// เป็น
if (!user.is_email_verified)
```

#### 2. แก้ไข Backend Logic (accounts/views.py)
Backend login view จะเช็คเฉพาะ `is_email_verified` status เท่านั้น

#### 3. สร้าง Management Commands
- `python manage.py debug_user_login` - ดูสถานะ users
- `python manage.py debug_user_login --fix-all` - แก้ไข email verification
- `python manage.py debug_user_login --username <username>` - แก้ไข user เฉพาะ

### วิธีแก้ไขปัญหา

#### Step 1: ตรวจสอบสถานะ Database
```bash
python manage.py debug_user_login
```

#### Step 2: แก้ไข Users ที่มีปัญหา
```bash
# แก้ไขทุก users
python manage.py debug_user_login --fix-all

# แก้ไข user เฉพาะ
python manage.py debug_user_login --username <username>
```

#### Step 3: ตรวจสอบ Browser
1. **Clear Browser Cache & Cookies**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete

2. **Clear localStorage**
   - เปิด Developer Tools (F12)
   - ไปที่ Application tab > Local Storage
   - ลบ entries ทั้งหมด

3. **ลองใช้ Incognito/Private Mode**

#### Step 4: ตรวจสอบ Network Requests
1. เปิด Developer Tools (F12)
2. ไปที่ Network tab
3. ลอง login
4. ดู request ไป `/api/auth/login/`
5. ตรวจสอบ response status และ data

#### Step 5: ตรวจสอบ Console Errors
1. เปิด Developer Tools (F12)
2. ไปที่ Console tab
3. ลอง login
4. ดู error messages ที่แสดง

### การทดสอบ API โดยตรง

#### ใช้ curl
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```

### Expected Response สำหรับ Login สำเร็จ
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@test.com",
    "role": "customer",
    "is_email_verified": true
  },
  "token": "your-api-token-here",
  "message": "Login successful"
}
```

### Expected Response สำหรับ Email Not Verified
```json
{
  "success": false,
  "error": "Email not verified",
  "message": "Please verify your email before logging in. Check your email and enter the verification code",
  "error_type": "email_not_verified",
  "email_verification_required": true,
  "user_email": "user@example.com"
}
```

### การตรวจสอบเพิ่มเติม

#### 1. ตรวจสอบ Environment Variables
```bash
# Frontend
echo $VITE_API_URL

# หรือดูใน frontend/src/config/api.js
```

#### 2. ตรวจสอบ CORS Settings
ใน `food_delivery_backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

#### 3. ตรวจสอบ Server Status
```bash
# Backend
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

### สาเหตุที่เป็นไปได้

1. **Browser Cache** - ข้อมูลเก่าใน browser cache
2. **localStorage** - Token หรือ user data เก่าใน localStorage
3. **Network Issues** - Connection problems หรือ CORS
4. **Database Inconsistency** - User data ไม่ consistent
5. **Session Issues** - Django session มีปัญหา

### การป้องกันปัญหาในอนาคต

#### Admin Create User Flow
เมื่อ admin สร้าง user ใหม่:
```python
# ใน accounts/views.py create method
user = serializer.save()
user._created_by_admin = True
user.is_email_verified = True  # สำคัญ!
user.save()

# สร้าง token อัตโนมัติ
token, created = Token.objects.get_or_create(user=user)
```

#### Frontend Validation
```javascript
// ใน AuthContext.jsx
if (!user.is_email_verified) {
  // เช็คเฉพาะ is_email_verified เท่านั้น
  // ไม่ต้องเช็ค role
}
```

---

## 🐛 Troubleshooting

### 1. อีเมลไม่ส่ง
- ตรวจสอบ EMAIL_HOST_USER และ EMAIL_HOST_PASSWORD
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ตรวจสอบ firewall settings

### 2. Authentication Failed
- ตรวจสอบ App Password
- ตรวจสอบ 2FA settings
- ลองใช้ console backend เพื่อทดสอบ

### 3. Template Error
- ตรวจสอบว่าไฟล์ template อยู่ในที่ถูกต้อง
- ตรวจสอบ TEMPLATES setting ใน Django

### 4. Email Verification ไม่ทำงาน
- ตรวจสอบว่า `is_email_verified` ถูกตั้งค่าเป็น `True` ในฐานข้อมูล
- ใช้ `python manage.py debug_user_login --fix-all` เพื่อแก้ไข
- Clear browser cache และ localStorage

### 5. Users ที่สร้างโดย Admin ไม่สามารถ Login ได้
- ตรวจสอบว่า `is_email_verified = True` ในฐานข้อมูล
- ใช้ `python manage.py debug_user_login` เพื่อตรวจสอบ
- ใช้ `python manage.py debug_user_login --fix-all` เพื่อแก้ไข

---

## 📝 Logs

ระบบจะบันทึก log ของการส่งอีเมลใน Django logs:
- สำเร็จ: `INFO` level
- ล้มเหลว: `ERROR` level

ตรวจสอบ logs เพื่อ debug ปัญหา:
```bash
tail -f /path/to/django.log
```

---

## 📞 Contact

หากยังพบปัญหา ให้:
1. รัน `python manage.py debug_user_login` และส่ง output
2. ส่ง screenshot ของ Network tab ใน Developer Tools
3. ส่ง error messages จาก Console tab
