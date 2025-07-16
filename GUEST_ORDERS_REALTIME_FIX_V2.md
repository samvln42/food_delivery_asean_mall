# แก้ไข GuestOrders.jsx ให้เหมือนกับ Orders.jsx

## ปัญหาที่พบ
GuestOrders.jsx ยังไม่อัปเดท real-time เหมือนกับ Orders.jsx ที่เป็นแบบล็อกอิน

## การวิเคราะห์ Orders.jsx (แบบล็อกอิน)

### 1. WebSocket Connection
```javascript
// Orders.jsx - ใช้ token
websocketService.connect(token);

// GuestOrders.jsx - ใช้ guest WebSocket
websocketService.connectGuest();
```

### 2. Message Handling
```javascript
// Orders.jsx - เรียบง่าย
const handleOrderStatusUpdate = (data) => {
  // Refresh orders list
  fetchOrdersQuietly();
    
  // Show UI notification popup
  const translatedStatus = translate(`order.status.${data.payload?.new_status || data.new_status}`);
  setStatusUpdateNotification({
    orderId: data.payload?.order_id || data.order_id,
    statusLabel: translatedStatus,
    oldStatus: data.payload?.old_status || data.old_status,
    newStatus: data.payload?.new_status || data.new_status,
  });
};

websocketService.on('order_status_update', handleOrderStatusUpdate);
```

### 3. Polling System
```javascript
// Orders.jsx - เรียบง่าย
// Initial fetch
fetchOrders();

// Set up polling interval (ทุก 10 วินาที)
pollingInterval = setInterval(() => {
  fetchOrdersQuietly();
}, 10000);

setPollingActive(true);
```

## การแก้ไข GuestOrders.jsx

### 1. ปรับปรุง handleOrderStatusUpdate
```javascript
// เปลี่ยนจาก
const handleOrderStatusUpdate = (data) => {
  // ตรวจสอบ isRelevantUpdate
  if (isRelevantUpdate) {
    // ดึงข้อมูลจาก API
    fetchOrdersQuietly();
    // แสดง notification
  }
};

// เป็น
const handleOrderStatusUpdate = (data) => {
  // Refresh orders list
  fetchOrdersQuietly();
    
  // Show UI notification popup
  const translatedStatus = translate(`order.status.${data.payload?.new_status || data.new_status}`);
  setStatusUpdateNotification({
    orderId: data.payload?.temporary_id || data.temporary_id || data.payload?.order_id || data.order_id,
    statusLabel: translatedStatus,
    oldStatus: data.payload?.old_status || data.old_status,
    newStatus: data.payload?.new_status || data.new_status,
  });
};
```

### 2. ปรับปรุง fetchOrdersQuietly
```javascript
// เพิ่มการตรวจสอบ status changes เหมือนกับ Orders.jsx
setOrders((prevOrders) => {
  // Check for status changes
  const statusChanges = [];

  detailedOrders.forEach((newOrder) => {
    const oldOrder = prevOrders.find(
      (o) => o.temporary_id === newOrder.temporary_id
    );
    if (oldOrder && oldOrder.current_status !== newOrder.current_status) {
      statusChanges.push({
        orderId: newOrder.temporary_id,
        oldStatus: oldOrder.current_status,
        newStatus: newOrder.current_status,
      });
    }
  });

  // Show notifications for status changes (Only if WebSocket is not connected)
  if (statusChanges.length > 0) {
    const latestChange = statusChanges[0];
    const statusInfo = getStatusDisplay(latestChange.newStatus);

    // Only show notification if WebSocket is not connected (fallback)
    if (!websocketService.guestWs || websocketService.guestWs.readyState !== WebSocket.OPEN) {
      setStatusUpdateNotification({
        orderId: latestChange.orderId,
        statusLabel: statusInfo.text,
        oldStatus: latestChange.oldStatus,
        newStatus: latestChange.newStatus,
      });
    }
  }

  return detailedOrders;
});
```

### 3. ปรับปรุง Polling System
```javascript
// เปลี่ยนจาก
if (isWebSocketConnected) {
  setPollingActive(false);
  fetchOrders();
} else {
  setPollingActive(true);
  fetchOrders();
  pollingInterval = setInterval(() => {
    fetchOrdersQuietly();
  }, 10000);
}

// เป็น
// Initial fetch
fetchOrders();

// Set up polling interval (ทุก 10 วินาที) - เหมือนกับ Orders.jsx
pollingInterval = setInterval(() => {
  fetchOrdersQuietly();
}, 10000);

setPollingActive(true);
```

## ผลลัพธ์ที่คาดหวัง

1. **Real-time updates ที่เหมือนกับ Orders.jsx** - ใช้ logic เดียวกัน
2. **การจัดการ WebSocket ที่เรียบง่าย** - ไม่มีการตรวจสอบซับซ้อน
3. **Polling ที่เสถียร** - ทำงานตลอดเวลาเหมือนกับ Orders.jsx
4. **Notification ที่ถูกต้อง** - แสดง notification เมื่อสถานะเปลี่ยน

## การตรวจสอบ

1. **Console logs** - ดูการทำงานของ WebSocket และ polling
2. **Real-time updates** - ตรวจสอบว่าข้อมูลอัปเดททันทีเมื่อสถานะเปลี่ยน
3. **Notification** - ตรวจสอบการแสดง notification เมื่อสถานะเปลี่ยน

## หมายเหตุ

- การแก้ไขนี้ทำให้ GuestOrders.jsx ทำงานเหมือนกับ Orders.jsx
- ใช้ logic เดียวกันสำหรับการจัดการ WebSocket และ polling
- ลดความซับซ้อนของการตรวจสอบและทำให้เสถียรขึ้น 