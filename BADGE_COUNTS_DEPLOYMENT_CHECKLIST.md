# Badge Counts Deployment Checklist

## ปัญหา: Badge Counts ไม่แสดงหลัง Deploy ลง AWS

### ขั้นตอนการตรวจสอบและแก้ไข

---

## 1. ตรวจสอบ Backend API

### 1.1 ตรวจสอบว่า API endpoint ใหม่ทำงานหรือไม่

```bash
# SSH เข้า AWS server
ssh ubuntu@your-aws-ip

# เข้าไปที่ project directory
cd /path/to/your/project

# ตรวจสอบว่าโค้ดใหม่ถูก pull แล้ว
git pull origin main

# ตรวจสอบว่าไฟล์ api/views.py มี badge_counts endpoint
grep -A 20 "def badge_counts" api/views.py
```

### 1.2 Restart Backend Services

```bash
# Restart Gunicorn
sudo systemctl restart gunicorn

# Restart Daphne (WebSocket)
sudo systemctl restart daphne

# ตรวจสอบ status
sudo systemctl status gunicorn
sudo systemctl status daphne
```

### 1.3 ทดสอบ API Endpoint โดยตรง

```bash
# ทดสอบผ่าน curl (ต้องมี authentication token)
curl -X GET https://your-domain.com/api/notifications/badge-counts/ \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**คำตอบที่ควรได้:**
```json
{
  "regular_orders_count": 0,
  "guest_orders_count": 0,
  "total_unread_count": 0
}
```

---

## 2. ตรวจสอบ Frontend

### 2.1 ตรวจสอบว่า Frontend ถูก Build และ Deploy แล้ว

```bash
# SSH เข้า AWS server
cd /path/to/your/project/frontend

# Pull โค้ดใหม่
git pull origin main

# ติดตั้ง dependencies (ถ้ามีการเพิ่มใหม่)
npm install

# Build frontend ใหม่
npm run build

