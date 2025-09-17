import { useLanguage } from '../contexts/LanguageContext';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.guestWs = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.translate = null; // จะถูกกำหนดค่าเมื่อเรียก setTranslateFunction
    this.guestTemporaryId = null; // เก็บ temporary_id สำหรับ guest orders
    
    // กำหนดค่า baseUrl จาก environment variable
    this.baseUrl = import.meta.env.VITE_API_URL;
  }

  setTranslateFunction(translateFn) {
    this.translate = translateFn;
  }

  // ตั้งค่า temporary_id สำหรับ guest orders
  setGuestTemporaryId(temporaryId) {
    
    
    this.guestTemporaryId = temporaryId;
    
    // ถ้ามี temporary_id ให้เชื่อมต่อ WebSocket
    if (temporaryId) {
      
      
      // ถ้า WebSocket เชื่อมต่ออยู่แล้ว ให้ subscribe ทันที
      if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
        
        this.subscribeToGuestOrder(temporaryId);
      } else {
        // ถ้า WebSocket ไม่ได้เชื่อมต่อ ให้เชื่อมต่อใหม่
        
        this.connectGuest();
      }
    }
  }

  connect(token) {
    try {
      // Get base URL from environment variable
      const baseUrl = import.meta.env.VITE_API_URL;
      
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
      
      this.ws = new WebSocket(fullWsUrl);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        
        // Send a test ping to confirm connection (reduced delay)
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send('ping', { timestamp: Date.now() });
          }
        }, 500);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        if (event.code !== 1000) { // 1000 = normal closure
          this.reconnect(token);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  // เพิ่มฟังก์ชันสำหรับ guest orders ที่ไม่ต้องใช้ token
  connectGuest() {
    try {
      
      
      // ถ้ามี WebSocket connection อยู่แล้ว ให้ปิดก่อน
      if (this.guestWs) {
        try {
          this.guestWs.close();
        } catch (closeError) {
          console.warn('⚠️ Error closing existing WebSocket:', closeError);
        }
      }

      // Reset connection flags
      this.reconnectAttempts = 0;

      // สร้าง WebSocket URL
      const baseUrl = import.meta.env.VITE_API_URL;

      // URL ที่อนุมานจาก VITE_API_URL เท่านั้น (ไม่ hardcode fallback)
      const fallbackUrls = [
        baseUrl.replace('https://', 'wss://').replace(/\/api\/?$/, '/ws/guest-orders/'),
        baseUrl.replace('http://', 'ws://').replace(/\/api\/?$/, '/ws/guest-orders/'),
      ];

      // หาก URL ที่ใช้งานได้
      const tryConnectWebSocket = (urls) => {
        if (urls.length === 0) {
          console.error('❌ No WebSocket URL works');
          return null;
        }

        const wsUrl = urls[0];
        

        return new Promise((resolve, reject) => {
          const ws = new WebSocket(wsUrl);
          
          const connectionTimeout = setTimeout(() => {
            
            ws.close();
            reject(new Error('Connection timeout'));
          }, 5000);

          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            
            resolve(ws);
          };

          ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error(`❌ WebSocket connection error: ${wsUrl}`, error);
            ws.close();
            reject(error);
          };

          ws.onclose = (event) => {
            clearTimeout(connectionTimeout);
            console.log(`🔌 WebSocket connection closed: ${wsUrl}`, event);
            reject(new Error('Connection closed'));
          };
        }).catch(() => {
          // ลองต่อด้วย URL ถัดไป
          if (urls.length > 1) {
            return tryConnectWebSocket(urls.slice(1));
          } else {
            return Promise.reject(new Error('All WebSocket URLs failed'));
          }
        });
      };

      // เริ่มพยายามเชื่อมต่อ
      tryConnectWebSocket(fallbackUrls)
        .then((ws) => {
          if (ws) {
            this.guestWs = ws;
            this.guestWs._isConnected = true;
          
          // ตั้งค่า event handlers
          this.guestWs.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleMessage(data);
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          this.guestWs.onclose = (event) => {
            console.log('🔌 Guest WebSocket disconnected', event);
            this.guestWs._isConnected = false;
            this.reconnectGuest();
          };

          // Subscribe to guest order if temporary_id is set (reduced delay)
          if (this.guestTemporaryId) {
            setTimeout(() => {
              this.subscribeToGuestOrder(this.guestTemporaryId);
            }, 200);
          }
          }
        })
        .catch((error) => {
          console.error('❌ Failed to connect to WebSocket:', error);
          this.reconnectGuest();
        });

    } catch (error) {
      console.error('Error connecting to Guest WebSocket:', error);
    }
  }

  // เพิ่มฟังก์ชันสำหรับ subscribe ไปยัง guest order specific
  subscribeToGuestOrder(temporaryId) {
    console.log(`📡 subscribeToGuestOrder() called with temporaryId: ${temporaryId}`);
    console.log('🔍 WebSocket state before subscription:', {
      hasWebSocket: !!this.guestWs,
      readyState: this.guestWs?.readyState,
      readyStateText: this.getReadyStateText(this.guestWs?.readyState),
      _isConnected: this.guestWs?._isConnected
    });
    
    if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
      console.log(`📡 Subscribing to guest order: ${temporaryId}`);
      this.sendGuest('subscribe_guest_order', { temporary_id: temporaryId });
    } else {
      console.log(`⚠️ Cannot subscribe to guest order ${temporaryId}: WebSocket not connected (readyState: ${this.guestWs?.readyState})`);
      
      // ถ้า WebSocket ไม่เชื่อมต่อ ให้ลองเชื่อมต่อใหม่
      if (!this.guestWs || this.guestWs.readyState === WebSocket.CLOSED) {
        console.log('🔄 Attempting to reconnect WebSocket for subscription...');
        this.connectGuest();
        
        // รอให้เชื่อมต่อแล้วค่อย subscribe (reduced delay)
        setTimeout(() => {
          if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
            console.log(`📡 Retrying subscription to guest order: ${temporaryId}`);
            this.sendGuest('subscribe_guest_order', { temporary_id: temporaryId });
          } else {
            console.log(`❌ Failed to subscribe to guest order ${temporaryId} after reconnection`);
          }
        }, 800);
      } else if (this.guestWs && this.guestWs.readyState === WebSocket.CONNECTING) {
        // ถ้า WebSocket กำลังเชื่อมต่อ ให้รอสักพักแล้วลองใหม่
        console.log('⏳ WebSocket is connecting, waiting...');
        setTimeout(() => {
          if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
            console.log(`📡 Subscribing to guest order after connection: ${temporaryId}`);
            this.sendGuest('subscribe_guest_order', { temporary_id: temporaryId });
          } else {
            console.log(`❌ Failed to subscribe to guest order ${temporaryId} after waiting for connection`);
          }
        }, 1000);
      }
    }
  }

  // เพิ่มฟังก์ชันสำหรับ subscribe ไปยัง all orders (สำหรับ admin)
  subscribeToAllOrders() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('subscribe_all_orders', {});
      console.log('Subscribed to all order updates');
    } else {
      console.error('WebSocket is not connected for subscription');
    }
  }

  reconnectGuest() {
    console.log('🔄 reconnectGuest() called');
    console.log('🔍 Current state before reconnect:', {
      hasWebSocket: !!this.guestWs,
      readyState: this.guestWs?.readyState,
      readyStateText: this.getReadyStateText(this.guestWs?.readyState),
      _isConnected: this.guestWs?._isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      temporaryId: this.guestTemporaryId
    });
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`�� Reconnecting guest WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // ลด delay ลงเหลือ 1 วินาที (จากเดิม 3 วินาที)
      const delay = Math.min(1000 * this.reconnectAttempts, 3000); // 1s, 2s, 3s max
      
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect guest WebSocket...');
        this.connectGuest();
        
        // ลอง subscribe อีกครั้งหลังจาก reconnect (reduced delay)
        if (this.guestTemporaryId) {
          setTimeout(() => {
            if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
              console.log(`📡 Re-subscribing to guest order after reconnect: ${this.guestTemporaryId}`);
              this.subscribeToGuestOrder(this.guestTemporaryId);
            }
          }, 1000);
        }
      }, delay);
    } else {
      console.log('❌ Max reconnection attempts reached for guest WebSocket');
      console.log('💡 Consider checking backend server or network connection');
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
    
    // Skip logging and processing for pong messages
    if (type === 'pong') {
      return;
    }
    
    // console.log(`📨 Handling message type: ${type}`, data);
    // console.log(`📨 Message source: ${this.guestWs ? 'Guest WebSocket' : 'Main WebSocket'}`);
    
    // แปลสถานะก่อนส่งให้ listeners สำหรับ order_status_update และ guest_order_status_update
    if (type === 'order_status_update' || type === 'guest_order_status_update') {
      console.log(`📨 Processing ${type} message:`, data);
      
      // เพิ่ม payload wrapper ถ้าไม่มี
      if (!data.payload) {
        data.payload = {
          order_id: data.order_id,
          temporary_id: data.temporary_id,
          old_status: data.old_status,
          new_status: data.new_status,
          user_id: data.user_id,
          restaurant_name: data.restaurant_name,
          note: data.note
        };
      }

      if (this.translate) {
        try {
          // แปลสถานะ
          const statusKey = `order.status.${data.payload.new_status}`;
          const translatedStatus = this.translate(statusKey);
          
          // สร้างข้อความแจ้งเตือน
          const orderId = data.payload.temporary_id || data.payload.order_id;
          data.payload.new_status_display = this.translate("order.status_change_notification", {
            orderId: orderId,
            status: translatedStatus || data.payload.new_status
          });
        } catch (error) {
          console.error('Error in translation:', error);
          // Fallback: ใช้ข้อความพื้นฐาน
          const orderId = data.payload.temporary_id || data.payload.order_id;
          data.payload.new_status_display = `Order #${orderId} status changed to ${data.payload.new_status}`;
        }
      } else {
        // Fallback: ใช้ข้อความพื้นฐาน
        const orderId = data.payload.temporary_id || data.payload.order_id;
        data.payload.new_status_display = `Order #${orderId} status changed to ${data.payload.new_status}`;
      }
    }

    // Execute all listeners for this message type
    if (this.listeners.has(type)) {
      console.log(`📤 Executing ${this.listeners.get(type).size} listeners for type: ${type}`);
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in message handler for type ${type}:`, error);
        }
      });
    }
  }

  // Add event listener
  on(eventType, callback) {
    // console.log(`📝 Registering listener for event type: ${eventType}`);
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    // console.log(`📝 Total listeners for ${eventType}: ${this.listeners.get(eventType).size}`);
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
      console.error('WebSocket is not connected');
    }
  }

  sendGuest(type, payload) {
    // console.log(`📤 sendGuest() called with type: ${type}, payload:`, payload);
    // console.log('🔍 WebSocket state before sending:', {
    //   hasWebSocket: !!this.guestWs,
    //   readyState: this.guestWs?.readyState,
    //   readyStateText: this.getReadyStateText(this.guestWs?.readyState),
    //   _isConnected: this.guestWs?._isConnected,
    //   url: this.guestWs?.url || 'N/A'
    // });
    
    if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ type, payload });
        this.guestWs.send(message);
        // console.log(`📤 Sent guest message: ${type}`, message);
      } catch (error) {
        console.error('Error sending guest message:', error);
        
        // ถ้าเกิด error ในการส่ง ให้ลอง reconnect
        if (this.guestTemporaryId) {
          console.log('🔄 Attempting to reconnect due to send error...');
          this.connectGuest();
        }
      }
    } else {
      console.log(`⚠️ Cannot send guest message ${type}: WebSocket not connected (readyState: ${this.guestWs?.readyState})`);
      
      // ถ้า WebSocket ไม่เชื่อมต่อ ให้ลองเชื่อมต่อใหม่
      if (!this.guestWs || this.guestWs.readyState === WebSocket.CLOSED) {
        console.log('🔄 Attempting to reconnect due to send failure...');
        this.connectGuest();
      }
    }
  }

  disconnect() {
    // console.log('🔌 disconnect() called');
    // console.log('🔍 Current state before disconnect:', {
    //   hasMainWebSocket: !!this.ws,
    //   mainWebSocketReadyState: this.ws?.readyState,
    //   mainWebSocketReadyStateText: this.getReadyStateText(this.ws?.readyState),
    //   hasGuestWebSocket: !!this.guestWs,
    //   guestWebSocketReadyState: this.guestWs?.readyState,
    //   guestWebSocketReadyStateText: this.getReadyStateText(this.guestWs?.readyState)
    // });
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // ไม่ปิด guest WebSocket เมื่อปิด main WebSocket
    // เพื่อให้ guest WebSocket ยังคงทำงานอยู่
    // console.log('🔌 Main WebSocket disconnected, keeping guest WebSocket alive');
  }

  // เพิ่มฟังก์ชันสำหรับ disconnect เฉพาะ guest WebSocket
  disconnectGuest() {
    // console.log('🔌 disconnectGuest() called');
    if (this.guestWs) {
      // console.log('🔌 Disconnecting guest WebSocket...');
      // console.log('🔍 WebSocket state before disconnect:', {
      //   readyState: this.guestWs.readyState,
      //   readyStateText: this.getReadyStateText(this.guestWs.readyState),
      //   hasWebSocket: !!this.guestWs,
      //   _isConnected: this.guestWs._isConnected,
      //   temporaryId: this.guestTemporaryId
      // });
      
      // Reset connection flag
      this.guestWs._isConnected = false;
      
      // ปิด WebSocket อย่างเหมาะสม
      if (this.guestWs.readyState === WebSocket.OPEN || this.guestWs.readyState === WebSocket.CONNECTING) {
        this.guestWs.close(1000, 'Component unmounting');
      }
      
      this.guestWs = null;
      // Reset reconnection attempts
      this.reconnectAttempts = 0;
      // console.log('✅ Guest WebSocket disconnected successfully');
    } else {
      console.log('ℹ️ No guest WebSocket to disconnect');
    }
  }

  // เพิ่มฟังก์ชันสำหรับ force disconnect guest WebSocket (ใช้เมื่อต้องการปิดจริงๆ)
  forceDisconnectGuest() {
    console.log('🔌 forceDisconnectGuest() called');
    if (this.guestWs) {
      console.log('🔌 Force disconnecting guest WebSocket...');
      console.log('🔍 WebSocket state before force disconnect:', {
        readyState: this.guestWs.readyState,
        readyStateText: this.getReadyStateText(this.guestWs.readyState),
        hasWebSocket: !!this.guestWs,
        _isConnected: this.guestWs._isConnected,
        temporaryId: this.guestTemporaryId
      });
      
      // Reset connection flag
      this.guestWs._isConnected = false;
      
      // ปิด WebSocket อย่างเหมาะสม
      if (this.guestWs.readyState === WebSocket.OPEN || this.guestWs.readyState === WebSocket.CONNECTING) {
        this.guestWs.close(1000, 'Force disconnect');
      }
      
      this.guestWs = null;
      // Reset reconnection attempts
      this.reconnectAttempts = 0;
      // console.log('✅ Guest WebSocket force disconnected successfully');
    } else {
      console.log('ℹ️ No guest WebSocket to force disconnect');
    }
  }

  // ตรวจสอบสถานะการเชื่อมต่อ
  isConnected() {
    const hasWebSocket = !!this.ws;
    const readyState = this.ws?.readyState;
    const isOpen = readyState === WebSocket.OPEN;
    const isConnected = hasWebSocket && isOpen;
    
    // Only log if there's an issue (reduced logging)
    if (!isConnected && hasWebSocket) {
      console.log('🔍 Main WebSocket status check:', {
        hasWebSocket,
        readyState,
        readyStateText: this.getReadyStateText(readyState),
        isOpen,
        isConnected
      });
    }
    
    return isConnected;
  }

  isGuestConnected() {
    // ตรวจสอบว่ามี WebSocket object และสถานะเป็น OPEN
    const hasWebSocket = !!this.guestWs;
    const readyState = this.guestWs?.readyState;
    const isOpen = readyState === WebSocket.OPEN;
    const isConnected = hasWebSocket && isOpen;
    
    // Only log if there's an issue (reduced logging)
    if (!isConnected && hasWebSocket) {
      console.log('🔍 Guest WebSocket status check:', {
        hasWebSocket,
        readyState,
        readyStateText: this.getReadyStateText(readyState),
        isOpen,
        isConnected,
        _isConnected: this.guestWs?._isConnected,
        temporaryId: this.guestTemporaryId,
        url: this.guestWs?.url || 'N/A'
      });
    }
    
    return isConnected;
  }

  // เพิ่มฟังก์ชันสำหรับแปลง readyState เป็นข้อความ
  getReadyStateText(readyState) {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }
}

// Export singleton instance
export default new WebSocketService(); 