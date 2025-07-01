# คำสั่งจัดการ Superuser

## ปัญหาที่แก้ไข

เมื่อใช้ `python manage.py createsuperuser` มักจะพบปัญหา:
1. **Role เป็น customer** แทนที่จะเป็น admin
2. **ไม่มี API Token** สำหรับใช้งาน API
3. **Email ไม่ได้ยืนยัน** ทำให้ใช้งานบางฟีเจอร์ไม่ได้

## วิธีแก้ไข

### 1. สร้าง Superuser ใหม่ (แนะนำ)

```bash
python manage.py createsuperuser_admin
```

**ฟีเจอร์:**
- ✅ Role เป็น admin อัตโนมัติ
- ✅ สร้าง API Token ทันที
- ✅ ยืนยันอีเมลอัตโนมัติ
- ✅ ตั้งค่าสิทธิ์ทั้งหมด

**ตัวอย่างการใช้งาน:**
```bash
# แบบ Interactive
python manage.py createsuperuser_admin

# แบบระบุ arguments
python manage.py createsuperuser_admin --username admin --email admin@example.com --password mypassword
```

### 2. แก้ไข Superuser ที่มีอยู่

```bash
# แก้ไข superuser ทั้งหมด
python manage.py fix_superuser

# แก้ไข superuser คนเดียว
python manage.py fix_superuser --username admin
```

**สิ่งที่จะถูกแก้ไข:**
- ✅ เปลี่ยน role เป็น admin
- ✅ สร้าง API Token ถ้ายังไม่มี
- ✅ ยืนยันอีเมล
- ✅ ตั้งค่า is_staff = True

## การทำงานอัตโนมัติ

ระบบได้ปรับปรุงแล้วเพื่อให้:

### User Model (accounts/models.py)
- เมื่อสร้าง superuser จะตั้ง role เป็น admin อัตโนมัติ
- สร้าง API Token อัตโนมัติ
- ยืนยันอีเมลอัตโนมัติ

### Signals
- `create_auth_token`: สร้าง token เมื่อสร้างผู้ใช้ใหม่หรือ superuser
- `ensure_superuser_privileges`: ตรวจสอบและปรับปรุงสิทธิ์ superuser

## ตรวจสอบ Superuser

```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model;
from rest_framework.authtoken.models import Token;
User = get_user_model();
user = User.objects.get(username='admin');
token = Token.objects.get(user=user);
print(f'Username: {user.username}');
print(f'Role: {user.role}');
print(f'Is superuser: {user.is_superuser}');
print(f'Is staff: {user.is_staff}');
print(f'Email verified: {user.is_email_verified}');
print(f'Token: {token.key}')
"
```

## การใช้งาน API Token

หลังจากได้ Token แล้ว สามารถใช้ใน API requests:

```bash
# Header
Authorization: Token YOUR_TOKEN_HERE

# ตัวอย่าง
curl -H "Authorization: Token 1348027b9f3b676649aedec69b02bdc6456abeba" \
     http://localhost:8000/api/users/
```

## คำแนะนำ

1. **สำหรับ Development**: ใช้ `createsuperuser_admin` เพื่อสร้าง superuser ใหม่
2. **สำหรับ Production**: ใช้ `fix_superuser` เพื่อแก้ไข superuser ที่มีอยู่
3. **Token Security**: เก็บ Token ไว้อย่างปลอดภัย อย่าแชร์หรือ commit ลง git
4. **Multiple Admins**: สามารถสร้าง admin หลายคนได้ แต่ละคนจะมี Token ของตัวเอง 