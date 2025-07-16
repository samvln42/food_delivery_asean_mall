# Guest Orders Language Switch Fix - แก้ไขปัญหาการ refresh สองครั้งเมื่อเปลี่ยนภาษา

## ปัญหาที่พบ
เมื่อเปลี่ยนภาษาบนหน้า `/guest-orders` หน้าจอจะ refresh สองครั้งทำให้กระตุกและไม่น่าใช้งาน

## สาเหตุของปัญหา
1. **useEffect dependency ที่ไม่เหมาะสม**: `useEffect` มี dependency `[temporaryId, translate]` ทำให้เมื่อ `translate` function เปลี่ยน (เมื่อเปลี่ยนภาษา) จะทำให้ useEffect ทำงานใหม่ทั้งหมด
2. **การสร้างฟังก์ชันใหม่ทุกครั้ง**: ฟังก์ชัน `fetchOrders`, `fetchOrdersQuietly` ถูกสร้างใหม่ทุกครั้งที่ component re-render
3. **การ fetch ข้อมูลซ้ำ**: เมื่อ useEffect ทำงานใหม่จะทำให้ fetch ข้อมูลซ้ำโดยไม่จำเป็น

## การแก้ไข

### 1. แยก useEffect
แยก useEffect ออกเป็น 2 ส่วน:
- **useEffect สำหรับ WebSocket และ Polling**: ใช้ dependency `[temporaryId]` เท่านั้น
- **useEffect สำหรับ WebSocket Event Listeners**: ใช้ dependency `[translate]` เท่านั้น

```javascript
// useEffect สำหรับ WebSocket connection และ polling
useEffect(() => {
  // เชื่อมต่อ WebSocket และตั้งค่า polling
  // ไม่มี translate ใน dependencies
}, [temporaryId]);

// useEffect สำหรับ WebSocket event listeners
useEffect(() => {
  // ตั้งค่า translate function และ event listeners
  // ใช้เฉพาะ translate เป็น dependency
}, [translate]);
```

### 2. ใช้ useCallback
เพิ่ม `useCallback` สำหรับฟังก์ชันที่ใช้ใน useEffect เพื่อป้องกันการสร้างฟังก์ชันใหม่ทุกครั้ง:

```javascript
const fetchOrders = useCallback(async () => {
  // ... fetch logic
}, [temporaryId, translate]);

const fetchOrdersQuietly = useCallback(async () => {
  // ... fetch logic
}, [temporaryId, translate]);

const cleanupExpiredOrders = useCallback(() => {
  // ... cleanup logic
}, [translate]);

const removeCompletedOrderFromLocalStorage = useCallback((temporaryId) => {
  // ... removal logic
}, [translate]);
```

### 3. อัปเดต Dependencies
อัปเดต dependencies ของ useEffect ให้ถูกต้อง:

```javascript
useEffect(() => {
  cleanupExpiredOrders();
  fetchOrders();
}, [temporaryId, cleanupExpiredOrders, fetchOrders]);
```

## ผลลัพธ์

### ก่อนแก้ไข
- เมื่อเปลี่ยนภาษา → useEffect ทำงานใหม่ทั้งหมด
- WebSocket reconnect
- Polling restart
- Fetch ข้อมูลใหม่
- หน้าจอกระตุก 2 ครั้ง

### หลังแก้ไข
- เมื่อเปลี่ยนภาษา → เฉพาะ WebSocket event listeners เท่านั้นที่อัปเดต
- ไม่มีการ reconnect WebSocket
- ไม่มีการ restart polling
- ไม่มีการ fetch ข้อมูลใหม่
- หน้าจอไม่กระตุก

## การทดสอบ

1. เปิดหน้า `/guest-orders`
2. เปลี่ยนภาษา (ไทย → อังกฤษ → เกาหลี)
3. ตรวจสอบว่า:
   - หน้าจอไม่กระตุก
   - ไม่มีการ fetch ข้อมูลใหม่
   - WebSocket ยังเชื่อมต่ออยู่
   - การแปลข้อความทำงานปกติ

## หมายเหตุ

- การแก้ไขนี้ใช้หลักการ "Separation of Concerns" โดยแยกการทำงานของ WebSocket connection และ event handling
- ใช้ `useCallback` เพื่อ optimize performance และป้องกัน unnecessary re-renders
- การแก้ไขนี้ไม่กระทบต่อฟังก์ชันการทำงานอื่นๆ ของหน้า GuestOrders.jsx 