# Guest Cart ItemCount Fix และการปรับปรุงระบบ Guest Order

## สรุปปัญหาและการแก้ไข

### ปัญหาเดิม
- itemCount ในตะกร้าไม่แสดงในมุมมองมือถือสำหรับระบบ Guest Order
- GuestCartContext ยังไม่สมบูรณ์เทียบกับ CartContext
- GuestCart.jsx ยังไม่เหมือนกับ Cart.jsx
- มีไฟล์แยกกันมากเกินไป (GuestProduct.jsx, Product.jsx)
- ต้องการลดจำนวนไฟล์โดยใช้หน้าหลักร่วมกัน

### การแก้ไขที่ทำ

#### 1. สร้าง GuestCartContext ที่สมบูรณ์
- คัดลอกฟีเจอร์ทั้งหมดจาก CartContext มาใส่ใน GuestCartContext
- รองรับการจัดการตะกร้าสำหรับผู้ใช้ไม่ล็อกอิน
- มีฟังก์ชันครบถ้วนเหมือน CartContext

#### 2. อัปเดต GuestCart.jsx ให้เหมือน Cart.jsx เป๊ะๆ
- คัดลอก Cart.jsx ทั้งหมดมาใส่ใน GuestCart.jsx
- ปรับให้ไม่ต้องล็อกอิน
- เพิ่มฟิลด์ข้อมูลลูกค้า (ชื่อ, เบอร์โทร, อีเมล)
- ใช้ GuestCartContext แทน CartContext
- ส่งคำสั่งซื้อไปยัง `/guest-orders/` endpoint

#### 3. สร้าง Product.jsx ที่รวมฟังก์ชันทั้งสองระบบ
- ใช้ `isAuthenticated` เพื่อเลือก context และ routing ที่เหมาะสม
- รองรับทั้งระบบล็อกอินและไม่ล็อกอิน
- ลดจำนวนไฟล์โดยรวม GuestProduct.jsx เข้าด้วยกัน

#### 4. อัปเดต AllProducts.jsx ให้ใช้ร่วมกัน
- ใช้ `isAuthenticated` เพื่อเลือก context ที่เหมาะสม
- ลิงก์ไปยัง Product.jsx เดียวสำหรับทั้งสองระบบ
- ใช้ CartContext หรือ GuestCartContext ตามสถานะการล็อกอิน

#### 5. อัปเดต CategoryDetail.jsx ให้ใช้ร่วมกัน
- ใช้ `isAuthenticated` เพื่อเลือก context ที่เหมาะสม
- ใช้ CartContext หรือ GuestCartContext ตามสถานะการล็อกอิน

#### 6. อัปเดต Header และ BottomNavigation
- ใช้ GuestCartContext สำหรับการแสดง itemCount
- แยกการจัดการระหว่างระบบล็อกอินและไม่ล็อกอิน

#### 7. ลบไฟล์ที่ไม่จำเป็น
- ลบ GuestProduct.jsx (รวมเข้ากับ Product.jsx แล้ว)
- อัปเดต routing ใน App.jsx

## ฟีเจอร์ที่เหมือนกันระหว่าง Cart และ GuestCart

### ฟีเจอร์หลัก (13 ข้อ)
1. ✅ แสดงสินค้าแยกตามร้าน
2. ✅ แสดงข้อมูลหลายร้าน (Multi-Restaurant Info)
3. ✅ แจ้งเตือนร้านปิด (Closed Restaurant Warning)
4. ✅ ปุ่มเพิ่ม/ลดจำนวนสินค้า
5. ✅ ปุ่มลบสินค้า
6. ✅ ปุ่มลบตะกร้าทั้งหมด
7. ✅ แสดงที่อยู่จัดส่ง
8. ✅ แสดง Special Instructions
9. ✅ แสดงข้อมูลการชำระเงิน
10. ✅ รองรับ Bank Transfer และ QR Payment
11. ✅ อัปโหลดหลักฐานการโอน
12. ✅ แสดง Order Summary
13. ✅ ปุ่ม Checkout พร้อมการตรวจสอบเงื่อนไข

### ฟังก์ชันการทำงาน (11 ฟังก์ชัน)
1. ✅ updateQuantity - อัปเดตจำนวนสินค้า
2. ✅ removeItem - ลบสินค้า
3. ✅ clearCart - ลบตะกร้าทั้งหมด
4. ✅ getItemsByRestaurant - จัดกลุ่มสินค้าตามร้าน
5. ✅ getRestaurantCount - นับจำนวนร้าน
6. ✅ ตรวจสอบสถานะร้าน
7. ✅ คำนวณค่าจัดส่ง
8. ✅ ตรวจสอบเงื่อนไขการสั่งซื้อ
9. ✅ ส่งคำสั่งซื้อ
10. ✅ แสดงข้อความแจ้งเตือน
11. ✅ นำทางไปหน้าต่างๆ

## ความแตกต่างหลัก

### ระบบหลัก (Cart)
- ต้องล็อกอิน
- ใช้ user ID จากระบบ
- ส่งคำสั่งซื้อไป `/orders/multi/` หรือ `/orders/`
- ใช้ CartContext

### ระบบ Guest (GuestCart)
- ไม่ต้องล็อกอิน
- ใช้ข้อมูลลูกค้าที่กรอก
- ส่งคำสั่งซื้อไป `/guest-orders/`
- ใช้ GuestCartContext
- ใช้ Temporary ID แทน Order ID

