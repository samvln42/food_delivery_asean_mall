# คู่มือ Debug ปัญหา Login ใน Browser

## 🔍 ขั้นตอนการ Debug

### Step 1: เปิด Developer Tools
1. กด `F12` หรือ `Ctrl+Shift+I`
2. ไปที่ **Network** tab
3. เลือก **XHR** หรือ **Fetch/XHR** filter
4. ✅ เช็ค **Preserve log** (สำคัญ!)

### Step 2: Clear Browser Data ก่อนทดสอบ
```
1. กด Ctrl+Shift+Delete
2. เลือก "All time"
3. เช็ค:
   ✅ Browsing history
   ✅ Cookies and other site data  
   ✅ Cached images and files
   ✅ Site settings
4. Click "Clear data"
```

### Step 3: ทดสอบ Login และบันทึกผล

#### 3.1 ใน Network Tab ดู:
- **Request URL**: ต้องเป็น `https://matjyp.com/api/auth/login/`
- **Request Method**: ต้องเป็น `POST`
- **Status Code**: ดูว่าได้ status code อะไร

#### 3.2 ใน Request Headers:
```
Content-Type: application/json
Accept: application/json
```

#### 3.3 ใน Request Payload:
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

#### 3.4 ใน Response:
ดู response body ว่าได้อะไรกลับมา

---

## 📊 Response แบบต่างๆ และความหมาย

### ✅ Login สำเร็จ (Status: 200)
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@test.com",
    "role": "customer",
    "is_email_verified": true
  },
  "token": "abc123...",
  "message": "Login successful"
}
```

### ❌ Email ไม่ได้ Verify (Status: 403)
```json
{
  "success": false,
  "error": "Email not verified",
  "error_type": "email_not_verified",
  "email_verification_required": true,
  "user_email": "test@test.com"
}
```
**💡 แก้ไข**: Admin ต้อง verify email ใน database

### ❌ Username/Password ผิด (Status: 401)
```json
{
  "success": false,
  "error": "Invalid data",
  "message": "Email/username or password is incorrect"
}
```
**💡 แก้ไข**: ตรวจสอบ credentials

### ❌ Server Error (Status: 500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```
**💡 แก้ไข**: ปัญหาที่ server

---

## 🔍 การดู Console Errors

### ใน Console Tab หาข้อความเหล่านี้:

#### CORS Errors:
```
Access to fetch at 'https://matjyp.com/api/auth/login/' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```
**💡 แก้ไข**: ปัญหา CORS settings

#### Network Errors:
```
TypeError: Failed to fetch
```
**💡 แก้ไข**: ปัญหา network connectivity

#### Authentication Errors:
```
🚫 Email not verified: {...}
```
**💡 แก้ไข**: Email verification issue

---

## 🧪 JavaScript Console Testing

### ใน Console tab ทดสอบ API call โดยตรง:

```javascript
// Test login API
fetch('https://matjyp.com/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Response:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

### หรือใช้ axios (ถ้ามี):
```javascript
axios.post('https://matjyp.com/api/auth/login/', {
  username: 'YOUR_USERNAME',  
  password: 'YOUR_PASSWORD'
})
.then(response => {
  console.log('✅ Response:', response.data);
})
.catch(error => {
  console.error('❌ Error:', error.response?.data || error.message);
});
```

---

## 🔧 Storage Debugging

### ตรวจสอบ localStorage:
```javascript
// ดู localStorage
console.log('localStorage token:', localStorage.getItem('token'));
console.log('localStorage user:', localStorage.getItem('user'));

// ลบ localStorage
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.clear(); // ลบทั้งหมด
```

### ตรวจสอบ sessionStorage:
```javascript
// ดู sessionStorage  
console.log('sessionStorage:', sessionStorage);

// ลบ sessionStorage
sessionStorage.clear();
```

---

## 📋 Checklist สำหรับการ Debug

### ✅ Pre-Debug:
- [ ] Clear browser cache & cookies
- [ ] Restart browser  
- [ ] Try incognito mode
- [ ] Check internet connection

### ✅ During Debug:
- [ ] Network tab เปิดอยู่
- [ ] Console tab เปิดอยู่
- [ ] บันทึก Request URL
- [ ] บันทึก Status Code  
- [ ] บันทึก Response Body
- [ ] บันทึก Error Messages

### ✅ After Debug:
- [ ] Screenshots ของ Network tab
- [ ] Screenshots ของ Console errors
- [ ] Copy response JSON
- [ ] Note exact error messages

---

## 📞 รายงานปัญหา

เมื่อพบปัญหา ให้รวบรวมข้อมูลเหล่านี้:

1. **Browser Info**: Chrome/Firefox version
2. **URL**: หน้าที่พบปัญหา
3. **Username**: ที่ใช้ login (ไม่ต้องใส่ password)
4. **Status Code**: จาก Network tab
5. **Response Body**: JSON response
6. **Console Errors**: Error messages
7. **Screenshots**: Network tab และ Console tab

### Template การรายงาน:
```
🐛 LOGIN BUG REPORT

Browser: Chrome 126.0.6478.127
URL: https://your-frontend-url.com/login
Username: testuser
Time: 2025-07-29 11:30:00

Network Response:
- Status: 403
- Response: { "error": "Email not verified", ... }

Console Errors:
- Error 1: ...
- Error 2: ...

Screenshots: [แนบรูป]
```

นี่คือเครื่องมือที่ครอบคลุมสำหรับ debug ปัญหา login! 🎯 