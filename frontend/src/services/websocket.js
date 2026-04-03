import { API_CONFIG } from '../config/api';

/**
 * เบราว์เซอร์ส่ง WebSocket onerror เป็น Event แบบไม่มี message (ไม่ใช่ Error จริง)
 * — log แบบนี้ช่วยไม่ให้เข้าใจผิดว่าเป็น bug ในแอป
 */
function logWebSocketTransportFailure(kind, urlWithoutSecrets) {
  const url = urlWithoutSecrets || '(unknown)';
  if (import.meta.env.DEV) {
    console.warn(
      `⚠️ WebSocket [${kind}] เชื่อมต่อไม่สำเร็จ → ${url}\n` +
        'สาเหตุที่พบบ่อย: แบ็กเอนด์ไม่รัน/ไม่รองรับ WS, พอร์ตหรือ host ผิด, หน้า HTTPS ต้องใช้ wss (ตั้ง VITE_API_URL), reverse proxy ไม่ส่ง WebSocket Upgrade'
    );
  } else {
    console.warn(`⚠️ WebSocket [${kind}] connection failed → ${url}`);
  }
}

class WebSocketService {
  constructor() {
    this.ws = null;
    this.guestWs = null;
    this.dineInWs = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.translate = null; // จะถูกกำหนดค่าเมื่อเรียก setTranslateFunction
    this.guestTemporaryId = null; // เก็บ temporary_id สำหรับ guest orders
    this.dineInSessionId = null; // เก็บ session_id สำหรับ dine-in
    this.dineInRestaurantId = null; // เก็บ restaurant_id สำหรับ realtime dine-in products
    
    // กำหนดค่า baseUrl จาก config (รองรับ fallback เมื่อไม่กำหนด VITE_API_URL)
    this.baseUrl = API_CONFIG.BASE_URL;
    
    // Error logging throttling - ป้องกันการ log ซ้ำๆ
    this.lastErrorLogTime = 0;
    this.errorLogThrottle = 5000; // Log error ทุก 5 วินาที
    this.lastErrorType = null;
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

  // ตั้งค่า session_id สำหรับ dine-in (ไม่ต้องใช้ token)
  setDineInSessionId(sessionId) {
    this.dineInSessionId = sessionId;
    if (sessionId) {
      if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
        this.subscribeToDineInSession(sessionId);
      } else {
        this.connectDineIn();
      }
    }
  }