## การปรับปรุงโครงสร้างไฟล์

### ไฟล์ที่ใช้ร่วมกัน
- **AllProducts.jsx** - หน้าสินค้าหลัก ใช้ร่วมกันทั้งสองระบบ
- **Product.jsx** - หน้ารายละเอียดสินค้า ใช้ร่วมกันทั้งสองระบบ
- **Categories.jsx** - หน้าหมวดหมู่ ใช้ร่วมกันทั้งสองระบบ
- **CategoryDetail.jsx** - หน้ารายละเอียดหมวดหมู่ ใช้ร่วมกันทั้งสองระบบ

### ไฟล์ที่แยกกัน
- **Cart.jsx** - หน้าตะกร้าสำหรับผู้ใช้ล็อกอิน
- **GuestCart.jsx** - หน้าตะกร้าสำหรับผู้ใช้ไม่ล็อกอิน

### ไฟล์ที่ถูกลบ
- **GuestProduct.jsx** - รวมเข้ากับ Product.jsx แล้ว

## การทำงานของระบบ

### หน้าหลักที่ใช้ร่วมกัน
1. **AllProducts.jsx** - ใช้ `isAuthenticated` เพื่อเลือก context
2. **Product.jsx** - ใช้ `isAuthenticated` เพื่อเลือก context และ routing
3. **Categories.jsx** - ไม่ต้องปรับปรุง (ไม่มีส่วนที่เกี่ยวข้องกับการล็อกอิน)
4. **CategoryDetail.jsx** - ใช้ `isAuthenticated` เพื่อเลือก context

### การเลือก Context
```javascript
// เลือก context ตามสถานะการล็อกอิน
const { addItem: addToCart } = useCart();
const { addItem: addToGuestCart } = useGuestCart();
const addItem = isAuthenticated ? addToCart : addToGuestCart;
```

### การเลือก Routing
```javascript
// ลิงก์ไปยังหน้าเดียวกัน
<Link to={`/products/${product.product_id}`}>

// แต่ใน Product.jsx จะเลือก context ตามสถานะการล็อกอิน
```

## การทดสอบ

### ทดสอบการเพิ่มสินค้า
1. ไปที่หน้า AllProducts หรือ CategoryDetail
2. เลือกสินค้าและกดปุ่ม "Add to Cart"
3. ตรวจสอบว่า itemCount เพิ่มขึ้นใน Header และ BottomNavigation
4. ทดสอบทั้งระบบล็อกอินและไม่ล็อกอิน

### ทดสอบการสั่งซื้อ
1. ไปที่หน้า Cart หรือ GuestCart
2. กรอกข้อมูลที่จำเป็น
3. อัปโหลดหลักฐานการโอน
4. กดปุ่ม "Place Order"
5. ตรวจสอบว่าได้รับ Order ID หรือ Temporary ID

## สถานะปัจจุบัน
✅ **เสร็จสิ้น** - ระบบ Guest Order พร้อมใช้งานแล้ว
- GuestCart เหมือนกับ Cart เป๊ะๆ แต่ไม่ต้องล็อกอิน
- itemCount แสดงถูกต้องทั้งใน Header และ BottomNavigation
- ฟีเจอร์ครบถ้วนเหมือนระบบหลัก
- การสั่งซื้อทำงานได้ปกติ
- ลดจำนวนไฟล์โดยรวมหน้า Product เข้าด้วยกัน
- AllProducts.jsx และ Categories.jsx ใช้ร่วมกันได้ทั้งสองระบบ
- ใช้แค่หน้าหลักร่วมกัน: AllProducts, Product, Categories, CategoryDetail

## ไฟล์ที่เกี่ยวข้อง
- `frontend/src/contexts/GuestCartContext.jsx` - Context สำหรับจัดการตะกร้าไม่ล็อกอิน
- `frontend/src/pages/customer/GuestCart.jsx` - หน้าตะกร้าสำหรับไม่ล็อกอิน
- `frontend/src/pages/customer/Product.jsx` - หน้ารายละเอียดสินค้า (ใช้ร่วมกัน)
- `frontend/src/pages/customer/AllProducts.jsx` - หน้าสินค้าหลัก (ใช้ร่วมกัน)
- `frontend/src/pages/customer/Categories.jsx` - หน้าหมวดหมู่ (ใช้ร่วมกัน)
- `frontend/src/pages/customer/CategoryDetail.jsx` - หน้ารายละเอียดหมวดหมู่ (ใช้ร่วมกัน)
- `frontend/src/components/common/Header.jsx` - แสดง itemCount
- `frontend/src/components/common/BottomNavigation.jsx` - แสดง itemCount

## หมายเหตุ
- ระบบ Guest Order ใช้ Temporary ID แยกจากระบบหลัก
- ไม่มีการเชื่อมโยงกับ user account
- ข้อมูลลูกค้าจะถูกเก็บในฐานข้อมูลแยก
- การติดตามคำสั่งซื้อใช้ Temporary ID แทน Order ID
- ลดจำนวนไฟล์โดยรวมหน้า Product เข้าด้วยกัน
- ใช้แค่หน้าหลักร่วมกัน: AllProducts, Product, Categories, CategoryDetail
- Cart แยกกันเหมือนเดิม: Cart.jsx และ GuestCart.jsx 