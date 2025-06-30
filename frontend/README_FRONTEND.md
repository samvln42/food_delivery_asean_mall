# 🍕 Food Delivery Frontend

React + Vite frontend application สำหรับระบบสั่งอาหารออนไลน์

## 🚀 ฟีเจอร์ที่พร้อมใช้งาน

### ✅ ระบบ Authentication
- 🔐 เข้าสู่ระบบ (Login)
- 📝 สมัครสมาชิก (Register) 
- 🚪 ออกจากระบบ (Logout)
- 🔒 Protected Routes ตามบทบาทผู้ใช้
- 🎭 Role-based Navigation

### ✅ หน้าแรกลูกค้า (Customer Home)
- 🏠 Hero Section
- 🍽️ หมวดหมู่อาหาร
- ⭐ ร้านอาหารแนะนำ (Special Restaurants)
- 🔥 ร้านอาหารยอดนิยม
- 💡 ฟีเจอร์เด่นของระบบ

### ✅ Layout Components
- 👤 CustomerLayout (สำหรับลูกค้า)
- 🏪 RestaurantLayout (สำหรับร้านอาหาร)
- 👨‍💼 AdminLayout (สำหรับแอดมิน)

### ✅ Shared Components
- 🧭 Header พร้อม Navigation
- ⏳ Loading Component
- 🚫 Error Pages (404, 403)

## 🛠️ เทคโนโลยีที่ใช้

- **React 18** - Frontend Framework
- **Vite** - Build Tool & Dev Server
- **React Router Dom** - Client-side Routing
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling Framework
- **Context API** - State Management

## 📁 โครงสร้างโปรเจค

```
frontend/
├── 📂 src/
│   ├── 📂 components/
│   │   └── 📂 common/
│   │       ├── Header.jsx
│   │       └── Loading.jsx
│   ├── 📂 contexts/
│   │   └── AuthContext.jsx
│   ├── 📂 layouts/
│   │   ├── CustomerLayout.jsx
│   │   ├── RestaurantLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── 📂 pages/
│   │   ├── 📂 auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── 📂 customer/
│   │   │   └── Home.jsx
│   │   └── 📂 errors/
│   │       ├── NotFound.jsx
│   │       └── Unauthorized.jsx
│   ├── 📂 services/
│   │   └── api.js
│   ├── 📂 config/
│   │   └── api.js
│   ├── 📂 utils/
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── 📄 package.json
├── 📄 tailwind.config.js
├── 📄 postcss.config.js
└── 📄 vite.config.js
```

## ⚙️ การติดตั้งและใช้งาน

### 1. ติดตั้ง Dependencies
```bash
cd frontend
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์ frontend:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. เริ่มต้น Development Server
```bash
npm run dev
```

### 4. เปิดในเบราว์เซอร์
```
http://localhost:5173
```

## 🔐 บทบาทผู้ใช้ (User Roles)

### 👤 Customer (ลูกค้า)
- ✅ หน้าแรก
- 🔄 รายการร้านอาหาร (กำลังพัฒนา)
- 🔄 ตะกร้าสินค้า (กำลังพัฒนา)
- 🔄 ประวัติการสั่งซื้อ (กำลังพัฒนา)
- 🔄 โปรไฟล์ (กำลังพัฒนา)

### 🏪 Restaurant Owner (เจ้าของร้าน)
- 🔄 แดชบอร์ดร้านอาหาร (กำลังพัฒนา)
- 🔄 จัดการคำสั่งซื้อ (กำลังพัฒนา)
- 🔄 จัดการเมนู (กำลังพัฒนา)

### 👨‍💼 Admin (ผู้ดูแลระบบ)
- 🔄 แดชบอร์ดแอดมิน (กำลังพัฒนา)
- 🔄 จัดการผู้ใช้งาน (กำลังพัฒนา)
- 🔄 จัดการร้านอาหาร (กำลังพัฒนา)

## 🎨 การใช้งาน Tailwind CSS

### Custom Classes ที่สร้างไว้:
```css
.btn-primary      /* ปุ่มหลัก */
.btn-secondary    /* ปุ่มรอง */
.input-field      /* ช่องกรอกข้อมูล */
.card            /* การ์ด */
.loading-spinner  /* Loading animation */
```

### Color Palette:
- **Primary**: Red shades (#ef4444)
- **Secondary**: Gray shades (#64748b)
- **Font**: Sarabun, Noto Sans Thai

## 🔌 API Integration

### Services Available:
- `authService` - การจัดการ Authentication
- `restaurantService` - ข้อมูลร้านอาหาร
- `productService` - ข้อมูลสินค้า
- `categoryService` - หมวดหมู่อาหาร
- `orderService` - คำสั่งซื้อ
- `reviewService` - รีวิว
- และอื่นๆ

### ตัวอย่างการใช้งาน:
```javascript
import { restaurantService } from '../services/api';

// ดึงข้อมูลร้านอาหาร
const restaurants = await restaurantService.getAll();

// ดึงข้อมูลร้านพิเศษ
const specialRestaurants = await restaurantService.getSpecial();
```

## 🚧 หน้าที่กำลังพัฒนา

### Customer Pages:
- 🔄 Restaurant Listing
- 🔄 Restaurant Detail
- 🔄 Product Detail
- 🔄 Shopping Cart
- 🔄 Checkout
- 🔄 Order Tracking
- 🔄 Profile Management
- 🔄 Order History
- 🔄 Favorites
- 🔄 Search Results

### Restaurant Pages:
- 🔄 Dashboard
- 🔄 Order Management
- 🔄 Menu Management
- 🔄 Analytics
- 🔄 Restaurant Profile

### Admin Pages:
- 🔄 Admin Dashboard
- 🔄 User Management
- 🔄 Restaurant Management
- 🔄 Order Monitoring
- 🔄 Analytics & Reports

## 📝 การพัฒนาต่อ

### 1. เพิ่มหน้าใหม่:
```javascript
// สร้างไฟล์ component ใหม่
// เพิ่ม route ใน App.jsx
// อัปเดต navigation menu
```

### 2. เพิ่ม API Service:
```javascript
// เพิ่มใน src/services/api.js
// สร้าง custom hook สำหรับ data fetching
```

### 3. เพิ่ม Shared Component:
```javascript
// สร้างใน src/components/common/
// Import และใช้งานในหน้าต่างๆ
```

## 🎯 เป้าหมายถัดไป

- [ ] เพิ่มหน้า Restaurant Listing พร้อม Filters
- [ ] สร้างระบบ Shopping Cart
- [ ] เพิ่มการ Integration กับ Google Maps
- [ ] สร้างระบบ Real-time Notifications
- [ ] เพิ่ม Google OAuth Integration
- [ ] เพิ่ม PWA Features
- [ ] เพิ่ม Unit Tests

## 🤝 การมีส่วนร่วม

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไป branch
5. สร้าง Pull Request

---

**Last Updated:** 25 มิถุนายน 2025  
**Version:** 1.0.0 - Initial Release  
**Developer:** AI Assistant 