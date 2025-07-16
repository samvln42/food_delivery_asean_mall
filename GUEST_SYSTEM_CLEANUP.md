# Guest System Cleanup - ลบ Guest Components ที่ไม่จำเป็น

## สรุปการเปลี่ยนแปลง

### ลบไฟล์ที่ไม่จำเป็น
- `frontend/src/pages/customer/Product.jsx` - ลบออกเพราะ AllProducts.jsx ใช้ร่วมกันได้แล้ว

### ลบ Routes ที่ไม่จำเป็น
- ลบ route `/products/:productId` ออกจาก App.jsx
- ลบ import Product จาก App.jsx

### Guest Components ที่เหลือ (จำเป็น)
1. **GuestCart.jsx** - หน้าตะกร้าสำหรับผู้ใช้ไม่ล็อกอิน
2. **GuestOrderTracking.jsx** - หน้าติดตามออเดอร์สำหรับผู้ใช้ไม่ล็อกอิน
3. **GuestCartContext.jsx** - Context สำหรับจัดการตะกร้าผู้ใช้ไม่ล็อกอิน

### หน้าที่ใช้ร่วมกัน (Shared Components)
1. **AllProducts.jsx** - หน้าสินค้าทั้งหมด
   - ใช้ `useCart()` สำหรับผู้ใช้ล็อกอิน
   - ใช้ `useGuestCart()` สำหรับผู้ใช้ไม่ล็อกอิน
   - เลือก context ตาม `isAuthenticated`

2. **CategoryDetail.jsx** - หน้าหมวดหมู่
   - ใช้ `useCart()` สำหรับผู้ใช้ล็อกอิน
   - ใช้ `useGuestCart()` สำหรับผู้ใช้ไม่ล็อกอิน
   - เลือก context ตาม `isAuthenticated`

3. **RestaurantDetail.jsx** - รายละเอียดร้านค้า
   - ใช้ `useCart()` สำหรับผู้ใช้ล็อกอิน
   - ใช้ `useGuestCart()` สำหรับผู้ใช้ไม่ล็อกอิน
   - เลือก context ตาม `isAuthenticated`

3. **Header.jsx** - ส่วนหัว
   - แสดง itemCount ตามสถานะล็อกอิน
   - ลิงก์ไป `/cart` สำหรับผู้ใช้ล็อกอิน
   - ลิงก์ไป `/guest-cart` สำหรับผู้ใช้ไม่ล็อกอิน

4. **BottomNavigation.jsx** - เมนูด้านล่าง
   - แสดง itemCount ตามสถานะล็อกอิน
   - ลิงก์ไป `/cart` สำหรับผู้ใช้ล็อกอิน
   - ลิงก์ไป `/guest-cart` สำหรับผู้ใช้ไม่ล็อกอิน

### หน้าอื่นๆ ที่ใช้ร่วมกัน
- **Home.jsx** - หน้าหลัก
- **Categories.jsx** - หน้าหมวดหมู่
- **Restaurants.jsx** - หน้าร้านค้า
- **Search.jsx** - หน้าค้นหา
- **About.jsx** - หน้าเกี่ยวกับ
- **Contact.jsx** - หน้าติดต่อ

### หน้าที่ต้องล็อกอิน (Protected Routes)
- **Cart.jsx** - ตะกร้าสำหรับผู้ใช้ล็อกอิน
- **Orders.jsx** - ประวัติออเดอร์
- **Profile.jsx** - โปรไฟล์
- **Notifications.jsx** - การแจ้งเตือน
- **Settings.jsx** - การตั้งค่า

## การทำงานของระบบ

### สำหรับผู้ใช้ล็อกอิน
1. ใช้ `CartContext` สำหรับจัดการตะกร้า
2. ข้อมูลตะกร้าบันทึกในฐานข้อมูล
3. สามารถดูประวัติออเดอร์ได้
4. เข้าถึงหน้าต่างๆ ที่ต้องล็อกอินได้

### สำหรับผู้ใช้ไม่ล็อกอิน (Guest)
1. ใช้ `GuestCartContext` สำหรับจัดการตะกร้า
2. ข้อมูลตะกร้าบันทึกใน localStorage
3. สั่งซื้อผ่าน Guest Order System
4. ติดตามออเดอร์ด้วย Temporary ID
5. เข้าถึงหน้าทั่วไปได้ แต่ไม่สามารถเข้าหน้าที่ต้องล็อกอินได้

## ประโยชน์ของการเปลี่ยนแปลง

1. **ลดความซ้ำซ้อน** - ลบไฟล์ที่ไม่จำเป็นออก
2. **ง่ายต่อการบำรุงรักษา** - หน้าหลักใช้ร่วมกันได้
3. **ประสบการณ์ผู้ใช้ที่ดีขึ้น** - ไม่ต้องสร้างหน้าซ้ำๆ
4. **ประสิทธิภาพดีขึ้น** - ลดขนาดโค้ดและไฟล์

## สถานะปัจจุบัน

✅ **เสร็จสิ้น** - ระบบพร้อมใช้งาน
- Guest Cart และ Guest Order Tracking ทำงานได้ปกติ
- หน้าหลักใช้ร่วมกันได้
- การแสดง itemCount ทำงานได้ทั้งสองระบบ
- การเพิ่มสินค้าลงตะกร้าทำงานได้ทั้งสองระบบ

## การแก้ไขปัญหา

### ปัญหาที่พบ
1. **CategoryDetail.jsx** มีการตรวจสอบ `isAuthenticated` ในปุ่มและลิงก์ไปหน้าล็อกอิน
2. **การตรวจสอบ `restaurant_status`** ไม่ถูกต้อง ควรใช้ `restaurant.status`

### การแก้ไข
1. **ลบการตรวจสอบ `isAuthenticated`** ออกจากปุ่มใน CategoryDetail.jsx และ RestaurantDetail.jsx
2. **แก้ไขการตรวจสอบสถานะร้าน** ให้ใช้ `product.restaurant_status` field จาก API แทน `product.restaurant.status`
3. **เปลี่ยนการแจ้งเตือน** จาก toast เป็น alert ใน AllProducts.jsx
4. **ให้ระบบเลือก context ตามสถานะล็อกอิน** โดยอัตโนมัติ:
   - ผู้ใช้ล็อกอิน → ใช้ CartContext (จะ redirect ไปล็อกอินถ้าจำเป็น)
   - ผู้ใช้ไม่ล็อกอิน → ใช้ GuestCartContext (เพิ่มลง Guest Cart ได้เลย)

### ผลลัพธ์
- **ผู้ใช้ล็อกอิน**: เพิ่มสินค้าลงตะกร้าปกติ
- **ผู้ใช้ไม่ล็อกอิน**: เพิ่มสินค้าลง Guest Cart ได้เลย ไม่ต้องล็อกอิน
- **การแสดงสถานะร้าน**: ถูกต้องและแม่นยำ
- **การแจ้งเตือน**: ใช้ alert แทน toast ในทุกหน้า (AllProducts, CategoryDetail, RestaurantDetail) 