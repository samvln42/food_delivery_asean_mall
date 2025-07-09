import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from accounts.models import User
import logging

logger = logging.getLogger(__name__)

class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get token from query string
            query_string = self.scope['query_string'].decode('utf-8')
            logger.info(f"📝 WebSocket connection attempt, query: {query_string}")
            
            if 'token=' not in query_string:
                logger.error("❌ No token found in query string")
                await self.close()
                return
                
            token = query_string.split('token=')[-1]
            logger.info(f"🔑 Extracted token: {token[:20]}...")
            
            # Authenticate user
            self.user = await self.get_user_from_token(token)
            
            if isinstance(self.user, AnonymousUser):
                logger.error("❌ WebSocket connection rejected: Invalid token")
                await self.close()
                return
            
            logger.info(f"✅ User authenticated: {self.user.id} ({self.user.username})")

            # Add user to their personal room
            self.room_name = f"user_{self.user.id}"
            self.room_group_name = f"orders_{self.room_name}"

            logger.info(f"🏠 Adding user to room: {self.room_group_name}")

            # Join personal room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            # If admin, also join the global admin room to receive new order notifications
            if getattr(self.user, 'role', '') == 'admin':
                await self.channel_layer.group_add(
                    "orders_admin",
                    self.channel_name
                )
                logger.info(f"👑 Admin user added to global admin room: orders_admin")

            # Accept connection
            await self.accept()
            logger.info(f"🎉 WebSocket connected successfully for user: {self.user.id}")
            
            # Send welcome message
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'WebSocket connection established successfully',
                'user_id': self.user.id,
                'room': self.room_group_name
            }))
            
        except Exception as e:
            logger.error(f"❌ Error during WebSocket connection: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        # If user was admin, also leave the admin room
        if hasattr(self, 'user') and getattr(self.user, 'role', '') == 'admin':
            await self.channel_layer.group_discard(
                "orders_admin",
                self.channel_name
            )
        user_id = getattr(self, 'user', None)
        if user_id and hasattr(user_id, 'id'):
            logger.info(f"WebSocket disconnected for user: {user_id.id}")
        else:
            logger.info("WebSocket disconnected for unknown user")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            # Handle different message types
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # Handler for order status updates
    async def order_status_update(self, event):
        """Send order status update to WebSocket"""
        logger.info(f"📤 Sending order status update to WebSocket client")
        logger.info(f"📦 Order: {event['order_id']} - {event['old_status']} → {event['new_status']}")
        logger.info(f"👤 User: {event.get('user_id')}")
        
        message = {
            'type': 'order_status_update',
            'order_id': event['order_id'],
            'old_status': event['old_status'],
            'new_status': event['new_status'],
            'timestamp': event['timestamp'],
            'restaurant_name': event.get('restaurant_name', ''),
            'user_id': event.get('user_id')
        }
        
        logger.info(f"📨 Message content: {message}")
        
        try:
            await self.send(text_data=json.dumps(message))
            logger.info(f"✅ Message sent to WebSocket client successfully")
        except Exception as e:
            logger.error(f"❌ Error sending message to WebSocket client: {str(e)}")

    # Handler for new orders (for admin)
    async def new_order(self, event):
        """Send new order notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'order_id': event['order_id'],
            'customer_name': event['customer_name'],
            'restaurant_name': event['restaurant_name'],
            'total_amount': event['total_amount'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        """Get user from authentication token"""
        try:
            token = Token.objects.select_related('user').get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return AnonymousUser()

# Utility function to send order updates via WebSocket
async def send_order_status_update(user_id, order_id, old_status, new_status, restaurant_name=''):
    """Send order status update to specific user"""
    from channels.layers import get_channel_layer
    from django.utils import timezone
    
    channel_layer = get_channel_layer()
    room_group_name = f"orders_user_{user_id}"
    
    await channel_layer.group_send(
        room_group_name,
        {
            'type': 'order_status_update',
            'order_id': order_id,
            'old_status': old_status,
            'new_status': new_status,
            'timestamp': timezone.now().isoformat(),
            'restaurant_name': restaurant_name,
            'user_id': user_id
        }
    )
    logger.info(f"Sent order status update: Order {order_id} -> {new_status} for user {user_id}")

# Utility function to send new order notifications to admins
async def send_new_order_notification(order_id, customer_name, restaurant_name, total_amount):
    """Send new order notification to all admin users"""
    from channels.layers import get_channel_layer
    from django.utils import timezone
    
    channel_layer = get_channel_layer()
    
    # Send to admin room (all users with is_staff=True)
    await channel_layer.group_send(
        "orders_admin",
        {
            'type': 'new_order',
            'order_id': order_id,
            'customer_name': customer_name,
            'restaurant_name': restaurant_name,
            'total_amount': str(total_amount),
            'timestamp': timezone.now().isoformat()
        }
    )
    logger.info(f"Sent new order notification: Order {order_id} to admin") 