# Fix: หน้า Manage Entertainment Venues ไม่เปลี่ยนภาษาตามภาษาที่เลือก

**วันที่:** 2026-04-23

---

## ปัญหาที่พบ

หน้า Admin > Manage Entertainment Venues แสดงชื่อและคำอธิบายของสถานที่เป็นภาษาเดิมเสมอ (ภาษา default) ไม่เปลี่ยนตามภาษาที่ผู้ใช้เลือกจาก Language Switcher

---

## สาเหตุ

มี 2 จุดที่ทำให้เกิดปัญหา:

1. **`frontend/src/services/api.js`** — Request interceptor จะเพิ่ม `?lang=<code>` ให้กับ API call อัตโนมัติเฉพาะ endpoint `/products`, `/categories`, `/restaurants` แต่ไม่รวม `/entertainment-venues` ทำให้ backend ส่งข้อมูล translation ของทุกภาษากลับมา แทนที่จะส่งเฉพาะภาษาที่เลือก

2. **`frontend/src/pages/admin/AdminEntertainmentVenues.jsx`** — Component แสดงผล `venue.venue_name` และ `venue.description` ตรงๆ โดยไม่ผ่าน translation helper และไม่มี `currentLanguage` เป็น dependency ของ `useEffect` ที่ดึงข้อมูล ทำให้ไม่ re-fetch เมื่อเปลี่ยนภาษา

---

## สิ่งที่แก้ไข

### 1. `frontend/src/services/api.js`

เพิ่ม `/entertainment-venues` ใน array ของ endpoints ที่ต้องการ `lang` parameter:

```js
// ก่อน
const needsLanguage = [
  '/products',
  '/categories',
  '/restaurants'
].some(endpoint => config.url.includes(endpoint));

// หลัง
const needsLanguage = [
  '/products',
  '/categories',
  '/restaurants',
  '/entertainment-venues'        // ← เพิ่ม
].some(endpoint => config.url.includes(endpoint));
```

### 2. `frontend/src/pages/admin/AdminEntertainmentVenues.jsx`

**เพิ่ม import** helper function:
```js
import { getTranslatedName, getTranslatedDescription } from '../../utils/translationHelpers';
```

**เพิ่ม `currentLanguage`** ใน `useLanguage()` destructure:
```js
const { translate, availableLanguages, currentLanguage } = useLanguage();
```

**เพิ่ม `currentLanguage`** เป็น dependency ของ `useEffect` ที่ fetch ข้อมูล เพื่อให้ re-fetch เมื่อเปลี่ยนภาษา:
```js
}, [searchTerm, statusFilter, typeFilter, currentLanguage]);
```

**แทนที่การแสดงผลชื่อ/คำอธิบาย** ใน 3 จุด ด้วย helper function:

| จุด | ก่อน | หลัง |
|-----|------|------|
| Desktop table | `{venue.venue_name}` | `{getTranslatedName(venue, currentLanguage, venue.venue_name)}` |
| Desktop table | `{venue.description}` | `{getTranslatedDescription(venue, currentLanguage, venue.description)}` |
| Mobile card | `{venue.venue_name}` | `{getTranslatedName(venue, currentLanguage, venue.venue_name)}` |
| Mobile card | `{venue.description}` | `{getTranslatedDescription(venue, currentLanguage, venue.description)}` |
| View modal | `{selectedVenue.venue_name}` | `{getTranslatedName(selectedVenue, currentLanguage, selectedVenue.venue_name)}` |
| View modal | `{selectedVenue.description}` | `{getTranslatedDescription(selectedVenue, currentLanguage, selectedVenue.description)}` |

---

### 3. `frontend/src/pages/customer/entertainment/EntertainmentVenues.jsx`

**เพิ่ม `currentLanguage`** ใน `useLanguage()` destructure:
```js
const { translate, currentLanguage } = useLanguage();
```

**เพิ่ม `currentLanguage`** เป็น dependency ของ `useEffect` ที่ fetch venues/restaurants:
```js
}, [
  searchQuery, selectedCategory, sortBy,
  locationCountry, locationCity, locationBootstrapDone,
  userCoords,
  currentLanguage,  // ← เพิ่ม
]);
```

> `VenuesMap` และ `VenueCard` ใช้ `getTranslatedName`/`getTranslatedDescription` อยู่แล้ว — เพียงแต่ต้องให้ data re-fetch ด้วย `?lang=<code>` ใหม่เมื่อเปลี่ยนภาษา

---

### 4. `frontend/src/pages/customer/entertainment/EntertainmentVenueDetail.jsx`

`currentLanguage` ถูก destructure อยู่แล้วและชื่อ/คำอธิบายใช้ `getTranslatedName`/`getTranslatedDescription` อยู่แล้ว แต่ `useEffect` ที่ fetch venue ขาด `currentLanguage` เป็น dependency ทำให้ไม่ re-fetch เมื่อเปลี่ยนภาษา

```js
// ก่อน
}, [id]);

// หลัง
}, [id, currentLanguage]);
```

---

## ผลลัพธ์

- เมื่อผู้ใช้เปลี่ยนภาษา ระบบจะ re-fetch ข้อมูล Entertainment Venues พร้อม `?lang=<code>` ใหม่
- ชื่อและคำอธิบายสถานที่ในตาราง, การ์ด mobile, และ modal แสดงตามภาษาที่เลือก
- ถ้าภาษานั้นยังไม่มี translation จะ fallback แสดง `venue_name` / `description` ภาษา default
