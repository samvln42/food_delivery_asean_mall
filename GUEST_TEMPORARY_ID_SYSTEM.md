# ระบบการจัดการ Temporary ID สำหรับ Guest Orders

## ภาพรวม

ระบบนี้จัดการ Temporary ID สำหรับ Guest Orders โดยเก็บไว้ใน localStorage ชั่วคราวเพื่อให้ลูกค้าสามารถติดตามออเดอร์ได้ และลบออกอัตโนมัติเมื่อออเดอร์เสร็จสิ้นหรือหมดอายุ

## ฟีเจอร์หลัก

### 1. การเก็บ Temporary ID
- **ที่เก็บ**: localStorage ใน key `guest_orders`
- **โครงสร้างข้อมูล**:
```javascript
{
  temporary_id: "string",
  order_date: "ISO string",
  restaurant_name: "string",
  total_amount: number,
  status: "string"
}
```

### 2. การลบอัตโนมัติ
- **เมื่อออเดอร์เสร็จสิ้น**: ลบออกเมื่อสถานะเป็น `completed` หรือ `cancelled`
- **เมื่อหมดอายุ**: ลบออกหลังจาก 30 วัน
- **การลบด้วยตนเอง**: ลูกค้าสามารถลบได้จากหน้า Guest Orders

### 3. การอัปเดตสถานะ
- อัปเดตสถานะใน localStorage เมื่อมีการเปลี่ยนแปลง
- แสดงสถานะปัจจุบันในหน้า Guest Orders

## ไฟล์ที่เกี่ยวข้อง

### Frontend Components

#### 1. `GuestCart.jsx`
- **หน้าที่**: สร้าง guest order และเก็บ Temporary ID
- **การทำงาน**:
  ```javascript
  // เก็บ Temporary ID ใน localStorage
  const guestOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]');
  const newGuestOrder = {
    temporary_id: orderResult.temporary_id,
    order_date: new Date().toISOString(),
    restaurant_name: cartItems[0]?.restaurant_name || 'Unknown Restaurant',
    total_amount: total,
    status: 'pending'
  };
  guestOrders.push(newGuestOrder);
  localStorage.setItem('guest_orders', JSON.stringify(guestOrders));
  ```

#### 2. `GuestOrderTracking.jsx`
- **หน้าที่**: ติดตามออเดอร์และจัดการ Temporary ID
- **ฟังก์ชันหลัก**:
  - `removeTemporaryIdFromStorage()`: ลบ Temporary ID เมื่อออเดอร์เสร็จสิ้น
  - `updateOrderStatusInStorage()`: อัปเดตสถานะใน localStorage
  - ตรวจสอบสถานะและลบอัตโนมัติเมื่อเสร็จสิ้น

#### 3. `GuestOrders.jsx` (ใหม่)
- **หน้าที่**: แสดงประวัติ Guest Orders
- **ฟีเจอร์**:
  - แสดงรายการออเดอร์ที่ยังไม่เสร็จสิ้น
  - ลบออเดอร์ที่หมดอายุ (30 วัน) อัตโนมัติ
  - ลิงก์ไปยังหน้า tracking
  - ปุ่มลบออเดอร์ด้วยตนเอง

### Navigation

#### 1. `Header.jsx`
- เพิ่มลิงก์ "Guest Orders" สำหรับผู้ใช้ที่ไม่ได้ล็อกอิน

#### 2. `BottomNavigation.jsx`
- เพิ่มเมนู "Orders" สำหรับมือถือ

## การทำงานของระบบ

### 1. การสร้างออเดอร์
1. ลูกค้าสร้าง guest order ใน `GuestCart.jsx`
2. เมื่อสำเร็จ เก็บ Temporary ID ใน localStorage
3. นำทางไปหน้า tracking

### 2. การติดตามออเดอร์
1. หน้า `GuestOrderTracking.jsx` โหลดข้อมูลออเดอร์
2. ตรวจสอบสถานะและอัปเดต localStorage
3. ลบ Temporary ID เมื่อออเดอร์เสร็จสิ้น

### 3. การดูประวัติ
1. หน้า `GuestOrders.jsx` แสดงรายการออเดอร์
2. ลบออเดอร์ที่หมดอายุอัตโนมัติ
3. แสดงสถานะปัจจุบันของแต่ละออเดอร์

## การจัดการข้อมูล

### การเก็บข้อมูล
```javascript
// ตัวอย่างข้อมูลใน localStorage
[
  {
    temporary_id: "GUEST_123456",
    order_date: "2024-01-15T10:30:00.000Z",
    restaurant_name: "Pizza Place",
    total_amount: 450.00,
    status: "preparing"
  }
]
```

### การลบข้อมูล
```javascript
// ลบเมื่อเสร็จสิ้น
if (status === 'completed' || status === 'cancelled') {
  removeTemporaryIdFromStorage(temporaryId);
}

// ลบเมื่อหมดอายุ (30 วัน)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const validOrders = orders.filter(order => {
  const orderDate = new Date(order.order_date);
  return orderDate > thirtyDaysAgo;
});
```

## ข้อดีของระบบ

1. **ความสะดวก**: ลูกค้าไม่ต้องจำ Temporary ID
2. **ความปลอดภัย**: ลบข้อมูลอัตโนมัติเมื่อไม่จำเป็น
3. **การติดตาม**: แสดงสถานะปัจจุบันของออเดอร์
4. **การจัดการ**: ลูกค้าสามารถลบออเดอร์ที่ไม่ต้องการได้

## การบำรุงรักษา

### การลบข้อมูลอัตโนมัติ
- ระบบจะลบออเดอร์ที่หมดอายุทุกครั้งที่โหลดหน้า Guest Orders
- ออเดอร์ที่เสร็จสิ้นจะถูกลบทันที

### การตรวจสอบ
- ตรวจสอบ localStorage ผ่าน Developer Tools
- ดู console logs สำหรับการทำงานของระบบ

## การใช้งาน

### สำหรับลูกค้า
1. สร้าง guest order
2. ดูประวัติในหน้า "Guest Orders"
3. ติดตามออเดอร์ผ่านลิงก์ในรายการ
4. ลบออเดอร์ที่ไม่ต้องการ

### สำหรับผู้พัฒนา
1. ตรวจสอบ localStorage key `guest_orders`
2. ดู console logs สำหรับการทำงาน
3. ทดสอบการลบอัตโนมัติด้วยการเปลี่ยนวันที่

## การทดสอบ

### ทดสอบการสร้างออเดอร์
1. สร้าง guest order
2. ตรวจสอบ localStorage
3. ตรวจสอบการนำทางไปหน้า tracking

### ทดสอบการลบอัตโนมัติ
1. เปลี่ยนสถานะออเดอร์เป็น completed
2. ตรวจสอบการลบจาก localStorage
3. ทดสอบการลบเมื่อหมดอายุ

### ทดสอบการอัปเดตสถานะ
1. เปลี่ยนสถานะออเดอร์
2. ตรวจสอบการอัปเดตใน localStorage
3. ตรวจสอบการแสดงผลในหน้า Guest Orders 