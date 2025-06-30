# 🔐 Google OAuth Setup Guide
## Food Delivery System - Google Authentication Configuration

### 📋 Table of Contents
1. [Overview](#overview)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Integration](#frontend-integration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Google OAuth integration ให้ผู้ใช้สามารถ:
- 🔐 เข้าสู่ระบบด้วยบัญชี Google
- 🆕 สมัครสมาชิกใหม่ด้วย Google (อัตโนมัติ)
- ✅ ยืนยันอีเมลอัตโนมัติ (เนื่องจาก Google ยืนยันแล้ว)
- 🔄 เชื่อมโยงบัญชีที่มีอยู่กับ Google ID

### ✨ Features
- **Auto Registration**: สร้างผู้ใช้ใหม่อัตโนมัติจากข้อมูล Google
- **Email Verification**: ข้ามขั้นตอนยืนยันอีเมล
- **Account Linking**: เชื่อมโยงบัญชีเดิมกับ Google ID
- **Secure Token**: ใช้ Google ID Token สำหรับการยืนยันตัวตน

---

## 🏗️ Google Cloud Console Setup

### Step 1: สร้าง Google Cloud Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. คลิก **"Select a project"** → **"New Project"**
3. ตั้งชื่อโปรเจค เช่น `food-delivery-oauth`
4. คลิก **"Create"**

### Step 2: เปิดใช้งาน Google+ API

1. ไปที่ **APIs & Services** → **Library**
2. ค้นหา **"Google+ API"** หรือ **"People API"**
3. คลิก **"Enable"**

### Step 3: สร้าง OAuth 2.0 Credentials

1. ไปที่ **APIs & Services** → **Credentials**
2. คลิก **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. เลือก Application type: **"Web application"**
4. ตั้งชื่อ เช่น `Food Delivery Web Client`

### Step 4: กำหนด Authorized Origins และ Redirect URIs

**Authorized JavaScript origins:**
```
http://localhost:3000
http://127.0.0.1:3000
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
https://yourdomain.com/auth/callback
```

### Step 5: บันทึก Client ID และ Client Secret

หลังจากสร้างเสร็จ จะได้:
- **Client ID**: `123456789-abcdef.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdef123456`

---

## ⚙️ Backend Configuration

### Step 1: Environment Variables

เพิ่มในไฟล์ `.env`:

```env
# Google OAuth Configuration
GOOGLE_OAUTH2_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=GOCSPX-abcdef123456
```

### Step 2: ตรวจสอบ Settings

ใน `food_delivery_backend/settings.py`:

```python
# Google OAuth configuration
GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET')
```

### Step 3: ตรวจสอบ Dependencies

ใน `requirements.txt`:

```txt
google-auth-oauthlib==1.2.2
google-auth==2.40.3
requests==2.32.4
```

### Step 4: API Endpoint

Google OAuth endpoint พร้อมใช้งานที่:

```
POST /api/auth/google-login/
```

**Request Body:**
```json
{
  "access_token": "ya29.a0AfH6SMB..."
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@gmail.com",
    "role": "customer",
    "is_email_verified": true
  },
  "token": "abc123def456...",
  "message": "Google login successful"
}
```

---

## 🎨 Frontend Integration

### Option 1: React with @react-oauth/google

#### Installation
```bash
npm install @react-oauth/google
```

#### Setup GoogleOAuthProvider
```jsx
// App.js
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="123456789-abcdef.apps.googleusercontent.com">
      <div className="App">
        {/* Your app components */}
      </div>
    </GoogleOAuthProvider>
  );
}
```

#### Login Component
```jsx
// LoginPage.js
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Decode the JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Send to backend
      const response = await fetch('/api/auth/google-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: credentialResponse.credential
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on user role
        if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (data.user.role.includes('restaurant')) {
          window.location.href = '/restaurant';
        } else {
          window.location.href = '/';
        }
      } else {
        console.error('Login failed:', data.error);
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
  };

  return (
    <div className="login-page">
      <h1>เข้าสู่ระบบ</h1>
      
      {/* Regular login form */}
      <form>
        {/* Username/Email and Password fields */}
      </form>
      
      <div className="divider">หรือ</div>
      
      {/* Google Login Button */}
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="signin_with"
        locale="th"
      />
    </div>
  );
};
```

### Option 2: Vanilla JavaScript

#### HTML
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="g_id_onload"
       data-client_id="123456789-abcdef.apps.googleusercontent.com"
       data-callback="handleCredentialResponse">
  </div>
  <div class="g_id_signin" data-type="standard"></div>
</body>
</html>
```

#### JavaScript
```javascript
function handleCredentialResponse(response) {
  // Send credential to backend
  fetch('/api/auth/google-login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: response.credential
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload();
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
```

---

## 🧪 Testing

### 1. Test Backend Endpoint

```bash
# ใช้ curl ทดสอบ (ต้องมี valid Google token)
curl -X POST http://localhost:8000/api/auth/google-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "ya29.a0AfH6SMB..."
  }'
```

### 2. Test Frontend Integration

1. เปิด browser ไปที่ `http://localhost:3000/login`
2. คลิกปุ่ม "Sign in with Google"
3. เลือกบัญชี Google
4. ตรวจสอบว่า redirect ไปหน้าที่ถูกต้อง
5. ตรวจสอบ localStorage ว่ามี token และ user data

### 3. Test Account Creation

1. ใช้ Google account ที่ไม่เคยลงทะเบียน
2. Login ด้วย Google
3. ตรวจสอบว่าระบบสร้าง user ใหม่
4. ตรวจสอบว่า `is_email_verified = true`

### 4. Test Account Linking

1. สร้าง account ด้วย email ปกติ
2. Login ด้วย Google ที่ใช้ email เดียวกัน
3. ตรวจสอบว่า `google_id` ถูกเพิ่มเข้าไป

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid token" Error
**สาเหตุ:** Token หมดอายุหรือไม่ถูกต้อง
**แก้ไข:** 
- ตรวจสอบ Client ID ใน frontend ตรงกับ backend
- ตรวจสอบ token ยังไม่หมดอายุ

#### 2. "Email not provided by Google"
**สาเหตุ:** Google ไม่ส่ง email scope
**แก้ไข:**
```jsx
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  scope="email profile"
/>
```

#### 3. CORS Error
**สาเหตุ:** Frontend domain ไม่ได้อยู่ใน authorized origins
**แก้ไข:** เพิ่ม domain ใน Google Cloud Console

#### 4. "Username already exists"
**สาเหตุ:** Username ที่สร้างจาก email ซ้ำ
**แก้ไข:** ระบบจะเพิ่มเลขต่อท้ายอัตโนมัติ

### Debug Mode

เพิ่มใน backend เพื่อ debug:

```python
# ใน accounts/views.py
import logging
logger = logging.getLogger(__name__)

def google_login(self, request):
    logger.info(f"Google login attempt: {request.data}")
    # ... rest of the code
```

### Environment Variables Check

```bash
# ตรวจสอบว่า environment variables ถูกต้อง
python manage.py shell
>>> from django.conf import settings
>>> print(settings.GOOGLE_OAUTH2_CLIENT_ID)
>>> print(settings.GOOGLE_OAUTH2_CLIENT_SECRET)
```

---

## 🔒 Security Considerations

### Best Practices

1. **Environment Variables**: เก็บ credentials ใน environment variables
2. **HTTPS**: ใช้ HTTPS ใน production
3. **Token Validation**: ตรวจสอบ token กับ Google ทุกครั้ง
4. **Scope Limitation**: ขอเฉพาะ scope ที่จำเป็น
5. **Error Handling**: ไม่เปิดเผยข้อมูลสำคัญใน error messages

### Production Checklist

- [ ] อัปเดต Authorized Origins เป็น production domain
- [ ] ตั้งค่า HTTPS
- [ ] ตรวจสอบ CORS settings
- [ ] เปิดใช้ rate limiting
- [ ] ตั้งค่า logging และ monitoring
- [ ] ทดสอบ error scenarios

---

## 📚 References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [React OAuth Google Library](https://www.npmjs.com/package/@react-oauth/google)
- [Django Google OAuth Tutorial](https://python-social-auth.readthedocs.io/)

---

*Google OAuth integration เสร็จสมบูรณ์! ผู้ใช้สามารถเข้าสู่ระบบด้วย Google ได้อย่างปลอดภัยและสะดวก* 🎉 