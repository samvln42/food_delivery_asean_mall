# 🔧 CSRF Token Missing Fix Guide

## 🚨 Problem
Users getting "Login: CSRF Failed: CSRF token missing" error when trying to login or register.

## 🔍 Root Cause
The frontend was trying to access API endpoints that required CSRF tokens, but the API should be exempt from CSRF protection since it uses Token authentication.

## ✅ Solution Applied

### 1. **Added DisableCSRFMiddleware to Settings**
```python
# food_delivery_backend/settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'food_delivery_backend.middleware.DisableCSRFMiddleware',  # ← Added this
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### 2. **Added CSRF Exempt Decorator**
```python
# accounts/views.py
@method_decorator(csrf_exempt, name='dispatch')
class AuthViewSet(viewsets.GenericViewSet):
    # ... authentication endpoints
```

### 3. **Added Email Verification Toggle**
```python
# food_delivery_backend/settings.py
REQUIRE_EMAIL_VERIFICATION = os.environ.get('REQUIRE_EMAIL_VERIFICATION', 'True').lower() == 'true'
```

## 🎯 Configuration Options

### For Development (Skip Email Verification)
Create `.env` file in project root:
```env
REQUIRE_EMAIL_VERIFICATION=False
DEBUG=True
```

### For Production (Require Email Verification)
```env
REQUIRE_EMAIL_VERIFICATION=True
DEBUG=False
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

## 🧪 Testing the Fix

### 1. **Test Registration**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password_confirm": "testpass123"
  }'
```

**Expected Response (with REQUIRE_EMAIL_VERIFICATION=False):**
```json
{
  "success": true,
  "message": "Registration successful! You can now login with your credentials",
  "user": {...},
  "token": "abc123...",
  "next_step": "login_ready"
}
```

### 2. **Test Login**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {...},
  "token": "abc123...",
  "message": "Login successful"
}
```

## 🔧 How the Fix Works

### DisableCSRFMiddleware
```python
class DisableCSRFMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
```

This middleware automatically disables CSRF checks for all `/api/` endpoints, which is appropriate since:
- API endpoints use Token authentication
- CSRF protection is mainly for browser-based form submissions
- API clients (React frontend) handle authentication via tokens

### Email Verification Logic
```python
if getattr(settings, 'REQUIRE_EMAIL_VERIFICATION', True):
    # Send verification email, don't create token yet
else:
    # Auto-verify user and create token immediately
```

## 🚀 Restart Required

After making these changes, restart your Django server:
```bash
python manage.py runserver
```

## ✅ Verification

The fix is working when:
1. ❌ No more "CSRF token missing" errors
2. ✅ Registration completes successfully
3. ✅ Login works immediately after registration (if email verification disabled)
4. ✅ Users can access protected endpoints with their tokens

## 🎯 Summary

- **CSRF protection disabled for API endpoints** ✅
- **Email verification made optional** ✅  
- **Immediate login after registration** ✅ (when verification disabled)
- **Production-ready email verification** ✅ (when enabled)

The system now works smoothly for both development and production environments! 