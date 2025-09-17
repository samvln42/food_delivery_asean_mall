import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import websocketService from '../../services/websocket';

const CustomerWebSocketBridge = () => {
  const { user, token } = useAuth();

  useEffect(() => {
    // console.log('🔄 CustomerWebSocketBridge useEffect triggered');
    // console.log('👤 User:', user);
    // console.log('🔑 Token exists:', !!token);
    // console.log('🎭 User role:', user?.role);
    
    // Only connect if user is a customer
    if (user && token && user.role === 'customer') {
      // console.log('🔌 CustomerWebSocketBridge: Connecting WebSocket for customer:', user.id);
      // console.log('🌐 Current WebSocket state:', websocketService.ws?.readyState);
      
      // Check if WebSocket is not connected or closed
      if (!websocketService.ws || websocketService.ws.readyState === WebSocket.CLOSED) {
        // console.log('🚀 CustomerWebSocketBridge: Starting WebSocket connection');
        websocketService.connect(token);
      }
    }

    // Cleanup on unmount or user change
    return () => {
      if (!user || user.role !== 'customer') {
        // console.log('🔌 CustomerWebSocketBridge: Disconnecting WebSocket');
        websocketService.disconnect();
      }
    };
  }, [user, token]);

  // This component doesn't render anything
  return null;
};

export default CustomerWebSocketBridge; 