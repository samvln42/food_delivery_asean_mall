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
      // Get base URL from environment variable
      const baseUrl = import.meta.env.VITE_API_URL || 'https://tacashop.com/api/';
      
      let wsUrl;
      // Convert HTTP/HTTPS to WS/WSS
      if (baseUrl.startsWith('https://')) {
        // Replace https:// with wss:// and /api or /api/ with /ws/orders/
        wsUrl = baseUrl.replace('https://', 'wss://').replace(/\/api\/?$/, '/ws/orders/');
      } else if (baseUrl.startsWith('http://')) {
        // Replace http:// with ws:// and /api or /api/ with /ws/orders/
        wsUrl = baseUrl.replace('http://', 'ws://').replace(/\/api\/?$/, '/ws/orders/');
      } else {
        // Fallback for localhost development
        wsUrl = 'ws://127.0.0.1:8000/ws/orders/';
      }
      
      const fullWsUrl = `${wsUrl}?token=${token}`;
      console.log('🔗 Connecting to WebSocket:', fullWsUrl);
      
      this.ws = new WebSocket(fullWsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        // Send a test ping to confirm connection
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('🏓 Sending test ping...');
            this.send('ping', { timestamp: Date.now() });
          }
        }, 1000);
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
        console.log('🔌 WebSocket disconnected, code:', event.code);
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
    console.log('📨 WebSocket message received:', data);
    
    const { type } = data;
    
    // แปลสถานะก่อนส่งให้ listeners สำหรับ order_status_update
    if (type === 'order_status_update') {
      console.log('🔄 Processing order status update:', data);
      
      // เพิ่ม payload wrapper ถ้าไม่มี
      if (!data.payload) {
        data.payload = {
          order_id: data.order_id,
          old_status: data.old_status,
          new_status: data.new_status,
          user_id: data.user_id,
          restaurant_name: data.restaurant_name
        };
      }

      if (this.translate) {
        try {
          // แปลสถานะ
          const statusKey = `order.status.${data.payload.new_status}`;
          const translatedStatus = this.translate(statusKey);
          
          // สร้างข้อความแจ้งเตือน
          data.payload.new_status_display = this.translate("order.status_change_notification", {
            orderId: data.payload.order_id,
            status: translatedStatus || data.payload.new_status
          });
          
          console.log('📝 Created status display message:', data.payload.new_status_display);
        } catch (error) {
          console.error('❌ Error in translation:', error);
          // Fallback: ใช้ข้อความพื้นฐาน
          data.payload.new_status_display = `Order #${data.payload.order_id} status changed to ${data.payload.new_status}`;
        }
      } else {
        // Fallback: ใช้ข้อความพื้นฐาน
        data.payload.new_status_display = `Order #${data.payload.order_id} status changed to ${data.payload.new_status}`;
      }
    }
    
    // Execute all listeners for this message type
    if (this.listeners.has(type)) {
      console.log(`📢 Notifying ${this.listeners.get(type).size} listeners for type: ${type}`);
      
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in message handler for type ${type}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for message type: ${type}`);
      console.warn('📋 Available listeners:', Array.from(this.listeners.keys()));
    }
  }

  // Add event listener
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    console.log(`✅ WebSocket listener added for: ${eventType}, total listeners: ${this.listeners.get(eventType).size}`);
    console.log('📋 All registered listeners:', Array.from(this.listeners.keys()));
  }

  // Remove event listener
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
      console.log(`❌ WebSocket listener removed for: ${eventType}, remaining: ${this.listeners.get(eventType).size}`);
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