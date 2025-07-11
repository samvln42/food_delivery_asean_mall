# 🔧 WebSocket Troubleshooting Guide

## 📋 การแก้ปัญหา WebSocket Error

### ❌ **ปัญหาที่พบ:**
```
WebSocket connection to 'wss://tacashop.com/ws/orders/?token=...' failed
❌ WebSocket error: Event
🔌 WebSocket disconnected, code: 1006
```

---

## 🔍 **การตรวจสอบปัญหา**

### 1. ตรวจสอบ Daphne Service
```bash
# ดูสถานะ Daphne
sudo systemctl status daphne

# ดู log ของ Daphne
sudo journalctl -u daphne -f

# Restart Daphne
sudo systemctl restart daphne
```

### 2. ตรวจสอบ Port
```bash
# ตรวจสอบว่า port 8001 กำลัง listen อยู่หรือไม่
sudo netstat -tlnp | grep :8001

# ตรวจสอบ process ที่ใช้ port 8001
sudo lsof -i :8001
```

### 3. ตรวจสอบ Nginx Configuration
```bash
# Test nginx config
sudo nginx -t

# ดู nginx error log
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### 4. ตรวจสอบ Django Settings
```bash
# ตรวจสอบว่า ASGI_APPLICATION ถูกตั้งค่าแล้ว
cd /home/ubuntu/food_delivery_asean_mall
source venv/bin/activate
python manage.py shell

>>> from django.conf import settings
>>> print(settings.ASGI_APPLICATION)
>>> print(settings.CHANNEL_LAYERS)
```

---

## 🚀 **ขั้นตอนการแก้ไข**

### Step 1: Deploy WebSocket Support
```bash
# รัน script นี้บน AWS Server
chmod +x deploy_websocket_http.sh
sudo ./deploy_websocket_http.sh
```

### Step 2: ตรวจสอบการทำงาน
```bash
# 1. ตรวจสอบ services
sudo systemctl status daphne
sudo systemctl status nginx
sudo systemctl status gunicorn

# 2. ตรวจสอบ ports
sudo netstat -tlnp | grep -E ':(80|8001|8000)'

# 3. Test WebSocket endpoint
curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" http://tacashop.com/ws/orders/
```

### Step 3: ทดสอบจาก Browser
```javascript
// เปิด Browser Console และทดสอบ
const ws = new WebSocket('wss://tacashop.com/ws/orders/?token=YOUR_TOKEN');

ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.log('❌ Error:', e);
ws.onclose = (e) => console.log('🔌 Closed:', e.code);
```

---

## 🔧 **การแก้ไขปัญหาเฉพาะ**

### 1. Daphne ไม่ start
```bash
# ตรวจสอบ Python path และ virtual environment
sudo systemctl edit daphne
# เพิ่ม:
[Service]
Environment=PYTHONPATH=/home/ubuntu/food_delivery_asean_mall
Environment=DJANGO_SETTINGS_MODULE=food_delivery_backend.settings

sudo systemctl daemon-reload
sudo systemctl restart daphne
```

### 2. Permission Error
```bash
# แก้ไข ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/food_delivery_asean_mall
sudo chmod +x /home/ubuntu/food_delivery_asean_mall/venv/bin/daphne
```

### 3. Environment Variables
```bash
# ตรวจสอบ .env file
ls -la /home/ubuntu/food_delivery_asean_mall/.env
cat /home/ubuntu/food_delivery_asean_mall/.env | grep -E '(SECRET_KEY|DB_|DEBUG)'
```

### 4. Firewall Issues
```bash
# ตรวจสอบ firewall (ถ้ามี)
sudo ufw status
sudo iptables -L

# เปิด port 8001 ถ้าจำเป็น (internal port, ไม่ควรเปิดให้ public)
# Port 8001 ควรเข้าได้จาก localhost เท่านั้น
```

---

## 📊 **Architecture ที่ถูกต้อง**

```
Frontend (Browser)
    ↓ HTTPS/WSS
Load Balancer (AWS ALB/CloudFront)
    ↓ HTTP/WS  
Nginx (Port 80)
    ├── /api/ → Gunicorn (Django REST API)
    ├── /ws/  → Daphne (Django Channels)
    └── /     → React Dev Server (Port 3000)
```

---

## 🚨 **Common Issues & Solutions**

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Error 1006 | Daphne ไม่ทำงาน | Start Daphne service |
| Error 403 | Authentication | ตรวจสอบ token |
| Error 502 | Nginx config | ตรวจสอบ proxy_pass |
| Timeout | Network | ตรวจสอบ firewall/security groups |

---

## 📝 **Log Files ที่สำคัญ**

```bash
# Daphne logs
sudo journalctl -u daphne -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Django logs (ถ้ามี)
tail -f /home/ubuntu/food_delivery_asean_mall/logs/django.log
```

---

## ✅ **ตรวจสอบการทำงานที่ถูกต้อง**

เมื่อทุกอย่างทำงานถูกต้อง คุณจะเห็น:

1. **Browser Console:**
   ```
   🔗 Connecting to WebSocket: wss://tacashop.com/ws/orders/?token=...
   ✅ WebSocket connected successfully
   ```

2. **Daphne Logs:**
   ```
   📝 WebSocket connection attempt, query: token=...
   🔑 Extracted token: ...
   ✅ User authenticated: 2 (customer)
   🎉 WebSocket connected successfully for user: 2
   ```

3. **Network Tab:**
   - เห็น WebSocket connection เป็น status 101 (Switching Protocols)
   - Connection type: websocket

---

## 🎯 **Final Check**

หลังจากทำตามขั้นตอนทั้งหมด ให้ทดสอบ:

1. ล็อกอินเป็น customer
2. ไปที่หน้า Orders
3. ดู Browser Console ว่ามีข้อความ "✅ WebSocket connected successfully"
4. ทดสอบ order status update (ถ้าเป็น admin เปลี่ยน status ผ่าน admin panel)

---

## 🆘 **หากยังแก้ไม่ได้**

ส่งข้อมูลเหล่านี้:

```bash
# รวบรวมข้อมูล debug
echo "=== System Info ===" > debug_info.txt
uname -a >> debug_info.txt
echo "=== Services ===" >> debug_info.txt
sudo systemctl status daphne nginx gunicorn --no-pager >> debug_info.txt
echo "=== Ports ===" >> debug_info.txt
sudo netstat -tlnp | grep -E ':(80|8001)' >> debug_info.txt
echo "=== Daphne Logs ===" >> debug_info.txt
sudo journalctl -u daphne --no-pager -n 50 >> debug_info.txt
echo "=== Nginx Config ===" >> debug_info.txt
sudo cat /etc/nginx/sites-available/default >> debug_info.txt
``` 