# Copy ไฟล์ไปยัง nginx directory
sudo cp -r dist/* /var/www/html/

# หรือถ้าใช้ nginx config แบบอื่น
sudo cp -r dist/* /usr/share/nginx/html/
```

### 2.2 ตรวจสอบว่า Frontend เรียก API ถูกต้อง

เปิด Browser Developer Tools (F12) และดูที่ Console และ Network tab:

1. **Console Tab**: ดูว่ามี error หรือไม่
2. **Network Tab**: ดูว่ามีการเรียก `/api/notifications/badge-counts/` หรือไม่
   - ถ้าเรียกแล้วได้ status 200 → API ทำงาน
   - ถ้าได้ status 404 → API endpoint ไม่มี
   - ถ้าได้ status 401 → Authentication ผิดพลาด
   - ถ้าได้ status 500 → Backend error

---

## 3. ตรวจสอบ Database

### 3.1 ตรวจสอบว่ามี Notifications ในระบบ

```bash
# เข้า Django shell
python manage.py shell
```

```python
from api.models import Notification

# ตรวจสอบจำนวน notifications ทั้งหมด
print(f"Total notifications: {Notification.objects.count()}")

# ตรวจสอบ unread notifications ของ admin
from accounts.models import User
admin = User.objects.filter(role='admin').first()
if admin:
    unread = Notification.objects.filter(user=admin, is_read=False)
    print(f"Admin unread notifications: {unread.count()}")
    
    # แสดง type ของแต่ละ notification
    for n in unread:
        print(f"- Type: {n.type}, Order: {n.related_order_id}, Guest Order: {n.related_guest_order_id}")
```

---

## 4. ตรวจสอบ CORS และ API Configuration

### 4.1 ตรวจสอบ CORS Settings

ใน `food_delivery_backend/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "http://your-domain.com",
    # เพิ่ม domains ที่จำเป็น
]

CORS_ALLOW_CREDENTIALS = True
```

### 4.2 ตรวจสอบ API_CONFIG ใน Frontend

ใน `frontend/src/config/api.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-domain.com/api',  // ตรวจสอบว่า URL ถูกต้อง
  // ...
};
```

---

## 5. การแก้ไขปัญหาที่พบบ่อย

### ปัญหา 1: API Endpoint 404 Not Found

**สาเหตุ:** Backend ยังไม่ได้ restart หลังจาก deploy

**วิธีแก้:**
```bash
sudo systemctl restart gunicorn
sudo systemctl restart daphne
```

### ปัญหา 2: Badge Counts แสดงค่า 0 แม้จะมี Notifications

**สาเหตุ:** Notifications ในฐานข้อมูลไม่มี `type='order'` หรือ `type='guest_order'`

**วิธีแก้:**
```python
# ใน Django shell
from api.models import Notification

# ตรวจสอบ types ที่มี
types = Notification.objects.values_list('type', flat=True).distinct()
print(f"Notification types: {list(types)}")

# ถ้า type ไม่ถูกต้อง ให้แก้ไขใน code ที่สร้าง notification
```

### ปัญหา 3: Frontend Cache

**สาเหตุ:** Browser cache โค้ด JavaScript เก่า

**วิธีแก้:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. เปิด Incognito/Private window
4. เพิ่ม cache busting ใน build process

### ปัญหา 4: Nginx Cache

**สาเหตุ:** Nginx cache static files

**วิธีแก้:**
```bash
# Clear nginx cache
sudo rm -rf /var/cache/nginx/*

# Restart nginx
sudo systemctl restart nginx
```

### ปัญหา 5: Authentication Token หมดอายุ

**สาเหตุ:** Token ที่ใช้ไม่ valid

**วิธีแก้:**
1. Logout แล้ว Login ใหม่
2. ตรวจสอบใน Browser DevTools → Application → Local Storage → token

---

## 6. ขั้นตอน Deploy ที่ถูกต้อง (เพื่อป้องกันปัญหาในอนาคต)

### Backend Deploy Script

```bash
#!/bin/bash
# deploy_backend.sh

echo "🚀 Starting backend deployment..."

# 1. Pull latest code
git pull origin main

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install/update dependencies
pip install -r requirements.txt

# 4. Run migrations (ถ้ามี)
python manage.py migrate

# 5. Collect static files
python manage.py collectstatic --noinput

# 6. Restart services
sudo systemctl restart gunicorn
sudo systemctl restart daphne

# 7. Check status
sudo systemctl status gunicorn
sudo systemctl status daphne

echo "✅ Backend deployment completed!"
```

### Frontend Deploy Script

```bash
#!/bin/bash
# deploy_frontend.sh

echo "🚀 Starting frontend deployment..."

# 1. Navigate to frontend directory
cd frontend

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Build production bundle
npm run build

# 5. Backup old files
sudo cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d-%H%M%S)

# 6. Deploy new files
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# 7. Set correct permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 8. Restart nginx
sudo systemctl restart nginx

echo "✅ Frontend deployment completed!"
```

---

## 7. ตรวจสอบ Logs หากยังมีปัญหา

```bash
# Backend logs
sudo journalctl -u gunicorn -n 100 --no-pager
sudo journalctl -u daphne -n 100 --no-pager

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Django application logs (ถ้ามี)
tail -f /path/to/your/project/logs/*.log
```

---

## 8. Quick Test Script

สร้างไฟล์ `test_badge_counts.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="https://your-domain.com"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-password"

echo "🔍 Testing Badge Counts API..."

# 1. Login and get token
echo "1. Getting admin token..."
TOKEN=$(curl -s -X POST "${API_URL}/api/accounts/login/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  | python -c "import sys, json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:10}..."

# 2. Test unread count endpoint
echo "2. Testing unread-count endpoint..."
curl -X GET "${API_URL}/api/notifications/unread-count/" \
  -H "Authorization: Token ${TOKEN}" \
  -H "Content-Type: application/json" \
  | python -m json.tool

# 3. Test badge-counts endpoint
echo "3. Testing badge-counts endpoint..."
curl -X GET "${API_URL}/api/notifications/badge-counts/" \
  -H "Authorization: Token ${TOKEN}" \
  -H "Content-Type: application/json" \
  | python -m json.tool

echo "✅ All tests completed!"
```

---

## สรุป: ขั้นตอนแก้ปัญหา Badge Counts

1. ✅ **Deploy Backend**: Pull code ใหม่ + Restart services
2. ✅ **Deploy Frontend**: Build ใหม่ + Copy ไฟล์
3. ✅ **Clear Cache**: Browser + Nginx cache
4. ✅ **Test API**: ใช้ curl หรือ Postman ทดสอบ endpoint
5. ✅ **Check Logs**: ดู error logs ทั้ง backend และ frontend
6. ✅ **Verify Database**: ตรวจสอบว่ามี notifications จริงในฐานข้อมูล

หากทำตามขั้นตอนแล้วยังไม่ได้ ให้ส่ง error logs มาเพื่อวินิจฉัยต่อไป!
