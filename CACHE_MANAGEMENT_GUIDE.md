# Translation Cache Management Guide
## คู่มือการจัดการ Cache คำแปลภาษา

---

## 🎯 ภาพรวม

ระบบใช้ **Multi-layer Caching** เพื่อเพิ่มความเร็ว:
1. **Memory Cache** - เก็บใน RAM (instant access)
2. **localStorage Cache** - เก็บใน browser (< 0.3 วินาที)

แต่เมื่อ **Admin อัพเดทคำแปล** ใน database ผู้ใช้จะยังเห็นคำเก่า จึงต้องมีระบบจัดการ cache

---

## 🔄 Cache Management System

### **1. Cache Versioning**
```javascript
const CACHE_VERSION = 'v1.0';  // เปลี่ยนเป็น v1.1, v1.2 เมื่ออัพเดท
```

**วิธีใช้:**
- เมื่อ Admin อัพเดทคำแปล → เปลี่ยน `CACHE_VERSION` ใน `LanguageContext.jsx`
- ผู้ใช้จะโหลดคำแปลใหม่อัตโนมัติ (cache version ไม่ตรงกัน)

**ตัวอย่าง:**
```javascript
// frontend/src/contexts/LanguageContext.jsx
const CACHE_VERSION = 'v1.1';  // เปลี่ยนจาก v1.0 → v1.1
```

### **2. Cache Expiration**
```javascript
const CACHE_EXPIRY_DAYS = 7;  // Cache หมดอายุใน 7 วัน
```

Cache จะหมดอายุอัตโนมัติหลัง 7 วัน และโหลดใหม่

### **3. Manual Clear Cache**
ใช้ component `CacheManager` หรือเรียก `clearCache()` function

---

## 📋 วิธีการใช้งาน

### **สถานการณ์ 1: Admin อัพเดทคำแปลเล็กน้อย**

**วิธี: เปลี่ยน Cache Version**

1. แก้ไขคำแปลใน database (ผ่าน Django Admin หรือ SQL)

2. เปิดไฟล์ `frontend/src/contexts/LanguageContext.jsx`

3. เปลี่ยน `CACHE_VERSION`:
```javascript
// เดิม
const CACHE_VERSION = 'v1.0';

// ใหม่
const CACHE_VERSION = 'v1.1';
```

4. Build & Deploy frontend:
```bash
cd frontend
npm run build
# หรือ
npm run dev
```

5. ✅ ผู้ใช้โหลดหน้าใหม่ → เห็นคำแปลใหม่ทันที

---

### **สถานการณ์ 2: Admin อัพเดทคำแปลจำนวนมาก**

**วิธี: ใช้ CacheManager Component**

1. เพิ่ม `CacheManager` ในหน้า Admin Settings:

```jsx
// frontend/src/pages/admin/AdminSettings.jsx
import CacheManager from '../../components/common/CacheManager';

const AdminSettings = () => {
  return (
    <div>
      <h1>Settings</h1>
      
      {/* Cache Management */}
      <CacheManager />
      
      {/* Other settings... */}
    </div>
  );
};
```

2. Admin เปิดหน้า Settings

3. คลิก "🗑️ Clear Cache"

4. ✅ Cache ถูกล้างและหน้าโหลดใหม่

---

### **สถานการณ์ 3: ผู้ใช้เจอปัญหาคำแปลไม่อัพเดท**

**วิธี: ใช้ Browser Console**

1. เปิด DevTools (F12)

2. ไปที่ Console tab

3. พิมพ์:
```javascript
// ล้าง cache
localStorage.clear();
location.reload();

// หรือล้างเฉพาะ translations
localStorage.removeItem('translations_th');
localStorage.removeItem('translations_en');
localStorage.removeItem('translations_ko');
location.reload();
```

4. ✅ หน้าโหลดคำแปลใหม่

---

## 🔍 ตรวจสอบ Cache

### **วิธีที่ 1: ใช้ CacheManager Component**
```jsx
<CacheManager />
```
คลิก "🔍 Show Cache Info" เพื่อดู:
- Version number
- จำนวนคำแปล
- วันที่ cache
- อายุ cache

### **วิธีที่ 2: ใช้ Console**
```javascript
// ดูข้อมูล cache
const { getCacheInfo } = useLanguage();
console.log(getCacheInfo());

// Output:
// {
//   th: { version: 'v1.0', entries: 920, daysOld: 2 },
//   en: { version: 'v1.0', entries: 920, daysOld: 2 },
//   ko: { version: 'v1.0', entries: 920, daysOld: 2 }
// }
```

### **วิธีที่ 3: ใช้ Browser DevTools**
1. เปิด DevTools (F12)
2. ไปที่ Application tab
3. เลือก Local Storage → `http://your-domain`
4. หา keys: `translations_th`, `translations_en`, `translations_ko`
5. ดูข้อมูล JSON

---

## 🛠️ API สำหรับ Developers

### **clearCache()**
ล้าง cache ทั้งหมดและ reload หน้า

