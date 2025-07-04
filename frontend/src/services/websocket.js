class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
  }

  connect(token) {
    try {
      // WebSocket endpoint
      const wsUrl = `ws://127.0.0.1:8000/ws/orders/?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        console.log('🔗 Connection state:', this.ws.readyState);
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
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
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectInterval);
    }
  }

  handleMessage(data) {
    console.log('🔄 Handling WebSocket message:', data);
    const { type } = data;
    
    // Execute all listeners for this message type
    if (this.listeners.has(type)) {
      console.log(`✅ Found ${this.listeners.get(type).size} listeners for type: ${type}`);
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data); // ส่ง data ทั้งหมดแทน payload
        } catch (error) {
          console.error(`❌ Error in message handler for type ${type}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for message type: ${type}`);
      console.log('📋 Available listeners:', Array.from(this.listeners.keys()));
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
// // Connect to WebSocket
// websocketService.connect(userToken);
// 
// // Listen for order status updates
// websocketService.on('order_status_update', (data) => {
//   console.log('Order updated:', data);
//   // Update orders state
// });
// 
// // Listen for new orders (for admin)
// websocketService.on('new_order', (data) => {
//   console.log('New order received:', data);
// });
// 
// // Disconnect when component unmounts
// websocketService.disconnect(); 