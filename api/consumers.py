import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from accounts.models import User
from api.models import DineInOrder, DineInOrderDetail
from django.utils import timezone
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
            
            # If restaurant, join restaurant rooms (for new orders and bill requests)
            if getattr(self.user, 'role', '') in ['special_restaurant', 'general_restaurant']:
                # ใช้ sync_to_async เพื่อเข้าถึง related object
                restaurant = await self.get_user_restaurant(self.user)
                if restaurant:
                    restaurant_id = restaurant.restaurant_id
                    
                    # Join restaurant group for new order notifications
                    restaurant_group = f"restaurant_{restaurant_id}"
                    await self.channel_layer.group_add(
                        restaurant_group,
                        self.channel_name
                    )
                    logger.info(f"🍽️ Restaurant user added to orders room: {restaurant_group}")
                    
                    # Join restaurant bill requests group
                    restaurant_bill_group = f"restaurant_{restaurant_id}_bill_requests"
                    await self.channel_layer.group_add(
                        restaurant_bill_group,
                        self.channel_name
                    )
                    # Cache restaurant ใน user object เพื่อใช้ใน disconnect
                    self.user._state.fields_cache['restaurant'] = restaurant
                    logger.info(f"🍽️ Restaurant user added to bill requests room: {restaurant_bill_group}")

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
        # If user was restaurant, leave restaurant rooms
        if hasattr(self, 'user') and getattr(self.user, 'role', '') in ['special_restaurant', 'general_restaurant']:
            # ใช้ _state.fields_cache เพื่อหลีกเลี่ยง database query
            try:
                restaurant = self.user._state.fields_cache.get('restaurant')
                if restaurant:
                    restaurant_id = restaurant.restaurant_id
                    
                    # Leave restaurant orders group
                    restaurant_group = f"restaurant_{restaurant_id}"
                    await self.channel_layer.group_discard(
                        restaurant_group,
                        self.channel_name
                    )
                    
                    # Leave restaurant bill requests group
                    restaurant_bill_group = f"restaurant_{restaurant_id}_bill_requests"
                    await self.channel_layer.group_discard(
                        restaurant_bill_group,
                        self.channel_name
                    )
            except (AttributeError, KeyError):
                # ถ้าไม่มี cache ก็ข้าม
                pass
        user_id = getattr(self, 'user', None)
        if user_id and hasattr(user_id, 'id'):
            logger.info(f"WebSocket disconnected for user: {user_id.id}")
        else:
            logger.info("WebSocket disconnected for unknown user")
    
    @database_sync_to_async
    def get_user_restaurant(self, user):
        """Get restaurant for user"""
        try:
            if hasattr(user, 'restaurant'):
                return user.restaurant
        except Exception:
            pass
        return None

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
    
    # Handler for new dine-in orders (for restaurant)
    async def new_dine_in_order(self, event):
        """Send new dine-in order notification to WebSocket"""
        logger.info(f"📤 Sending new dine-in order notification to restaurant WebSocket client")
        message = {
            'type': 'new_dine_in_order',
            'order_id': event.get('order_id'),
            'table_number': event.get('table_number'),
            'total_amount': event.get('total_amount'),
            'customer_count': event.get('customer_count'),
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }
        try:
            await self.send(text_data=json.dumps(message))
            logger.info(f"✅ New dine-in order notification sent successfully")
        except Exception as e:
            logger.error(f"❌ Error sending new dine-in order notification: {str(e)}")
    
    # Handler for bill requests (for restaurant)
    async def bill_request(self, event):
        """Send bill request notification to WebSocket"""
        logger.info(f"📤 Sending bill request notification to restaurant WebSocket client")
        message = {
            'type': 'bill_request',
            'restaurant_id': event.get('restaurant_id'),
            'table_number': event.get('table_number'),
            'session_id': event.get('session_id'),
            'order_ids': event.get('order_ids', []),
            'orders_count': event.get('orders_count', 0),
            'timestamp': event.get('timestamp')
        }
        try:
            await self.send(text_data=json.dumps(message))
            logger.info(f"✅ Bill request notification sent successfully")
        except Exception as e:
            logger.error(f"❌ Error sending bill request notification: {str(e)}")

    # Handler for dine-in item cancelled by customer (for restaurant)
    async def dine_in_item_cancelled(self, event):
        """Send dine-in item cancelled notification to restaurant WebSocket"""
        message = {
            'type': 'dine_in_item_cancelled',
            'restaurant_id': event.get('restaurant_id'),
            'table_number': event.get('table_number'),
            'order_id': event.get('order_id'),
            'order_detail_id': event.get('order_detail_id'),
            'order_cancelled': event.get('order_cancelled', False),
            'timestamp': event.get('timestamp')
        }
        try:
            await self.send(text_data=json.dumps(message))
        except Exception as e:
            logger.error(f"❌ Error sending dine_in_item_cancelled notification: {str(e)}")

    # Handler for new guest orders (for admin)
    async def new_guest_order(self, event):
        """Send new guest order notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_guest_order',
            'order_id': event['order_id'],
            'temporary_id': event['temporary_id'],
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

# Utility function to send new guest order notifications to admins
async def send_new_guest_order_notification(order_id, temporary_id, customer_name, restaurant_name, total_amount):
    """Send new guest order notification to all admin users"""
    from channels.layers import get_channel_layer
    from django.utils import timezone
    
    channel_layer = get_channel_layer()
    
    # Send to admin room (all users with is_staff=True)
    await channel_layer.group_send(
        "orders_admin",
        {
            'type': 'new_guest_order',
            'order_id': order_id,
            'temporary_id': temporary_id,
            'customer_name': customer_name,
            'restaurant_name': restaurant_name,
            'total_amount': str(total_amount),
            'timestamp': timezone.now().isoformat()
        }
    )
    logger.info(f"Sent new guest order notification: Order {order_id} (temp: {temporary_id}) to admin")


class GuestOrderConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer สำหรับ guest orders ที่ไม่ต้องใช้ token"""
    
    async def connect(self):
        try:
            logger.info("🔗 Guest WebSocket connection attempt")
            logger.info(f"📝 Connection scope: {self.scope}")
            
            # Accept connection immediately for guest orders
            await self.accept()
            logger.info("✅ Guest WebSocket connected successfully")
            
            # Send welcome message
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Guest WebSocket connection established successfully'
            }))
            
        except Exception as e:
            logger.error(f"❌ Error during Guest WebSocket connection: {str(e)}")
            logger.error(f"❌ Error details: {type(e).__name__}: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        logger.info(f"🔌 Guest WebSocket disconnected, code: {close_code}")

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
            elif message_type == 'subscribe_guest_order':
                # Subscribe to specific guest order updates
                # Subscribe to specific guest order updates
                temporary_id = text_data_json.get('payload', {}).get('temporary_id') or text_data_json.get('temporary_id')
                if temporary_id:
                    if temporary_id == 'all':
                        # Subscribe to all guest order updates
                        room_group_name = "guest_orders_all"
                        await self.channel_layer.group_add(
                            room_group_name,
                            self.channel_name
                        )
                        logger.info(f"🔗 Guest subscribed to all orders")
                    else:
                        # Subscribe to specific guest order
                        room_group_name = f"guest_order_{temporary_id}"
                        await self.channel_layer.group_add(
                            room_group_name,
                            self.channel_name
                        )
                        logger.info(f"🔗 Guest subscribed to order: {temporary_id}")
            else:
                logger.warning(f"Unknown guest message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in guest WebSocket")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # Handler for guest order status updates
    async def guest_order_status_update(self, event):
        """Send guest order status update to WebSocket"""
        logger.info(f"📤 Sending guest order status update to WebSocket client")
        logger.info(f"📦 Guest Order: {event['temporary_id']} - {event['old_status']} → {event['new_status']}")
        
        message = {
            'type': 'guest_order_status_update',
            'temporary_id': event['temporary_id'],
            'order_id': event['order_id'],
            'old_status': event['old_status'],
            'new_status': event['new_status'],
            'note': event.get('note', ''),
            'timestamp': event['timestamp']
        }
        
        logger.info(f"📨 Guest message content: {message}")
        
        try:
            await self.send(text_data=json.dumps(message))
            logger.info(f"✅ Guest message sent to WebSocket client successfully")
        except Exception as e:
            logger.error(f"❌ Error sending guest message to WebSocket client: {str(e)}")

    # Handler for new guest orders (for admin)
    async def new_guest_order(self, event):
        """Send new guest order notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_guest_order',
            'order_id': event['order_id'],
            'temporary_id': event['temporary_id'],
            'customer_name': event['customer_name'],
            'restaurant_name': event['restaurant_name'],
            'total_amount': event['total_amount'],
            'timestamp': event['timestamp']
        })) 


class DineInOrderConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer สำหรับ dine-in ลูกค้า (ไม่ต้อง login)

    Client จะส่ง message:
    {
      "type": "subscribe_dine_in_session",
      "payload": { "session_id": "SESSION-..." }
    }

    แล้ว server จะ join group: dine_in_session_{session_id}
    """

    async def connect(self):
        try:
            logger.info("🔗 Dine-in WebSocket connection attempt")
            await self.accept()
            logger.info("✅ Dine-in WebSocket connected successfully")

            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Dine-in WebSocket connection established successfully'
            }))
        except Exception as e:
            logger.error(f"❌ Error during Dine-in WebSocket connection: {type(e).__name__}: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            # leave all subscribed groups
            for group_name in getattr(self, 'subscribed_groups', set()):
                await self.channel_layer.group_discard(group_name, self.channel_name)
        except Exception:
            pass
        logger.info(f"🔌 Dine-in WebSocket disconnected, code: {close_code}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
                return

            if message_type == 'subscribe_dine_in_session':
                payload = text_data_json.get('payload', {}) or {}
                session_id = payload.get('session_id') or text_data_json.get('session_id')

                if not session_id:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'session_id is required'
                    }))
                    return

                group_name = f"dine_in_session_{session_id}"
                await self.channel_layer.group_add(group_name, self.channel_name)

                if not hasattr(self, 'subscribed_groups'):
                    self.subscribed_groups = set()
                self.subscribed_groups.add(group_name)

                logger.info(f"🔗 Dine-in subscribed to session: {session_id}")

                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'session_id': session_id
                }))
                return

            if message_type == 'subscribe_dine_in_restaurant':
                payload = text_data_json.get('payload', {}) or {}
                restaurant_id = payload.get('restaurant_id') or text_data_json.get('restaurant_id')

                if not restaurant_id:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'restaurant_id is required'
                    }))
                    return

                group_name = f"dine_in_restaurant_{restaurant_id}"
                await self.channel_layer.group_add(group_name, self.channel_name)

                if not hasattr(self, 'subscribed_groups'):
                    self.subscribed_groups = set()
                self.subscribed_groups.add(group_name)

                logger.info(f"🍽️ Dine-in subscribed to restaurant: {restaurant_id}")

                await self.send(text_data=json.dumps({
                    'type': 'subscribed_restaurant',
                    'restaurant_id': restaurant_id
                }))
                return

            if message_type == 'request_bill':
                payload = text_data_json.get('payload', {}) or {}
                session_id = payload.get('session_id') or text_data_json.get('session_id')

                if not session_id:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'session_id is required'
                    }))
                    return

                # Process bill request
                result = await self.process_bill_request(session_id)
                
                if result.get('success'):
                    await self.send(text_data=json.dumps({
                        'type': 'bill_request_sent',
                        'message': result.get('message'),
                        'orders_count': result.get('orders_count'),
                        'session_id': session_id
                    }))
                else:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': result.get('error', 'Failed to request bill')
                    }))
                return

            logger.warning(f"Unknown dine-in message type: {message_type}")

        except json.JSONDecodeError:
            logger.error("Invalid JSON received in dine-in WebSocket")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def process_bill_request(self, session_id):
        """Process bill request and broadcast to restaurant"""
        try:
            # หาออเดอร์ของ session นี้เพื่ออ้างอิงโต๊ะ
            session_orders = await self.get_orders_for_bill_request(session_id)

            if not session_orders:
                return {
                    'success': False,
                    'error': 'No unpaid orders found for this session'
                }

            # Get restaurant and table info from first order
            restaurant = session_orders[0].restaurant
            table = session_orders[0].table
            table_number = table.table_number if table else None

            if not table:
                return {
                    'success': False,
                    'error': 'Table not found for this session'
                }

            # ต้องเช็กทั้งโต๊ะ: ถ้ายังมีรายการที่ยังไม่เสิร์ฟ -> ห้ามเช็กบิล
            table_orders = await self.get_table_orders_for_bill_request(table.table_id)
            order_ids_for_check = [order.dine_in_order_id for order in table_orders]
            has_unserved_items = await self.has_unserved_items_in_orders(order_ids_for_check)
            has_orders_without_details_not_served = await self.has_orders_without_details_not_served(order_ids_for_check)

            if has_unserved_items or has_orders_without_details_not_served:
                return {
                    'success': False,
                    'error': 'Cannot request bill: some items in this table are not served yet'
                }

            # อัปเดตสถานะการร้องขอเช็กบิล
            now = timezone.now()
            order_ids = []
            for order in table_orders:
                order.bill_requested = True
                order.bill_requested_at = now
                await self.save_order(order)
                order_ids.append(order.dine_in_order_id)

            # Broadcast to restaurant
            channel_layer = get_channel_layer()
            restaurant_group = f"restaurant_{restaurant.restaurant_id}_bill_requests"
            
            await channel_layer.group_send(
                restaurant_group,
                {
                    'type': 'bill_request',
                    'restaurant_id': restaurant.restaurant_id,
                    'table_number': table_number,
                    'session_id': session_id,
                    'order_ids': order_ids,
                    'orders_count': len(table_orders),
                    'timestamp': now.isoformat()
                }
            )

            logger.info(f"📢 Bill request broadcasted to restaurant {restaurant.restaurant_id} for table {table_number}")

            return {
                'success': True,
                'message': f'Bill request sent for {len(table_orders)} order(s)',
                'orders_count': len(table_orders),
                'restaurant_id': restaurant.restaurant_id,
                'table_number': table_number
            }

        except Exception as e:
            logger.error(f"❌ Error processing bill request: {type(e).__name__}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @database_sync_to_async
    def get_orders_for_bill_request(self, session_id):
        """Get orders for bill request"""
        return list(DineInOrder.objects.filter(
            session_id=session_id,
            payment_status='unpaid',
            current_status__in=['pending', 'confirmed', 'served']
        ).select_related('restaurant', 'table'))

    @database_sync_to_async
    def get_table_orders_for_bill_request(self, table_id):
        """Get all unpaid orders for a table for bill request validation"""
        return list(DineInOrder.objects.filter(
            table_id=table_id,
            payment_status='unpaid',
            current_status__in=['pending', 'confirmed', 'served']
        ).select_related('restaurant', 'table'))

    @database_sync_to_async
    def has_unserved_items_in_orders(self, order_ids):
        """Check if any order detail in the given orders is not served yet"""
        return DineInOrderDetail.objects.filter(
            order_id__in=order_ids,
            is_served=False
        ).exists()

    @database_sync_to_async
    def has_orders_without_details_not_served(self, order_ids):
        """Fallback check for orders without details: they must be served"""
        return DineInOrder.objects.filter(
            dine_in_order_id__in=order_ids,
            order_details__isnull=True
        ).exclude(
            current_status='served'
        ).exists()

    @database_sync_to_async
    def save_order(self, order):
        """Save order"""
        order.save()

    async def dine_in_order_status_update(self, event):
        """Send dine-in order status update to WebSocket client"""
        message = {
            'type': 'dine_in_order_status_update',
            'order_id': event.get('order_id'),
            'old_status': event.get('old_status'),
            'new_status': event.get('new_status'),
            'note': event.get('note', ''),
            'timestamp': event.get('timestamp')
        }
        try:
            await self.send(text_data=json.dumps(message))
        except Exception as e:
            logger.error(f"❌ Error sending dine-in message: {type(e).__name__}: {str(e)}")
    
    async def bill_check_completed(self, event):
        """Send bill check completed notification to customer"""
        message = {
            'type': 'bill_check_completed',
            'session_id': event.get('session_id'),
            'order_id': event.get('order_id'),
            'message': event.get('message', 'ร้านเช็กบิลเสร็จแล้ว'),
            'timestamp': event.get('timestamp')
        }
        try:
            await self.send(text_data=json.dumps(message))
            logger.info(f"✅ Bill check completed notification sent to customer")
        except Exception as e:
            logger.error(f"❌ Error sending bill check completed notification: {type(e).__name__}: {str(e)}")

    async def dine_in_product_changed(self, event):
        """Send dine-in product update/delete notification to customer"""
        message = {
            'type': 'dine_in_product_changed',
            'action': event.get('action'),
            'restaurant_id': event.get('restaurant_id'),
            'dine_in_product_id': event.get('dine_in_product_id'),
            'is_available': event.get('is_available'),
            'timestamp': event.get('timestamp')
        }
        try:
            await self.send(text_data=json.dumps(message))
        except Exception as e:
            logger.error(f"❌ Error sending dine-in product changed notification: {type(e).__name__}: {str(e)}")
