# 📧 คู่มือการตั้งค่าส่งอีเมลยืนยัน

## 🔧 การตั้งค่า Environment Variables

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

## 📮 การตั้งค่า Gmail

### 1. เปิดใช้งาน 2-Factor Authentication
1. ไปที่ [Google Account Security](https://myaccount.google.com/security)
2. เปิดใช้งาน "2-Step Verification"

### 2. สร้าง App Password
1. ไปที่ [App Passwords](https://myaccount.google.com/apppasswords)
2. เลือก "Mail" และ "Other (custom name)"
3. ตั้งชื่อ "Food Delivery App"
4. คัดลอก App Password ที่ได้มาใส่ใน `EMAIL_HOST_PASSWORD`

## 🛠️ การตั้งค่าผู้ให้บริการอีเมลอื่นๆ

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

## 🧪 การทดสอบระบบอีเมล

### 1. ใช้ Console Backend (สำหรับทดสอบ)
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
อีเมลจะแสดงใน console แทนการส่งจริง

### 2. ใช้ File Backend (สำหรับทดสอบ)
```env
EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend
EMAIL_FILE_PATH=/tmp/app-messages
```
อีเมลจะถูกบันทึกเป็นไฟล์

### 3. ทดสอบการส่งอีเมล
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

## 🔒 ความปลอดภัย

### 1. อย่าใส่รหัสผ่านจริงใน code
- ใช้ Environment Variables เท่านั้น
- อย่า commit ไฟล์ `.env` ลง Git

### 2. ใช้ App Password
- อย่าใช้รหัสผ่านหลักของ Gmail
- ใช้ App Password ที่สร้างเฉพาะ

### 3. จำกัดสิทธิ์
- ใช้อีเมลเฉพาะสำหรับ app
- ตั้งค่า rate limiting

## 🚀 การใช้งาน

### 1. สมัครสมาชิกใหม่
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

### 2. ยืนยันอีเมล
```bash
curl -X POST http://localhost:8000/api/auth/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification-token-from-email"
  }'
```

### 3. ส่งอีเมลยืนยันใหม่
```bash
curl -X POST http://localhost:8000/api/auth/resend-verification/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

## 🐛 การแก้ไขปัญหา

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

## 📝 Logs

ระบบจะบันทึก log ของการส่งอีเมลใน Django logs:
- สำเร็จ: `INFO` level
- ล้มเหลว: `ERROR` level

ตรวจสอบ logs เพื่อ debug ปัญหา:
```bash
tail -f /path/to/django.log
``` 