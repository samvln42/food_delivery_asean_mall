# Guest Orders Completed Removal - ลบออเดอร์ที่เสร็จสิ้นออกจาก localStorage

## สรุปการเปลี่ยนแปลง

### ฟีเจอร์ใหม่
เมื่อออเดอร์มีสถานะ "completed" หรือ "cancelled" ระบบจะลบ temporary_id ออกจาก localStorage โดยอัตโนมัติ ทำให้ออเดอร์นั้นหายไปจากหน้า GuestOrders.jsx

### การเปลี่ยนแปลงในโค้ด

#### 1. เพิ่มฟังก์ชัน `removeCompletedOrderFromLocalStorage`
```javascript
const removeCompletedOrderFromLocalStorage = (temporaryId) => {
  try {
    const guestOrdersData = localStorage.getItem("guest_orders");
    if (guestOrdersData) {
      const guestOrders = JSON.parse(guestOrdersData);
      
      // ลบ temporary_id ที่เสร็จสิ้นออกจาก localStorage
      const updatedOrders = guestOrders.filter(order => order.temporary_id !== temporaryId);
      
      if (updatedOrders.length !== guestOrders.length) {
        localStorage.setItem('guest_orders', JSON.stringify(updatedOrders));
        console.log(`✅ Removed completed order from localStorage: ${temporaryId}`);
        
        // แสดงการแจ้งเตือน
        setCleanupNotification({
          message: translate("order.completed_removed_message"),
          type: 'success'
        });
        
        // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
        setTimeout(() => {
          setCleanupNotification(null);
        }, 5000);
      }
    }
  } catch (error) {
    console.error("Error removing completed order from localStorage:", error);
  }
};
```

#### 2. อัปเดตฟังก์ชัน `fetchOrders` และ `fetchOrdersQuietly`
- เพิ่มการตรวจสอบสถานะออเดอร์
- เรียกใช้ `removeCompletedOrderFromLocalStorage` เมื่อสถานะเป็น "completed" หรือ "cancelled"
- ข้ามการเพิ่มออเดอร์ที่เสร็จสิ้นเข้าในรายการ

#### 3. อัปเดตฟังก์ชัน `handleOrderStatusUpdate`
- ตรวจสอบสถานะใหม่จาก WebSocket
- ลบ temporary_id ออกจาก localStorage และอัปเดตหน้าจอทันที
- แสดงการแจ้งเตือนเมื่อออเดอร์เสร็จสิ้น

### การแปลข้อความใหม่

#### ภาษาไทย
- `order.cleanup_expired_message`: "ลบคำสั่งซื้อที่หมดอายุแล้ว {count} รายการ"
- `order.cleanup_not_found_message`: "ลบคำสั่งซื้อที่ไม่พบแล้ว {count} รายการ"
- `order.completed_removed_message`: "คำสั่งซื้อเสร็จสิ้นแล้ว ถูกนำออกจากรายการ"

#### ภาษาอังกฤษ
- `order.cleanup_expired_message`: "Removed {count} expired orders"
- `order.cleanup_not_found_message`: "Removed {count} orders not found"
- `order.completed_removed_message`: "Order completed and removed from list"

#### ภาษาเกาหลี
- `order.cleanup_expired_message`: "만료된 주문 {count}개 제거됨"
- `order.cleanup_not_found_message`: "찾을 수 없는 주문 {count}개 제거됨"
- `order.completed_removed_message`: "주문 완료되어 목록에서 제거됨"

### การทำงาน

1. **เมื่อดึงข้อมูลออเดอร์**: ระบบตรวจสอบสถานะของแต่ละออเดอร์
2. **เมื่อสถานะเป็น "completed" หรือ "cancelled"**: 
   - ลบ temporary_id ออกจาก localStorage
   - แสดงการแจ้งเตือน
   - ไม่แสดงออเดอร์ในรายการ
3. **เมื่อได้รับ WebSocket update**: ตรวจสอบสถานะใหม่และดำเนินการทันที
4. **การแจ้งเตือน**: แสดงข้อความแจ้งเตือนเป็นเวลา 5 วินาที

### ประโยชน์

1. **ลดความสับสน**: ลูกค้าไม่เห็นออเดอร์ที่เสร็จสิ้นแล้ว
2. **ประหยัดพื้นที่**: ลดการใช้ localStorage
3. **ประสบการณ์ที่ดีขึ้น**: หน้าจอสะอาดขึ้น ไม่มีออเดอร์เก่า
4. **การจัดการที่ดีขึ้น**: ระบบจัดการข้อมูลได้มีประสิทธิภาพมากขึ้น

### การทดสอบ

1. สร้างออเดอร์ใหม่
2. เปลี่ยนสถานะเป็น "completed" หรือ "cancelled"
3. ตรวจสอบว่าออเดอร์หายไปจากหน้า GuestOrders.jsx
4. ตรวจสอบว่า temporary_id ถูกลบออกจาก localStorage
5. ตรวจสอบการแจ้งเตือน

### หมายเหตุ

- ฟีเจอร์นี้ทำงานเฉพาะกับ guest orders เท่านั้น
- ออเดอร์ที่เสร็จสิ้นจะหายไปทันที ไม่สามารถดูประวัติได้
- หากต้องการดูประวัติออเดอร์ที่เสร็จสิ้น ควรสร้างบัญชีและล็อกอิน 