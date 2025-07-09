import { useLanguage } from '../contexts/LanguageContext';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.translate = null; // จะถูกกำหนดค่าเมื่อเรียก setTranslateFunction
  }

  setTranslateFunction(translateFn) {
    this.translate = translateFn;
  }

  connect(token) {
    try {
      // WebSocket endpoint
      const wsUrl = `ws://127.0.0.1:8000/ws/orders/?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        if (event.code !== 1000) { // 1000 = normal closure
          this.reconnect(token);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
    }
  }

  reconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectInterval);
    }
  }

  handleMessage(data) {
    const { type } = data;
    
    // Execute all listeners for this message type
    if (this.listeners.has(type)) {
      
      // แปลสถานะก่อนส่งให้ listeners
      // if (data.type === 'order_status_update') {

      //   if (this.translate) {
      //     try {
      //       // แปลสถานะ
      //       const statusKey = `order.status.${data.payload.new_status}`;
      //       const translatedStatus = this.translate(statusKey);
            
      //       // ตรวจสอบว่าการแปลสำเร็จหรือไม่ (ถ้าไม่สำเร็จจะได้ key เดิมกลับมา)
      //       if (translatedStatus && translatedStatus !== statusKey) {
      //         // สร้างข้อความแจ้งเตือนด้วย translation key
      //         data.payload.new_status_display = this.translate("order.status_change_notification", {
      //           orderId: data.payload.order_id,
      //           status: translatedStatus
      //         });
      //       } else {
      //         // Fallback: ใช้ status key โดยตรง (ควรจะมีใน translation files)
      //         const fallbackStatus = this.translate(statusKey, {}, data.payload.new_status);
      //         data.payload.new_status_display = this.translate("order.status_change_notification", {
      //           orderId: data.payload.order_id,
      //           status: fallbackStatus
      //         });
      //       }
      //     } catch (error) {
      //       console.error('❌ Error in translation:', error);
      //       // Fallback: ใช้ข้อความพื้นฐาน
      //       data.payload.new_status_display = `Order #${data.payload.order_id} status changed to ${data.payload.new_status}`;
      //     }
      //   } else {
      //     // Fallback: ใช้ข้อความพื้นฐาน
      //     data.payload.new_status_display = `Order #${data.payload.order_id} status changed to ${data.payload.new_status}`;
      //   }
      // }
      
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in message handler for type ${type}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for message type: ${type}`);
    }
  }

  // Add event listener
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  // Remove event listener
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  // Send message to server
  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export default new WebSocketService();

// Usage examples:
// 
// // Connect to WebSocket and set translate function
// const { translate } = useLanguage();
// websocketService.setTranslateFunction(translate);
// websocketService.connect(userToken);
// 
// // Listen for order status updates
// websocketService.on('order_status_update', (data) => {
//   console.log('Order updated:', data);
//   toast.success(`Order #${data.payload.order_id} changed to "${data.payload.new_status_display}"`);
// });
// 
// // Listen for new orders (for admin)
// websocketService.on('new_order', (data) => {
//   console.log('New order received:', data);
// });
// 
// // Disconnect when component unmounts
// websocketService.disconnect(); 