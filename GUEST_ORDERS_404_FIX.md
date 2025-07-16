# แก้ไขปัญหา 404 Error สำหรับ Guest Orders

## ปัญหาที่พบ
GuestOrders.jsx มี error 404 เมื่อเรียก API:
```
GET http://localhost:8000/api/api/guest-orders/track/?temporary_id=GUEST-ABC4EC44 404 (Not Found)
```

## สาเหตุของปัญหา
URL มี `/api/api/` ซ้ำกัน เนื่องจาก:
1. `API_CONFIG.BASE_URL` ถูกตั้งค่าเป็น `http://localhost:8000/api` (ไม่มี trailing slash)
2. ใน `GuestOrders.jsx` ใช้ `/api/guest-orders/track/` ซึ่งทำให้ URL กลายเป็น `http://localhost:8000/api/api/guest-orders/track/`

## การแก้ไข

### 1. ตรวจสอบการตั้งค่า API
```javascript
// frontend/src/config/api.js
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
  return url.endsWith('/') ? url.slice(0, -1) : url; // ลบ trailing slash
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(), // ผลลัพธ์: http://localhost:8000/api
  // ...
};
```

### 2. แก้ไข URL ใน GuestOrders.jsx
เปลี่ยนจาก:
```javascript
// ❌ ผิด - มี /api/ ซ้ำ
response = await api.get(`/api/guest-orders/track/?temporary_id=${temporaryId}`);
```

เป็น:
```javascript
// ✅ ถูก - ลบ /api/ ออก
response = await api.get(`/guest-orders/track/?temporary_id=${temporaryId}`);
```

### 3. ตรวจสอบ Backend Endpoint
Backend มี endpoint ถูกต้อง:
```python
# api/views.py
class GuestOrderViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def track(self, request):
        temporary_id = request.query_params.get('temporary_id')
        if not temporary_id:
            return Response({'error': 'temporary_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            guest_order = GuestOrder.objects.get(temporary_id=temporary_id)
            # ...
            serializer = GuestOrderTrackingSerializer(guest_order)
            return Response(serializer.data)
        except GuestOrder.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
```

## URL ที่ถูกต้อง
หลังจากแก้ไขแล้ว URL จะเป็น:
```
http://localhost:8000/api/guest-orders/track/?temporary_id=GUEST-ABC4EC44
```

## การตรวจสอบ
1. **Console logs**: ดู Network tab ใน Developer Tools
2. **API Response**: ควรได้ข้อมูล guest order แทน 404 error
3. **Frontend**: หน้า GuestOrders ควรแสดงข้อมูลได้ปกติ

## หมายเหตุ
- การแก้ไขนี้จะทำให้ guest orders สามารถดึงข้อมูลจาก API ได้ปกติ
- WebSocket และ polling จะทำงานได้ตามปกติ
- ไม่มีผลกระทบต่อ logged-in users เพราะใช้ endpoint ต่างกัน 