  setDineInRestaurantId(restaurantId) {
    this.dineInRestaurantId = restaurantId;
    if (restaurantId) {
      if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
        this.subscribeToDineInRestaurant(restaurantId);
      } else {
        this.connectDineIn();
      }
    }
  }

  connect(token, forceReconnect = false) {
    try {
      // ถ้ามี connection อยู่แล้วและยังเปิดอยู่ และไม่ใช่ force reconnect
      if (!forceReconnect && this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('ℹ️ WebSocket already connected, skipping new connection');
        return;
      }

      // ถ้ามี connection อยู่แต่ยังกำลังเชื่อมต่อ และไม่ใช่ force reconnect
      if (!forceReconnect && this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        console.log('ℹ️ WebSocket connection in progress, skipping new connection');
        return;
      }

      // ถ้า force reconnect หรือ connection เก่ามีปัญหา ให้ปิด connection เก่าก่อน
      if (forceReconnect && this.ws) {
        console.log('🔄 Force reconnecting WebSocket, closing old connection...');
        try {
          this.ws.close();
        } catch {
          // Ignore close errors
        }
        this.ws = null;
        this.reconnectAttempts = 0; // Reset reconnect attempts
      }

      // Get base URL from environment variable
      const baseUrl = API_CONFIG.BASE_URL;
      
      let wsUrl;
      // Convert HTTP/HTTPS to WS/WSS
      if (baseUrl && baseUrl.startsWith('https://')) {
        // Replace https:// with wss:// and /api or /api/ with /ws/orders/
        wsUrl = baseUrl.replace('https://', 'wss://').replace(/\/api\/?$/, '/ws/orders/');
      } else if (baseUrl && baseUrl.startsWith('http://')) {
        // Replace http:// with ws:// and /api or /api/ with /ws/orders/
        wsUrl = baseUrl.replace('http://', 'ws://').replace(/\/api\/?$/, '/ws/orders/');
      } else {
        // Fallback: ใช้ hostname ปัจจุบัน
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        wsUrl = `${protocol}//${hostname}:8000/ws/orders/`;
        console.warn('⚠️ Using fallback WebSocket URL:', wsUrl);
      }
      
      const fullWsUrl = `${wsUrl}?token=${token}`;
      
      // ปิด connection เก่าก่อน (ถ้ามี)
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          // Ignore close errors
        }
      }
      
      console.log('🔗 Connecting to WebSocket:', wsUrl.replace(/\?token=.*$/, '?token=***'));
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
          console.log(`🔌 WebSocket closed with code ${event.code}, attempting reconnect...`);
          this.reconnect(token);
        }
      };
      
      this.ws.onerror = () => {
        const now = Date.now();
        if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'main_ws_error') {
          logWebSocketTransportFailure('orders (auth)', wsUrl);
          this.lastErrorLogTime = now;
          this.lastErrorType = 'main_ws_error';
        }
        // onclose จะถูกเรียกต่อจากนี้แล้วค่อย reconnect
      };
      
    } catch (error) {
      // Throttle error logging เพื่อไม่ให้ log ซ้ำๆ
      const now = Date.now();
      if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'main_ws_connect_error') {
        console.error('Error connecting to WebSocket:', error);
        this.lastErrorLogTime = now;
        this.lastErrorType = 'main_ws_connect_error';
      }
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
      const baseUrl = API_CONFIG.BASE_URL;

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

          ws.onerror = () => {
            clearTimeout(connectionTimeout);
            const now = Date.now();
            if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'guest_ws_connect_error') {
              logWebSocketTransportFailure('guest-orders', wsUrl);
              this.lastErrorLogTime = now;
              this.lastErrorType = 'guest_ws_connect_error';
            }
            ws.close();
            reject(new Error('WebSocket guest connection failed'));
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
          // Throttle error logging เพื่อไม่ให้ log ซ้ำๆ
          const now = Date.now();
          if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'guest_ws_failed') {
            console.error('❌ Failed to connect to WebSocket:', error);
            this.lastErrorLogTime = now;
            this.lastErrorType = 'guest_ws_failed';
          }
          this.reconnectGuest();
        });

    } catch (error) {
      // Throttle error logging เพื่อไม่ให้ log ซ้ำๆ
      const now = Date.now();
      if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'guest_ws_init_error') {
        console.error('Error connecting to Guest WebSocket:', error);
        this.lastErrorLogTime = now;
        this.lastErrorType = 'guest_ws_init_error';
      }
    }
  }

  // WebSocket สำหรับ dine-in (ไม่ต้องใช้ token) ใช้ subscribe ด้วย session_id
  connectDineIn() {
    try {
      // ถ้ามี connection อยู่แล้วและยังเปิดอยู่ ให้ไม่เชื่อมต่อใหม่
      if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
        console.log('ℹ️ Dine-in WebSocket already connected, skipping new connection');
        // ถ้ามี sessionId รออยู่ ให้ subscribe ทันที
        if (this.dineInSessionId) {
          this.subscribeToDineInSession(this.dineInSessionId);
        }
        if (this.dineInRestaurantId) {
          this.subscribeToDineInRestaurant(this.dineInRestaurantId);
        }
        return;
      }

      // ถ้ามี connection อยู่แต่ยังกำลังเชื่อมต่อ ให้รอ
      if (this.dineInWs && this.dineInWs.readyState === WebSocket.CONNECTING) {
        console.log('ℹ️ Dine-in WebSocket connection in progress, skipping new connection');
        return;
      }

      // ปิด connection เก่าก่อน (ถ้ามีและปิดแล้ว)
      if (this.dineInWs && this.dineInWs.readyState === WebSocket.CLOSED) {
        this.dineInWs = null;
      }

      const baseUrl = API_CONFIG.BASE_URL;
      let wsUrl;
      
      if (baseUrl && baseUrl.startsWith('https://')) {
        wsUrl = baseUrl.replace('https://', 'wss://').replace(/\/api\/?$/, '/ws/dine-in-orders/');
      } else if (baseUrl && baseUrl.startsWith('http://')) {
        wsUrl = baseUrl.replace('http://', 'ws://').replace(/\/api\/?$/, '/ws/dine-in-orders/');
      } else {
        // Fallback: ใช้ hostname ปัจจุบัน
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        wsUrl = `${protocol}//${hostname}:8000/ws/dine-in-orders/`;
        console.warn('⚠️ Using fallback Dine-in WebSocket URL:', wsUrl);
      }

      console.log('🔗 Connecting to Dine-in WebSocket:', wsUrl);
      this.dineInWs = new WebSocket(wsUrl);

      this.dineInWs.onopen = () => {
        // subscribe ทันทีถ้ามี sessionId
        if (this.dineInSessionId) {
          this.subscribeToDineInSession(this.dineInSessionId);
        }
        if (this.dineInRestaurantId) {
          this.subscribeToDineInRestaurant(this.dineInRestaurantId);
        }
      };

      this.dineInWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing dine-in WebSocket message:', error);
        }
      };

      this.dineInWs.onclose = () => {
        // ไม่ทำ reconnect อัตโนมัติแบบ aggressive เพื่อกัน loop; ให้ client setDineInSessionId ใหม่เมื่อจำเป็น
      };

      this.dineInWs.onerror = () => {
        const now = Date.now();
        if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'dine_in_ws_error') {
          logWebSocketTransportFailure('dine-in', wsUrl);
          this.lastErrorLogTime = now;
          this.lastErrorType = 'dine_in_ws_error';
        }
      };
    } catch (error) {
      const now = Date.now();
      if (now - this.lastErrorLogTime > this.errorLogThrottle || this.lastErrorType !== 'dine_in_ws_connect_error') {
        console.error('Error connecting to dine-in WebSocket:', error);
        this.lastErrorLogTime = now;
        this.lastErrorType = 'dine_in_ws_connect_error';
      }
    }
  }

  subscribeToDineInSession(sessionId) {
    if (!sessionId) return;
    if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
      this.dineInWs.send(JSON.stringify({
        type: 'subscribe_dine_in_session',
        payload: { session_id: sessionId },
      }));
    }
  }

  subscribeToDineInRestaurant(restaurantId) {
    if (!restaurantId) return;
    if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
      this.dineInWs.send(JSON.stringify({
        type: 'subscribe_dine_in_restaurant',
        payload: { restaurant_id: restaurantId },
      }));
    }
  }

  // ส่งคำขอเช็กบิลผ่าน WebSocket
  requestBill(sessionId) {
    if (!sessionId) {
      console.error('requestBill: sessionId is required');
      return Promise.reject(new Error('sessionId is required'));
    }
    
    return new Promise((resolve, reject) => {
      if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
        try {
          this.dineInWs.send(JSON.stringify({
            type: 'request_bill',
            payload: { session_id: sessionId },
          }));
          console.log(`📤 Bill request sent via WebSocket for session: ${sessionId}`);
          resolve();
        } catch (error) {
          console.error('❌ Error sending bill request:', error);
          reject(error);
        }
      } else {
        console.warn('⚠️ Dine-in WebSocket not connected, attempting to connect and retry...');
        
        // ตั้งค่า sessionId ก่อน
        this.dineInSessionId = sessionId;
        
        // เชื่อมต่อใหม่
        this.connectDineIn();
        
        // รอให้เชื่อมต่อแล้วค่อยส่งคำขอ
        let retryCount = 0;
        const maxRetries = 10;
        const checkInterval = setInterval(() => {
          retryCount++;
          
          if (this.dineInWs && this.dineInWs.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            try {
              this.dineInWs.send(JSON.stringify({
                type: 'request_bill',
                payload: { session_id: sessionId },
              }));
              console.log(`📤 Bill request sent via WebSocket for session: ${sessionId} (after reconnect)`);
              resolve();
            } catch (error) {
              console.error('❌ Error sending bill request after reconnect:', error);
              reject(error);
            }
          } else if (retryCount >= maxRetries) {
            clearInterval(checkInterval);
            const error = new Error('Failed to connect Dine-in WebSocket after multiple attempts');
            console.error('❌', error.message);
            reject(error);
          }
        }, 300);
      }
    });
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

  // เพิ่มฟังก์ชันสำหรับ subscribe หลาย guest orders พร้อมกัน
  subscribeToMultipleGuestOrders(temporaryIds) {
    if (!Array.isArray(temporaryIds) || temporaryIds.length === 0) {
      console.warn('subscribeToMultipleGuestOrders: temporaryIds must be a non-empty array');
      return;
    }

    if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
      console.log(`📡 Subscribing to ${temporaryIds.length} guest orders:`, temporaryIds);
      // Subscribe ทุก temporary_id
      temporaryIds.forEach((temporaryId) => {
        this.subscribeToGuestOrder(temporaryId);
      });
    } else {
      console.log(`⚠️ Cannot subscribe to multiple guest orders: WebSocket not connected`);
      // ถ้า WebSocket ไม่เชื่อมต่อ ให้เชื่อมต่อใหม่
      if (!this.guestWs || this.guestWs.readyState === WebSocket.CLOSED) {
        console.log('🔄 Attempting to connect WebSocket for multiple subscriptions...');
        this.connectGuest();
        
        // รอให้เชื่อมต่อแล้วค่อย subscribe
        setTimeout(() => {
          if (this.guestWs && this.guestWs.readyState === WebSocket.OPEN) {
            console.log(`📡 Retrying subscription to ${temporaryIds.length} guest orders`);
            temporaryIds.forEach((temporaryId) => {
              this.subscribeToGuestOrder(temporaryId);
            });
          } else {
            console.log(`❌ Failed to subscribe to multiple guest orders after reconnection`);
          }
        }, 1000);
      }
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

  // Force reconnect with new token (used when login/logout)
  forceReconnect(token) {
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    // Disconnect existing connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Connect with new token
    if (token) {
      this.connect(token);
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
    
    // แปลสถานะก่อนส่งให้ listeners สำหรับ order_status_update, guest_order_status_update และ dine_in_order_status_update
    if (type === 'order_status_update' || type === 'guest_order_status_update' || type === 'dine_in_order_status_update') {
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

  // เพิ่มฟังก์ชันสำหรับ disconnect เฉพาะ dine-in WebSocket
  disconnectDineIn() {
    if (this.dineInWs) {
      // ปิด WebSocket อย่างเหมาะสม
      if (this.dineInWs.readyState === WebSocket.OPEN || this.dineInWs.readyState === WebSocket.CONNECTING) {
        this.dineInWs.close(1000, 'Dine-in session ended');
      }
      
      this.dineInWs = null;
      this.dineInSessionId = null;
      this.dineInRestaurantId = null;
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