```javascript
import { useLanguage } from './contexts/LanguageContext';

const MyComponent = () => {
  const { clearCache } = useLanguage();
  
  return (
    <button onClick={clearCache}>
      Clear Cache
    </button>
  );
};
```

### **getCacheInfo()**
ดูข้อมูล cache

```javascript
const { getCacheInfo } = useLanguage();
const info = getCacheInfo();
console.log(info);
```

### **cacheVersion**
ดู version ปัจจุบัน

```javascript
const { cacheVersion } = useLanguage();
console.log(`Current version: ${cacheVersion}`);
```

---

## 📊 Cache Flow

```
ผู้ใช้โหลดหน้า
     ↓
ตรวจสอบ Memory Cache
     ├─> มี → ใช้ทันที (< 0.1s)
     └─> ไม่มี
          ↓
     ตรวจสอบ localStorage
          ├─> มี
          │    ↓
          │   ตรวจสอบ Version
          │    ├─> ตรงกัน
          │    │    ↓
          │    │   ตรวจสอบวันหมดอายุ
          │    │    ├─> ยังไม่หมดอายุ → ใช้ cache (< 0.3s) ✅
          │    │    └─> หมดอายุ → ลบ cache, โหลดใหม่
          │    └─> ไม่ตรงกัน → ลบ cache, โหลดใหม่
          └─> ไม่มี → เรียก API (2-3s)
               ↓
          บันทึก cache พร้อม version + timestamp
```

---

## ⚠️ สิ่งที่ต้องระวัง

### **1. ไม่ควร Clear Cache บ่อยเกินไป**
- ทำให้ผู้ใช้ต้องโหลดข้อมูล 920 entries ใหม่ (2-3 วินาที)
- แนะนำ: ใช้เฉพาะเมื่อมีการอัพเดทสำคัญ

### **2. Version Number ต้องเพิ่มทุกครั้ง**
```javascript
// ❌ ผิด - ใช้ version เดิม
const CACHE_VERSION = 'v1.0';  // ไม่เปลี่ยน

// ✅ ถูก - เพิ่ม version
const CACHE_VERSION = 'v1.1';  // เปลี่ยนแล้ว
```

### **3. ต้อง Build & Deploy หลังเปลี่ยน Version**
```bash
# Build
npm run build

# Deploy
# ... deploy steps ...
```

---

## 🎓 Best Practices

### **1. กำหนด Version Naming Convention**
```
v1.0 = Initial release
v1.1 = Minor translation updates
v1.2 = More minor updates
v2.0 = Major translation overhaul
```

### **2. เก็บ Changelog**
```javascript
// LanguageContext.jsx
const CACHE_VERSION = 'v1.2';  // 2025-01-10: Added Korean translations
const CACHE_EXPIRY_DAYS = 7;
```

### **3. ทดสอบก่อน Deploy**
```bash
# 1. เปลี่ยน version
# 2. Test local
npm run dev

# 3. Clear cache และทดสอบ
localStorage.clear()
location.reload()

# 4. ตรวจสอบว่าโหลดคำแปลใหม่
# 5. Build & Deploy
```

### **4. แจ้งผู้ใช้เมื่อมีการอัพเดท (Optional)**
```jsx
// แสดง notification
const CacheUpdateNotification = () => {
  const { cacheVersion } = useLanguage();
  const lastSeenVersion = localStorage.getItem('lastSeenCacheVersion');
  
  if (cacheVersion !== lastSeenVersion) {
    return (
      <div className="notification">
        🎉 Translations updated! 
        <button onClick={() => {
          localStorage.setItem('lastSeenCacheVersion', cacheVersion);
        }}>
          Got it
        </button>
      </div>
    );
  }
  return null;
};
```

---

## 📝 Checklist: อัพเดทคำแปล

### **สำหรับ Admin:**
- [ ] อัพเดทคำแปลใน database
- [ ] เปลี่ยน `CACHE_VERSION` ใน `LanguageContext.jsx`
- [ ] Test ใน development mode
- [ ] Build frontend
- [ ] Deploy ไปยัง production
- [ ] ทดสอบว่าผู้ใช้เห็นคำแปลใหม่
- [ ] (Optional) Clear cache ในหน้า Admin Settings

### **สำหรับ Developers:**
- [ ] Pull latest code
- [ ] Check `CACHE_VERSION` number
- [ ] Clear local cache
- [ ] Test translations
- [ ] Commit & Push

---

## 🔗 Related Files

- `frontend/src/contexts/LanguageContext.jsx` - Main cache logic
- `frontend/src/components/common/CacheManager.jsx` - Cache UI component
- `frontend/src/utils/translationHelpers.js` - Helper functions
- `TRANSLATION_OPTIMIZATION_GUIDE.md` - Performance guide

---

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ Console logs (F12)
2. ดู Cache Info ผ่าน CacheManager
3. ลอง Clear cache
4. ตรวจสอบ CACHE_VERSION
5. ติดต่อ Development Team

---

**สร้างโดย:** Translation Optimization System  
**อัพเดทล่าสุด:** 2025-01-09  
**Version:** 1.0

