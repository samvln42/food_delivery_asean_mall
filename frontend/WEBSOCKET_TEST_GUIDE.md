# WebSocket Test Guide

## การทดสอบ WebSocket สำหรับ Guest Orders

### 1. ไฟล์ทดสอบ WebSocket
ใช้ไฟล์ `websocket-test.html` เพื่อทดสอบการเชื่อมต่อ WebSocket โดยตรง

### 2. ขั้นตอนการทดสอบ

#### 2.1 ทดสอบ Backend WebSocket Server
1. เปิด terminal และรัน backend:
   ```bash
   daphne -p 8000 food_delivery_backend.asgi:application
   ```

2. เปิดไฟล์ `websocket-test.html` ใน browser

3. ตรวจสอบ URL: `ws://localhost:8000/ws/guest-orders/`

4. คลิก "Connect" เพื่อทดสอบการเชื่อมต่อ

#### 2.2 ทดสอบการ Subscribe
1. หลังจากเชื่อมต่อสำเร็จ ให้ใส่ temporary_id ในช่อง "Temporary ID"

2. คลิก "Subscribe" เพื่อทดสอบการ subscribe

3. ตรวจสอบ log เพื่อดูข้อความที่ส่งและรับ

### 3. การ Debug ใน GuestOrders.jsx

#### 3.1 เปิด Developer Tools
1. เปิดหน้า `/guest-orders?temporary_id=YOUR_TEMPORARY_ID`

2. เปิด Developer Tools (F12)

3. ไปที่แท็บ Console

#### 3.2 ตรวจสอบ Log
ดู log ที่สำคัญ:
- `🔗 Setting up WebSocket for temporary_id: ...`
- `🔗 connectGuest() called`
- `🔗 Connecting to Guest WebSocket: ...`
- `✅ Guest WebSocket connected successfully`
- `📡 Auto-subscribing to guest order: ...`
- `📤 sendGuest() called with type: subscribe_guest_order`

#### 3.3 ตรวจสอบสถานะ WebSocket
ดู log ที่แสดงสถานะ:
- `🔍 Guest WebSocket status check: ...`
- `hasWebSocket: true/false`
- `readyState: 0/1/2/3`
- `readyStateText: CONNECTING/OPEN/CLOSING/CLOSED`

### 4. ปัญหาที่อาจเกิดขึ้น

#### 4.1 WebSocket ไม่เชื่อมต่อ
**อาการ:** `hasWebSocket: false`
**สาเหตุ:** 
- Backend ไม่ได้รัน
- URL ไม่ถูกต้อง
- Firewall หรือ proxy ปิดกั้น

**วิธีแก้:**
1. ตรวจสอบว่า backend รันอยู่
2. ตรวจสอบ URL ใน `websocket.js`
3. ทดสอบด้วย `websocket-test.html`

#### 4.2 WebSocket ติดสถานะ CONNECTING
**อาการ:** `readyState: 0` (CONNECTING)
**สาเหตุ:**
- Backend ไม่ตอบสนอง
- Network issue
- CORS issue

**วิธีแก้:**
1. ตรวจสอบ backend log
2. ทดสอบด้วย `websocket-test.html`
3. ตรวจสอบ network connection

#### 4.3 ไม่ได้รับข้อความ
**อาการ:** ไม่มี log `📨 Guest WebSocket message received`
**สาเหตุ:**
- ไม่ได้ subscribe
- Backend ไม่ส่งข้อความ
- Listener ไม่ได้ลงทะเบียน

**วิธีแก้:**
1. ตรวจสอบ log `📡 Subscribing to guest order`
2. ตรวจสอบ backend consumer
3. ตรวจสอบ listener registration

### 5. การตรวจสอบ Backend

#### 5.1 ตรวจสอบ Consumer
ดูไฟล์ `api/consumers.py`:
```python
class GuestOrdersConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # ตรวจสอบการเชื่อมต่อ
        pass
    
    async def receive(self, text_data):
        # ตรวจสอบการรับข้อความ
        pass
```

#### 5.2 ตรวจสอบ Routing
ดูไฟล์ `food_delivery_backend/routing.py`:
```python
websocket_urlpatterns = [
    path('ws/guest-orders/', GuestOrdersConsumer.as_asgi()),
]
```

### 6. การทดสอบแบบ Manual

#### 6.1 ทดสอบด้วย curl
```bash
# ทดสอบ HTTP endpoint
curl http://localhost:8000/api/guest-orders/track/?temporary_id=YOUR_TEMPORARY_ID
```

#### 6.2 ทดสอบด้วย wscat (ถ้ามี)
```bash
# ติดตั้ง wscat
npm install -g wscat

# ทดสอบ WebSocket
wscat -c ws://localhost:8000/ws/guest-orders/
```

### 7. การแก้ไขปัญหา

#### 7.1 ล้าง Cache
1. ล้าง browser cache
2. รีสตาร์ท development server
3. รีสตาร์ท backend

#### 7.2 ตรวจสอบ Environment Variables
ตรวจสอบไฟล์ `.env` หรือ environment variables:
```
VITE_API_URL=http://localhost:8000/api/
```

#### 7.3 ตรวจสอบ Network
1. ตรวจสอบ firewall
2. ตรวจสอบ proxy settings
3. ทดสอบด้วย localhost

### 8. การรายงานปัญหา

เมื่อพบปัญหา ให้รวบรวมข้อมูลต่อไปนี้:
1. Log จาก browser console
2. Log จาก backend
3. สถานะ WebSocket (`readyState`)
4. URL ที่ใช้เชื่อมต่อ
5. Temporary ID ที่ใช้ทดสอบ
6. ขั้นตอนที่ทำก่อนเกิดปัญหา

### 9. การทดสอบใน Production

สำหรับการทดสอบใน production:
1. เปลี่ยน URL เป็น production URL
2. ตรวจสอบ SSL/TLS settings
3. ตรวจสอบ nginx configuration
4. ตรวจสอบ firewall rules 