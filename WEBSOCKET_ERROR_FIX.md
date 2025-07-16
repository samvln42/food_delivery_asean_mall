# WebSocket Error Fix Documentation

## ปัญหาที่พบ
- WebSocket error: Event {isTrusted: true, type: 'error', ...} แม้ WebSocket เชื่อมต่ออยู่
- Guest WebSocket ถูก disconnect บ่อย (code 1001) เมื่อเปลี่ยนหน้า
- เมื่อกลับมาหน้า /guest-orders ต้องรอสักพักก่อนจะเชื่อมต่อใหม่

## การแก้ไข

### 1. แก้ไข Error Handler ใน WebSocket Service
- เพิ่มการตรวจสอบสถานะ WebSocket ที่ละเอียดขึ้น
- ใช้ flag `_isConnected` เพื่อป้องกัน error handler ทำงานซ้ำ
- เพิ่มการ reset flag ใน onclose และ disconnectGuest

### 2. เพิ่ม Cleanup Function ใน GuestOrders.jsx
- เพิ่มการเรียก `disconnectGuest()` เมื่อ component unmount
- ปรับปรุง status indicator ให้แสดงสถานะจริงของ WebSocket

### 3. ปรับปรุงการเชื่อมต่อ WebSocket ให้เร็วขึ้น
- แยกการเชื่อมต่อ WebSocket ออกจาก polling
- ลด delay ในการ reconnect จาก 3 วินาที เป็น 1-3 วินาที
- ลด delay ในการ subscribe จาก 2 วินาที เป็น 1 วินาที
- เพิ่ม auto-subscription เมื่อ WebSocket เชื่อมต่อสำเร็จ

### 4. ปรับปรุงการจัดการ Connection
- ปิด WebSocket เก่าก่อนสร้างใหม่
- Reset reconnection attempts เมื่อเชื่อมต่อสำเร็จ
- เพิ่มการตรวจสอบสถานะที่เร็วขึ้น (1 วินาที แทน 2 วินาที)

## ผลลัพธ์
- WebSocket error message ลดลงและไม่รบกวนการทำงานของระบบ
- การเชื่อมต่อใหม่เร็วขึ้นเมื่อกลับมาหน้า /guest-orders
- การจัดการ connection เสถียรขึ้น

## ไฟล์ที่แก้ไข
- `frontend/src/services/websocket.js`
- `frontend/src/pages/customer/GuestOrders.jsx`
- `WEBSOCKET_ERROR_FIX.md`

## การทดสอบ
1. เปิดหน้า /guest-orders
2. เปลี่ยนไปหน้าอื่น
3. กลับมาหน้า /guest-orders
4. ตรวจสอบว่า WebSocket เชื่อมต่อใหม่เร็วขึ้น
5. ตรวจสอบว่าไม่มี error message ที่ไม่จำเป็น 