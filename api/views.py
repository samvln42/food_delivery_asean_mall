from django.shortcuts import render
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from accounts.models import User
from .models import (
    Restaurant, Category, Product, Order, OrderDetail,
    Payment, Review, ProductReview, DeliveryStatusLog, Notification,
    SearchHistory, PopularSearch, UserFavorite, AnalyticsDaily,
    RestaurantAnalytics, ProductAnalytics, AppSettings, Language, Translation,
    GuestOrder, GuestOrderDetail, GuestDeliveryStatusLog
)
from .serializers import (
    RestaurantSerializer, CategorySerializer, ProductSerializer,
    OrderSerializer, CreateOrderSerializer, OrderDetailSerializer, PaymentSerializer,
    ReviewSerializer, ProductReviewSerializer, DeliveryStatusLogSerializer,
    NotificationSerializer, SearchHistorySerializer, PopularSearchSerializer,
    UserFavoriteSerializer, AnalyticsDailySerializer, RestaurantAnalyticsSerializer,
    ProductAnalyticsSerializer, MultiRestaurantOrderSerializer, AppSettingsSerializer,
    LanguageSerializer, TranslationSerializer, GuestOrderSerializer, 
    CreateGuestOrderSerializer, GuestOrderTrackingSerializer, GuestMultiRestaurantOrderSerializer
)


# -------------------- Health Check Endpoint --------------------
# ALB/ELB ใช้เรียกตรวจสอบสถานะเซิร์ฟเวอร์ ควรตอบ HTTP 200 เสมอ
@api_view(["GET", "HEAD"])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check view for load balancer."""
    return Response({"status": "ok"})


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['restaurant_name', 'description', 'address']
    ordering_fields = ['average_rating', 'created_at', 'restaurant_name']
    ordering = ['-average_rating']
    filterset_fields = ['status', 'is_special']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'products', 'reviews', 'analytics', 'special', 'nearby']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def products(self, request, pk=None):
        restaurant = self.get_object()
        products = restaurant.products.filter(is_available=True)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def reviews(self, request, pk=None):
        restaurant = self.get_object()
        reviews = restaurant.reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def analytics(self, request, pk=None):
        restaurant = self.get_object()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        analytics = restaurant.analytics.all()
        if date_from:
            analytics = analytics.filter(date__gte=date_from)
        if date_to:
            analytics = analytics.filter(date__lte=date_to)
        
        serializer = RestaurantAnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def special(self, request):
        queryset = Restaurant.objects.filter(is_special=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def nearby(self, request):
        # This is a placeholder for location-based search
        # In real implementation, you would use geographic queries
        queryset = Restaurant.objects.filter(status='open')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_image(self, request, pk=None):
        """อัปโหลดรูปภาพหน้าร้าน"""
        restaurant = self.get_object()
        
        # Check permissions (restaurant owner or admin only)
        if request.user.role == 'admin' or (hasattr(request.user, 'restaurant') and request.user.restaurant == restaurant):
            pass
        else:
            return Response({'error': 'You do not have permission to edit this restaurant'}, status=status.HTTP_403_FORBIDDEN)
        
        if 'image' not in request.FILES:
            return Response({'error': 'Please select an image file'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response({'error': 'Only JPG, PNG and GIF files are supported'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check file size (limit to 10MB for restaurant images)
        if image_file.size > 10 * 1024 * 1024:
            return Response({'error': 'File size must not exceed 10MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Upload file
        restaurant.image = image_file
        restaurant.save()
        
        serializer = RestaurantSerializer(restaurant, context={'request': request})
        return Response({
            'message': 'Restaurant image uploaded successfully',
            'restaurant': serializer.data
        })


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category_name']
    ordering_fields = ['category_name', 'category_id', 'sort_order']
    ordering = ['sort_order', 'category_name']
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # เพิ่มเพื่อรองรับ image upload
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'products']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Category.objects.all().order_by('sort_order', 'category_name')
        
        # กรองหมวดหมู่ตามประเภทร้าน
        restaurant_type = self.request.query_params.get('restaurant_type')
        if restaurant_type == 'general':
            # ร้านทั่วไป - แสดงเฉพาะหมวดหมู่ที่ไม่ใช่เฉพาะร้านพิเศษ
            queryset = queryset.filter(is_special_only=False)
        elif restaurant_type == 'special':
            # ร้านพิเศษ - แสดงหมวดหมู่ทั้งหมด (ไม่ต้องกรอง)
            pass
        
        return queryset
    
    def perform_create(self, serializer):
        """จัดการการสร้าง Category พร้อมรูปภาพ"""
        # ถ้ามีไฟล์รูปภาพใน request ให้เพิ่มเข้าไปใน serializer
        if 'image' in self.request.FILES:
            serializer.save(image=self.request.FILES['image'])
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """จัดการการอัปเดต Category พร้อมรูปภาพ"""
        # Debug: ดูว่า request มีข้อมูลอะไรบ้าง
        # print(f"🔍 Update request data: {dict(self.request.data)}")
        # print(f"🔍 Update request files: {dict(self.request.FILES)}")
        
        # ถ้ามีไฟล์รูปภาพใหม่ใน request ให้เพิ่มเข้าไปใน serializer
        if 'image' in self.request.FILES:
            # print(f"✅ Found new image file: {self.request.FILES['image'].name}")
            serializer.save(image=self.request.FILES['image'])
        else:
            # print("ℹ️  No new image file, saving without image update")
            serializer.save()
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def products(self, request, pk=None):
        category = self.get_object()
        products = category.products.filter(is_available=True)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product_name', 'description']
    ordering_fields = ['price', 'created_at', 'product_name']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'reviews']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Product.objects.all()
        
        # Filter by restaurant
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        # Filter by category
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by availability
        is_available = self.request.query_params.get('is_available')
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """ตรวจสอบว่าหมวดหมู่เข้ากันได้กับประเภทร้านก่อนสร้างสินค้า"""
        category = serializer.validated_data.get('category')
        restaurant = serializer.validated_data.get('restaurant')
        
        if category and restaurant:
            # Check if special category can be used with general restaurant
            if category.is_special_only and not restaurant.is_special:
                raise ValidationError({
                    'category': 'General restaurants cannot use special-only categories'
                })
        
        # ถ้ามีไฟล์รูปภาพใน request ให้เพิ่มเข้าไปใน serializer
        if 'image' in self.request.FILES:
            serializer.save(image=self.request.FILES['image'])
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """ตรวจสอบว่าหมวดหมู่เข้ากันได้กับประเภทร้านก่อนอัปเดตสินค้า"""
        category = serializer.validated_data.get('category')
        product = serializer.instance
        restaurant = product.restaurant
        
        if category:
            # Check if special category can be used with general restaurant
            if category.is_special_only and not restaurant.is_special:
                raise ValidationError({
                    'category': 'General restaurants cannot use special-only categories'
                })
        
        serializer.save()
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def reviews(self, request, pk=None):
        product = self.get_object()
        reviews = product.reviews.all()
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_image(self, request, pk=None):
        """อัปโหลดรูปภาพสินค้า"""
        product = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'Please select an image file'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response({'error': 'Only JPG, PNG and GIF files are supported'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check file size (limit to 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'File size must not exceed 5MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Upload file
        product.image = image_file
        product.save()
        
        serializer = ProductSerializer(product)
        return Response({
            'message': 'Product image uploaded successfully',
            'product': serializer.data
        })


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            return Order.objects.filter(user=user)
        elif user.role in ['special_restaurant', 'general_restaurant']:
            try:
                restaurant = user.restaurant
                return Order.objects.filter(restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Order.objects.none()
        else:  # admin
            return Order.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        elif self.action == 'multi':
            return MultiRestaurantOrderSerializer
        return OrderSerializer
    
    def create(self, request, *args, **kwargs):
        """สร้างคำสั่งซื้อจากร้านเดียว พร้อมข้อมูลการชำระเงิน"""
        try:
            # ตรวจสอบว่าส่งข้อมูลแบบ FormData หรือ JSON
            if 'order_data' in request.data:
                # ข้อมูลแบบ FormData
                order_data_str = request.data.get('order_data')
                payment_data_str = request.data.get('payment_data')
                proof_of_payment = request.FILES.get('proof_of_payment')
                
                if not order_data_str:
                    return Response({'error': 'order_data is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Parse JSON data
                import json
                order_data = json.loads(order_data_str)
                payment_data = json.loads(payment_data_str) if payment_data_str else {}
            else:
                # ข้อมูลแบบ JSON (backward compatibility)
                order_data = request.data
                payment_data = {}
                proof_of_payment = None
            
            # สร้าง order
            serializer = self.get_serializer(data=order_data)
            serializer.is_valid(raise_exception=True)
            order = serializer.save()
            
            # สร้าง Payment record หากมีข้อมูลการชำระเงิน
            if payment_data:
                payment = Payment.objects.create(
                    order=order,
                    amount_paid=payment_data.get('amount_paid', order.total_amount),
                    payment_method=payment_data.get('payment_method', 'bank_transfer'),
                    status=payment_data.get('status', 'pending'),
                    proof_of_payment=proof_of_payment
                )
                # print(f"✅ Payment record created for single order: {payment.payment_id}")
            
            # ส่ง notification ไปยังแอดมินทุกคน (ลูกค้าใช้ delivery_status_log แทน)
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    title='New Order Received',
                    message=f'Order #{order.order_id} was placed by {order.user.username}',
                    type='order',
                    related_order=order
                )

            # ส่ง WebSocket notification ไปยังกลุ่มแอดมิน
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "orders_admin",
                {
                    'type': 'new_order',
                    'order_id': order.order_id,
                    'customer_name': order.user.username,
                    'restaurant_name': order.restaurant.restaurant_name if order.restaurant else '',
                    'total_amount': str(order.total_amount),
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create order: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def multi(self, request):
        """สร้างคำสั่งซื้อจากหลายร้านในครั้งเดียว พร้อมข้อมูลการชำระเงิน"""
        try:
            # ดึงข้อมูลจาก FormData
            order_data_str = request.data.get('order_data')
            payment_data_str = request.data.get('payment_data')
            proof_of_payment = request.FILES.get('proof_of_payment')
            
            if not order_data_str:
                return Response({'error': 'order_data is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse JSON data
            import json
            order_data = json.loads(order_data_str)
            payment_data = json.loads(payment_data_str) if payment_data_str else {}
            
            # สร้าง order จากข้อมูล
            serializer = MultiRestaurantOrderSerializer(data=order_data)
            if serializer.is_valid():
                # สร้าง order จากหลายร้าน
                order = serializer.save()
                
                # สร้าง Payment record หากมีข้อมูลการชำระเงิน
                if payment_data:
                    payment = Payment.objects.create(
                        order=order,
                        amount_paid=payment_data.get('amount_paid', order.total_amount),
                        payment_method=payment_data.get('payment_method', 'bank_transfer'),
                        status=payment_data.get('status', 'pending'),
                        proof_of_payment=proof_of_payment
                    )
                    # print(f"✅ Payment record created: {payment.payment_id}")
                
                            # ส่ง notification ไปยังแอดมินทุกคน (ลูกค้าใช้ delivery_status_log แทน)
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    title='New Multi-Restaurant Order Received',
                    message=f'Multi-restaurant order #{order.order_id} was placed by {order.user.username}',
                    type='order',
                    related_order=order
                )

                # ส่ง WebSocket notification ไปยังกลุ่มแอดมิน
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    "orders_admin",
                    {
                        'type': 'new_order',
                        'order_id': order.order_id,
                        'customer_name': order.user.username,
                        'restaurant_name': 'Multi-Restaurant Order',
                        'total_amount': str(order.total_amount),
                        'timestamp': timezone.now().isoformat()
                    }
                )
                
                # ส่ง WebSocket notification
                if order.user:
                    channel_layer = get_channel_layer()
                    room_group_name = f"orders_user_{order.user.id}"
                    
                    async_to_sync(channel_layer.group_send)(
                        room_group_name,
                        {
                            'type': 'order_status_update',
                            'order_id': order.order_id,
                            'old_status': '',
                            'new_status': order.current_status,
                            'timestamp': timezone.now().isoformat(),
                            'restaurant_name': 'Multi-Restaurant Order',
                            'user_id': order.user.id
                        }
                    )
                
                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to create multi-restaurant order: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        old_status = order.current_status
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order status
        order.current_status = new_status
        order.save()
        
        # Create status log
        DeliveryStatusLog.objects.create(
            order=order,
            status=new_status,
            updated_by_user=request.user
        )
        
        # ไม่ส่ง notification ให้ customer (ใช้ delivery_status_log แทน)
        
        # Send WebSocket notification to customer
        if order.user:
            channel_layer = get_channel_layer()
            room_group_name = f"orders_user_{order.user.id}"
            
            # print(f"🚀 Sending WebSocket update to room: {room_group_name}")
            # print(f"📦 Order {order.order_id}: {old_status} → {new_status}")
            # print(f"👤 User: {order.user.id} ({order.user.username})")
            
            try:
                async_to_sync(channel_layer.group_send)(
                    room_group_name,
                    {
                        'type': 'order_status_update',
                        'order_id': order.order_id,
                        'old_status': old_status,
                        'new_status': new_status,
                        'timestamp': timezone.now().isoformat(),
                        'restaurant_name': order.restaurant.restaurant_name if order.restaurant else 'Multi-Restaurant Order',
                        'user_id': order.user.id
                    }
                )
                # print(f"✅ WebSocket message sent successfully")
            except Exception as e:
                # print(f"❌ Error sending WebSocket message: {str(e)}")
                pass
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['get'])
    def status_logs(self, request, pk=None):
        order = self.get_object()
        logs = order.status_logs.all()
        serializer = DeliveryStatusLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        old_status = order.current_status
        
        if order.current_status in ['completed', 'cancelled']:
            return Response({'error': 'Cannot cancel this order'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.current_status = 'cancelled'
        order.save()
        
        # Create status log
        DeliveryStatusLog.objects.create(
            order=order,
            status='cancelled',
            updated_by_user=request.user
        )
        
        # Send WebSocket notification to customer
        if order.user:
            channel_layer = get_channel_layer()
            room_group_name = f"orders_user_{order.user.id}"
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'order_status_update',
                    'order_id': order.order_id,
                    'old_status': old_status,
                    'new_status': 'cancelled',
                    'timestamp': timezone.now().isoformat(),
                    'restaurant_name': order.restaurant.restaurant_name if order.restaurant else '',
                    'user_id': order.user.id
                }
            )
        
        return Response(OrderSerializer(order).data)
    
    def destroy(self, request, pk=None):
        """ลบออเดอร์ (เฉพาะแอดมิน)"""
        # ตรวจสอบ permission - เฉพาะ admin เท่านั้น
        if request.user.role != 'admin':
            return Response(
                {'error': 'เฉพาะแอดมินเท่านั้นที่สามารถลบออเดอร์ได้'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        order_id = order.order_id
        customer_user = order.user
        
        # ส่งการแจ้งเตือนให้ลูกค้าก่อนลบ (ถ้าเป็นคำสั่งซื้อของผู้ใช้ที่ล็อกอิน)
        if customer_user:
            channel_layer = get_channel_layer()
            room_group_name = f"orders_user_{customer_user.id}"
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'order_deleted',
                    'order_id': order_id,
                    'message': 'คำสั่งซื้อของคุณถูกลบโดยระบบ',
                    'timestamp': timezone.now().isoformat(),
                    'restaurant_name': order.restaurant.restaurant_name if order.restaurant else '',
                    'user_id': customer_user.id
                }
            )
        
        # ลบออเดอร์ (Django จะลบข้อมูลที่เกี่ยวข้องอัตโนมัติเพราะ CASCADE)
        order.delete()
        
        return Response(
            {
                'success': True, 
                'message': f'ลบออเดอร์ #{order_id} เรียบร้อยแล้ว'
            },
            status=status.HTTP_200_OK
        )

    def perform_update(self, serializer):
        """Override to send WebSocket notification when order status changes via PUT/PATCH"""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from django.utils import timezone
        
        # Keep old status before saving
        instance = self.get_object()
        old_status = instance.current_status
        
        # Save changes
        updated_order = serializer.save()
        new_status = updated_order.current_status
        
        # If status changed, notify customer via WebSocket
        if old_status != new_status and updated_order.user:
            channel_layer = get_channel_layer()
            room_group_name = f"orders_user_{updated_order.user.id}"
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "order_status_update",
                    "order_id": updated_order.order_id,
                    "old_status": old_status,
                    "new_status": new_status,
                    "timestamp": timezone.now().isoformat(),
                    "restaurant_name": updated_order.restaurant.restaurant_name if updated_order.restaurant else "",
                    "user_id": updated_order.user.id,
                },
            )
        
        return updated_order


class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = OrderDetail.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = OrderDetail.objects.all()
        
        # Filter by order
        order_id = self.request.query_params.get('order_id')
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        # Filter by product
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Check permissions
        user = self.request.user
        if user.role == 'customer':
            # Customers can only see their own order details
            queryset = queryset.filter(order__user=user)
        elif user.role in ['special_restaurant', 'general_restaurant']:
            # Restaurant owners can see order details for their restaurant
            try:
                restaurant = user.restaurant
                queryset = queryset.filter(order__restaurant=restaurant)
            except Restaurant.DoesNotExist:
                queryset = OrderDetail.objects.none()
        
        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            return Payment.objects.filter(order__user=user)
        elif user.role in ['special_restaurant', 'general_restaurant']:
            try:
                restaurant = user.restaurant
                return Payment.objects.filter(order__restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Payment.objects.none()
        else:  # admin
            return Payment.objects.all()
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'completed'
        payment.save()
        
        # Update order status
        order = payment.order
        order.current_status = 'paid'
        order.save()
        
        # ไม่ส่ง notification ให้ customer (ใช้ delivery_status_log แทน)
        
        return Response(PaymentSerializer(payment).data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-review_date']  # เรียงตามวันที่รีวิวล่าสุด
    
    def get_queryset(self):
        queryset = Review.objects.all()
        
        # Filter by restaurant
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        order_id = request.data.get('order')
        
        # Check if order has already been reviewed
        if Review.objects.filter(order_id=order_id).exists():
            return Response({'error': 'This order has already been reviewed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        response = super().create(request, *args, **kwargs)
        
        # Update order as reviewed
        if response.status_code == 201:
            Order.objects.filter(order_id=order_id).update(is_reviewed=True)
        
        return response


class ProductReviewViewSet(viewsets.ModelViewSet):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-review_date']  # เรียงตามวันที่รีวิวล่าสุด
    
    def get_queryset(self):
        queryset = ProductReview.objects.all()
        
        # Filter by product
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating_product__gte=min_rating)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        order_detail_id = request.data.get('order_detail')
        
        # Check if product has already been reviewed
        if ProductReview.objects.filter(order_detail_id=order_detail_id).exists():
            return Response({'error': 'This product has already been reviewed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)


class DeliveryStatusLogViewSet(viewsets.ModelViewSet):
    queryset = DeliveryStatusLog.objects.all()
    serializer_class = DeliveryStatusLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DeliveryStatusLog.objects.all()
        
        # Filter by order
        order_id = self.request.query_params.get('order_id')
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        return queryset.order_by('-timestamp')
    
    def create(self, request, *args, **kwargs):
        # Add current user as updated_by_user
        request.data['updated_by_user'] = request.user.id
        return super().create(request, *args, **kwargs)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']  # เรียงตามวันที่สร้างล่าสุด
    
    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user).order_by('-created_at')
        # รองรับการกรองสถานะการอ่านผ่าน query param: ?is_read=true|false
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            try:
                is_read_bool = str(is_read).lower() == 'true'
                queryset = queryset.filter(is_read=is_read_bool)
            except Exception:
                pass
        return queryset
    
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get unread notifications count"""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get'], url_path='badge-counts')
    def badge_counts(self, request):
        """Get badge counts for regular and guest orders separately"""
        # นับ notifications ที่ยังไม่อ่านตาม type
        unread_notifications = Notification.objects.filter(user=request.user, is_read=False)
        
        # นับ regular orders (ที่ล็อกอิน)
        regular_orders_count = unread_notifications.filter(
            type='order',
            related_order__isnull=False
        ).count()
        
        # นับ guest orders (ที่ไม่ล็อกอิน)
        guest_orders_count = unread_notifications.filter(
            type='guest_order',
            related_guest_order__isnull=False
        ).count()
        
        return Response({
            'regular_orders_count': regular_orders_count,
            'guest_orders_count': guest_orders_count,
            'total_unread_count': regular_orders_count + guest_orders_count
        })
    
    @action(detail=False, methods=['post'], url_path='mark-order-read')
    def mark_order_read(self, request):
        """Mark notifications related to specific order as read"""
        order_id = request.data.get('order_id')
        order_type = request.data.get('order_type')  # 'regular' หรือ 'guest'
        
        if not order_id:
            return Response({'error': 'order_id is required'}, status=400)
        
        # Mark all notifications related to this order as read
        from django.db.models import Q
        
        # ใช้ order_type เพื่อกำหนด field ที่ถูกต้อง
        if order_type == 'guest':
            # สำหรับ guest orders ใช้ related_guest_order_id
            notifications = Notification.objects.filter(
                related_guest_order_id=order_id,
                user=request.user,
                is_read=False
            )
        elif order_type == 'regular':
            # สำหรับ regular orders ใช้ related_order_id  
            notifications = Notification.objects.filter(
                related_order_id=order_id,
                user=request.user,
                is_read=False
            )
        else:
            # ถ้าไม่ระบุ order_type ให้ใช้ logic เดิม (fallback)
            # Try to find the order to determine if it's a regular order or guest order
            try:
                # First try to find as a regular order
                from .models import Order
                regular_order = Order.objects.get(order_id=order_id)
                # If found, search by related_order_id
                notifications = Notification.objects.filter(
                    related_order_id=order_id,
                    user=request.user,
                    is_read=False
                )
            except Order.DoesNotExist:
                # If not found as regular order, try as guest order
                try:
                    from .models import GuestOrder
                    guest_order = GuestOrder.objects.get(guest_order_id=order_id)
                    # If found, search by related_guest_order_id
                    notifications = Notification.objects.filter(
                        related_guest_order_id=order_id,
                        user=request.user,
                        is_read=False
                    )
                except GuestOrder.DoesNotExist:
                    # If neither found, use original logic (fallback)
                    notifications = Notification.objects.filter(
                        Q(related_order_id=order_id) | Q(related_guest_order_id=order_id),
                        user=request.user,
                        is_read=False
                    )
        
        count = notifications.count()
        notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'Marked {count} notifications as read for order {order_id}',
            'marked_count': count
        })


class UserFavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = UserFavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserFavorite.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Auto-assign current user
        request.data['user'] = request.user.id
        
        # Check for duplicates
        favorite_type = request.data.get('favorite_type')
        restaurant_id = request.data.get('restaurant')
        product_id = request.data.get('product')
        
        if favorite_type == 'restaurant' and restaurant_id:
            if UserFavorite.objects.filter(
                user=request.user, 
                favorite_type='restaurant', 
                restaurant_id=restaurant_id
            ).exists():
                return Response(
                    {'error': 'This restaurant is already in your favorites'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if favorite_type == 'product' and product_id:
            if UserFavorite.objects.filter(
                user=request.user, 
                favorite_type='product', 
                product_id=product_id
            ).exists():
                return Response(
                    {'error': 'This product is already in your favorites'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def restaurants(self, request):
        favorites = self.get_queryset().filter(favorite_type='restaurant')
        serializer = self.get_serializer(favorites, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def products(self, request):
        favorites = self.get_queryset().filter(favorite_type='product')
        serializer = self.get_serializer(favorites, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def toggle_restaurant(self, request):
        """Toggle restaurant favorite - add if not exists, remove if exists"""
        restaurant_id = request.data.get('restaurant_id')
        if not restaurant_id:
            return Response({'error': 'restaurant_id is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        favorite, created = UserFavorite.objects.get_or_create(
            user=request.user,
            restaurant=restaurant,
            favorite_type='restaurant'
        )
        
        if not created:
            favorite.delete()
            return Response({'message': 'Restaurant removed from favorites', 'is_favorite': False})
        else:
            return Response({'message': 'Restaurant added to favorites', 'is_favorite': True})
    
    @action(detail=False, methods=['post'])
    def toggle_product(self, request):
        """Toggle product favorite - add if not exists, remove if exists"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        favorite, created = UserFavorite.objects.get_or_create(
            user=request.user,
            product=product,
            favorite_type='product'
        )
        
        if not created:
            favorite.delete()
            return Response({'message': 'Product removed from favorites', 'is_favorite': False})
        else:
            return Response({'message': 'Product added to favorites', 'is_favorite': True})


class SearchViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')
        
        if not query:
            return Response({'results': []})
        
        results = {
            'restaurants': [],
            'products': [],
            'categories': []
        }
        
        # Search restaurants
        if search_type in ['all', 'restaurant']:
            restaurants = Restaurant.objects.filter(
                Q(restaurant_name__icontains=query) |
                Q(description__icontains=query)
            )[:10]
            results['restaurants'] = RestaurantSerializer(restaurants, many=True).data
        
        # Search products
        if search_type in ['all', 'product']:
            products = Product.objects.filter(
                Q(product_name__icontains=query) |
                Q(description__icontains=query)
            ).filter(is_available=True)[:10]
            results['products'] = ProductSerializer(products, many=True).data
        
        # Search categories
        if search_type in ['all', 'category']:
            categories = Category.objects.filter(
                category_name__icontains=query
            )[:10]
            results['categories'] = CategorySerializer(categories, many=True).data
        
        # Save search history for authenticated users
        if request.user.is_authenticated:
            total_results = (len(results['restaurants']) + 
                           len(results['products']) + 
                           len(results['categories']))
            
            SearchHistory.objects.create(
                user=request.user,
                search_query=query,
                search_type=search_type if search_type != 'all' else 'restaurant',
                results_count=total_results
            )
        
        # Update popular searches
        popular_search, created = PopularSearch.objects.get_or_create(
            search_query=query
        )
        if not created:
            popular_search.search_count += 1
            popular_search.save()
        
        return Response(results)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_searches = PopularSearch.objects.order_by('-search_count')[:10]
        serializer = PopularSearchSerializer(popular_searches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        if not request.user.is_authenticated:
            return Response([])
        
        history = SearchHistory.objects.filter(user=request.user).order_by('-created_at')[:20]
        serializer = SearchHistorySerializer(history, many=True)
        return Response(serializer.data)


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def daily(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        analytics = AnalyticsDaily.objects.all()
        if date_from:
            analytics = analytics.filter(date__gte=date_from)
        if date_to:
            analytics = analytics.filter(date__lte=date_to)
        
        serializer = AnalyticsDailySerializer(analytics, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def restaurant(self, request):
        # Get restaurant ID from query params or user's restaurant
        restaurant_id = request.query_params.get('restaurant_id')
        
        if not restaurant_id and hasattr(request.user, 'restaurant'):
            restaurant_id = request.user.restaurant.restaurant_id
        
        if not restaurant_id:
            return Response({'error': 'Restaurant ID required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        analytics = RestaurantAnalytics.objects.filter(restaurant_id=restaurant_id)
        if date_from:
            analytics = analytics.filter(date__gte=date_from)
        if date_to:
            analytics = analytics.filter(date__lte=date_to)
        
        serializer = RestaurantAnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def product(self, request):
        product_id = request.query_params.get('product_id')
        restaurant_id = request.query_params.get('restaurant_id')
        
        if not product_id:
            return Response({'error': 'Product ID required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        analytics = ProductAnalytics.objects.filter(product_id=product_id)
        if restaurant_id:
            analytics = analytics.filter(restaurant_id=restaurant_id)
        if date_from:
            analytics = analytics.filter(date__gte=date_from)
        if date_to:
            analytics = analytics.filter(date__lte=date_to)
        
        serializer = ProductAnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)


class SearchHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all search history
        if user.role == 'admin':
            return SearchHistory.objects.all()
        
        # Others can only see their own search history
        return SearchHistory.objects.filter(user=user)
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear user's search history"""
        SearchHistory.objects.filter(user=request.user).delete()
        return Response({'message': 'Search history cleared'})
    
    @action(detail=False, methods=['get'])
    def top_searches(self, request):
        """Get top searches by user"""
        searches = self.get_queryset().values('search_query').annotate(
            count=Count('search_id')
        ).order_by('-count')[:10]
        return Response(searches)


class PopularSearchViewSet(viewsets.ModelViewSet):
    queryset = PopularSearch.objects.all()
    serializer_class = PopularSearchSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'trending']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def trending(self, request):
        """Get trending searches (most searched in last 24 hours)"""
        yesterday = timezone.now() - timedelta(days=1)
        trending = PopularSearch.objects.filter(
            last_searched__gte=yesterday
        ).order_by('-search_count')[:10]
        serializer = self.get_serializer(trending, many=True)
        return Response(serializer.data)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def admin(self, request):
        """Admin dashboard statistics"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        
        # Today's statistics (include both logged-in orders and guest orders)
        today_orders_count = (
            Order.objects.filter(order_date__date=today).count() +
            GuestOrder.objects.filter(order_date__date=today).count()
        )
        today_revenue_logged_in = Order.objects.filter(order_date__date=today).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        today_revenue_guest = GuestOrder.objects.filter(order_date__date=today).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        today_revenue = today_revenue_logged_in + today_revenue_guest
        
        # Overall statistics
        total_users = User.objects.count()
        total_restaurants = Restaurant.objects.count()
        total_orders = Order.objects.count() + GuestOrder.objects.count()
        active_statuses = ['pending', 'paid', 'preparing', 'ready_for_pickup', 'delivering']
        active_orders = (
            Order.objects.filter(current_status__in=active_statuses).count() +
            GuestOrder.objects.filter(current_status__in=active_statuses).count()
        )
        
        # Revenue statistics (include guest orders)
        total_revenue_logged_in = Order.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_revenue_guest = GuestOrder.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_revenue = total_revenue_logged_in + total_revenue_guest
        
        # Popular items
        from django.db.models import Count
        popular_products = OrderDetail.objects.values(
            'product__product_name', 'product__product_id'
        ).annotate(
            order_count=Count('order_detail_id')
        ).order_by('-order_count')[:5]
        
        return Response({
            'today': {
                'orders': today_orders_count,
                'revenue': today_revenue,
                'new_users': User.objects.filter(date_joined__date=today).count(),
            },
            'overview': {
                'total_users': total_users,
                'total_restaurants': total_restaurants,
                'total_orders': total_orders,
                'active_orders': active_orders,
                'total_revenue': total_revenue,
            },
            'popular_products': popular_products,
        })
    
    @action(detail=False, methods=['get'])
    def restaurant(self, request):
        """Restaurant owner dashboard"""
        if request.user.role not in ['special_restaurant', 'general_restaurant']:
            return Response({'error': 'Restaurant access required'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            restaurant = request.user.restaurant
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        today = timezone.now().date()
        
        # Today's statistics
        today_orders = Order.objects.filter(restaurant=restaurant, order_date__date=today)
        today_revenue = today_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Pending orders
        pending_orders = Order.objects.filter(
            restaurant=restaurant,
            current_status__in=['paid', 'preparing']
        ).count()
        
        # Monthly statistics
        month_start = today.replace(day=1)
        monthly_orders = Order.objects.filter(
            restaurant=restaurant,
            order_date__date__gte=month_start
        )
        monthly_revenue = monthly_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Popular products
        popular_products = OrderDetail.objects.filter(
            order__restaurant=restaurant
        ).values(
            'product__product_name', 'product__product_id'
        ).annotate(
            order_count=Count('order_detail_id')
        ).order_by('-order_count')[:5]
        
        # Recent reviews
        recent_reviews = Review.objects.filter(
            restaurant=restaurant
        ).order_by('-review_date')[:5]
        
        return Response({
            'restaurant': {
                'name': restaurant.restaurant_name,
                'average_rating': restaurant.average_rating,
                'total_reviews': restaurant.total_reviews,
            },
            'today': {
                'orders': today_orders.count(),
                'revenue': today_revenue,
                'pending_orders': pending_orders,
            },
            'monthly': {
                'orders': monthly_orders.count(),
                'revenue': monthly_revenue,
            },
            'popular_products': popular_products,
            'recent_reviews': ReviewSerializer(recent_reviews, many=True).data,
        })
    
    @action(detail=False, methods=['get'])
    def customer(self, request):
        """Customer dashboard"""
        user = request.user
        
        # Order statistics
        total_orders = Order.objects.filter(user=user).count()
        active_orders = Order.objects.filter(
            user=user,
            current_status__in=['pending', 'paid', 'preparing', 'ready_for_pickup', 'delivering']
        ).count()
        
        # Spending statistics
        total_spent = Order.objects.filter(
            user=user,
            current_status='completed'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Favorite restaurants
        from django.db.models import Count
        favorite_restaurants = Order.objects.filter(
            user=user
        ).values(
            'restaurant__restaurant_id', 'restaurant__restaurant_name'
        ).annotate(
            order_count=Count('order_id')
        ).order_by('-order_count')[:5]
        
        # Recent orders
        recent_orders = Order.objects.filter(
            user=user
        ).order_by('-order_date')[:5]
        
        return Response({
            'statistics': {
                'total_orders': total_orders,
                'active_orders': active_orders,
                'total_spent': total_spent,
            },
            'favorite_restaurants': favorite_restaurants,
            'recent_orders': OrderSerializer(recent_orders, many=True).data,
        })


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def sales(self, request):
        """Generate sales report"""
        if request.user.role not in ['admin', 'special_restaurant', 'general_restaurant']:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        # Base query
        orders = Order.objects.filter(current_status='completed')
        
        # Filter by restaurant for restaurant owners
        if request.user.role in ['special_restaurant', 'general_restaurant']:
            try:
                restaurant = request.user.restaurant
                orders = orders.filter(restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Response({'error': 'Restaurant not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        # Apply date filters
        if date_from:
            orders = orders.filter(order_date__date__gte=date_from)
        if date_to:
            orders = orders.filter(order_date__date__lte=date_to)
        
        # Calculate statistics
        total_sales = orders.count()
        total_revenue = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        average_order_value = total_revenue / total_sales if total_sales > 0 else 0
        
        # Sales by day
        daily_sales = orders.extra(
            select={'date': 'DATE(order_date)'}
        ).values('date').annotate(
            count=Count('order_id'),
            revenue=Sum('total_amount')
        ).order_by('date')
        
        return Response({
            'summary': {
                'total_sales': total_sales,
                'total_revenue': total_revenue,
                'average_order_value': average_order_value,
            },
            'daily_sales': list(daily_sales),
        })
    
    @action(detail=False, methods=['get'])
    def products(self, request):
        """Generate product performance report"""
        if request.user.role not in ['admin', 'special_restaurant', 'general_restaurant']:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get filters
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        restaurant_id = request.query_params.get('restaurant_id')
        
        # Base query
        order_details = OrderDetail.objects.filter(
            order__current_status='completed'
        )
        
        # Filter by restaurant
        if request.user.role in ['special_restaurant', 'general_restaurant']:
            try:
                restaurant = request.user.restaurant
                order_details = order_details.filter(order__restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Response({'error': 'Restaurant not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        elif restaurant_id:
            order_details = order_details.filter(order__restaurant_id=restaurant_id)
        
        # Apply date filters
        if date_from:
            order_details = order_details.filter(order__order_date__date__gte=date_from)
        if date_to:
            order_details = order_details.filter(order__order_date__date__lte=date_to)
        
        # Product performance
        product_performance = order_details.values(
            'product__product_id',
            'product__product_name',
            'product__category__category_name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal'),
            order_count=Count('order_detail_id')
        ).order_by('-total_revenue')[:20]
        
        return Response({
            'products': list(product_performance),
        })


class AppSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing application settings
    Only admin can modify settings, but everyone can read
    """
    serializer_class = AppSettingsSerializer
    http_method_names = ['get', 'put', 'patch']  # ไม่อนุญาต create/delete เพราะมี settings record เดียว
    
    def get_queryset(self):
        # ใช้ singleton pattern - มี settings record เดียว
        settings = AppSettings.get_settings()
        return AppSettings.objects.filter(pk=settings.pk)
    
    def get_permissions(self):
        """
        อนุญาตให้ทุกคนอ่านได้ แต่แก้ไขได้เฉพาะ admin
        """
        if self.action in ['list', 'retrieve', 'public']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def perform_update(self, serializer):
        """บันทึกผู้ที่แก้ไขล่าสุด"""
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """
        Endpoint สำหรับดึงข้อมูล public settings ที่ไม่ต้อง authentication
        """
        try:
            settings = AppSettings.get_settings()
            
            # ใช้ serializer ปกติเพื่อความปลอดภัย
            serializer = self.get_serializer(settings)
            data = serializer.data
            
            # สร้าง public data ที่ปลอดภัย
            public_data = {
                'id': data.get('id'),
                'app_name': data.get('app_name', ''),
                'app_description': data.get('app_description', ''),
                'logo_url': data.get('logo_url', ''),
                'banner_url': data.get('banner_url', ''),
                'contact_email': data.get('contact_email', ''),
                'contact_phone': data.get('contact_phone', ''),
                'contact_address': data.get('contact_address', ''),
                'hero_title': data.get('hero_title', ''),
                'hero_subtitle': data.get('hero_subtitle', ''),
                'feature_1_title': data.get('feature_1_title', ''),
                'feature_1_description': data.get('feature_1_description', ''),
                'feature_1_icon': data.get('feature_1_icon', ''),
                'feature_2_title': data.get('feature_2_title', ''),
                'feature_2_description': data.get('feature_2_description', ''),
                'feature_2_icon': data.get('feature_2_icon', ''),
                'feature_3_title': data.get('feature_3_title', ''),
                'feature_3_description': data.get('feature_3_description', ''),
                'feature_3_icon': data.get('feature_3_icon', ''),
                'facebook_url': data.get('facebook_url', ''),
                'instagram_url': data.get('instagram_url', ''),
                'twitter_url': data.get('twitter_url', ''),
                'maintenance_mode': data.get('maintenance_mode', False),
                'maintenance_message': data.get('maintenance_message', ''),
                'timezone': data.get('timezone', 'Asia/Bangkok'),
                'currency': data.get('currency', 'THB'),
                'bank_name': data.get('bank_name', ''),
                'bank_account_number': data.get('bank_account_number', ''),
                'bank_account_name': data.get('bank_account_name', ''),
                'qr_code_url': data.get('qr_code_url', ''),
                # ข้อมูลค่าจัดส่ง - ใช้ค่าจาก serializer
                'base_delivery_fee': data.get('base_delivery_fee', 20.0),
                'free_delivery_minimum': data.get('free_delivery_minimum', 200.0),
                'max_delivery_distance': data.get('max_delivery_distance', 10.0),
                'per_km_fee': data.get('per_km_fee', 5.0),
                'multi_restaurant_base_fee': data.get('multi_restaurant_base_fee', 2.0),
                'multi_restaurant_additional_fee': data.get('multi_restaurant_additional_fee', 1.0),
                'delivery_time_slots': data.get('delivery_time_slots', '09:00-21:00'),
                'enable_scheduled_delivery': data.get('enable_scheduled_delivery', True),
                'rush_hour_multiplier': data.get('rush_hour_multiplier', 1.5),
                'weekend_multiplier': data.get('weekend_multiplier', 1.2),
            }
            
            return Response(public_data)
            
        except AppSettings.DoesNotExist:
            return Response({"detail": "App settings not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print("---------------------------------------------------")
            print(f"Error in public app settings endpoint: {e}")
            import traceback
            traceback.print_exc()
            print("---------------------------------------------------")
            return Response({"detail": "An internal server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['code']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]  # เฉพาะ admin เท่านั้นที่สามารถแก้ไขข้อมูลภาษาได้
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get default language"""
        try:
            default_lang = Language.objects.get(is_default=True)
            serializer = self.get_serializer(default_lang)
            return Response(serializer.data)
        except Language.DoesNotExist:
            return Response({'error': 'No default language set'}, status=status.HTTP_404_NOT_FOUND)


class TranslationViewSet(viewsets.ModelViewSet):
    queryset = Translation.objects.all()
    serializer_class = TranslationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['key', 'value']
    ordering_fields = ['key', 'group', 'created_at']
    ordering = ['key']
    filterset_fields = ['language', 'group']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'by_language']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]  # เฉพาะ admin เท่านั้นที่สามารถแก้ไขข้อมูลแปลได้
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def by_language(self, request):
        """Get translations for a specific language"""
        lang_code = request.query_params.get('lang', None)
        if not lang_code:
            return Response({'error': 'Language code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            language = Language.objects.get(code=lang_code, is_active=True)
        except Language.DoesNotExist:
            return Response({'error': 'Language not found or not active'}, status=status.HTTP_404_NOT_FOUND)

        translations = self.get_queryset().filter(language=language)
        
        # Group translations if requested
        group_by = request.query_params.get('group_by', None)
        if group_by == 'group':
            grouped_translations = {}
            for trans in translations:
                if trans.group not in grouped_translations:
                    grouped_translations[trans.group] = {}
                grouped_translations[trans.group][trans.key] = trans.value
            return Response(grouped_translations)
        
        serializer = self.get_serializer(translations, many=True)
        return Response(serializer.data)


class GuestOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet สำหรับการสั่งซื้อแบบไม่ต้องล็อกอิน
    ใช้ Temporary ID เพื่อติดตามคำสั่งซื้อ
    รองรับ multi-restaurant จริง
    """
    serializer_class = GuestOrderSerializer
    permission_classes = [AllowAny]  # ไม่ต้องล็อกอิน
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'admin':
                return GuestOrder.objects.all()
            elif user.role in ['special_restaurant', 'general_restaurant']:
                try:
                    # filter ทั้ง single restaurant และ multi-restaurant ที่มีร้านนี้อยู่
                    restaurant = user.restaurant
                    return GuestOrder.objects.filter(
                        Q(restaurant=restaurant) |
                        Q(restaurants__contains=[{"restaurant_id": restaurant.restaurant_id}])
                    )
                except Restaurant.DoesNotExist:
                    return GuestOrder.objects.none()
        return GuestOrder.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateGuestOrderSerializer
        elif self.action == 'track':
            return GuestOrderTrackingSerializer
        elif self.action == 'multi':
            return GuestMultiRestaurantOrderSerializer
        return GuestOrderSerializer

    def create(self, request, *args, **kwargs):
        try:
            if 'order_data' in request.data:
                order_data_str = request.data.get('order_data')
                proof_of_payment = request.FILES.get('proof_of_payment')
                if not order_data_str:
                    return Response({'error': 'order_data is required'}, status=status.HTTP_400_BAD_REQUEST)
                import json
                order_data = json.loads(order_data_str)
            else:
                order_data = request.data
                proof_of_payment = None
            serializer = self.get_serializer(data=order_data)
            serializer.is_valid(raise_exception=True)
            guest_order = serializer.save()
            if proof_of_payment:
                guest_order.proof_of_payment = proof_of_payment
                guest_order.save()
            # ไม่ส่ง notification และ WebSocket สำหรับ phone orders (ไม่มี email)
            if guest_order.customer_email:
                admin_users = User.objects.filter(role='admin')
                for admin_user in admin_users:
                    Notification.objects.create(
                        user=admin_user,
                        title='New Guest Order Received',
                        message=f'Guest order #{guest_order.guest_order_id} ({guest_order.temporary_id}) was placed by {guest_order.customer_name}',
                        type='guest_order',
                        related_guest_order=guest_order
                    )
                # ส่ง WebSocket notification ไปยังกลุ่มแอดมิน (รองรับ multi-restaurant)
                channel_layer = get_channel_layer()
                restaurant_name = 'Multi-Restaurant Guest Order' if guest_order.is_multi_restaurant else (guest_order.restaurant.restaurant_name if guest_order.restaurant else '-')
                async_to_sync(channel_layer.group_send)(
                    "orders_admin",
                    {
                        'type': 'new_guest_order',
                        'order_id': guest_order.guest_order_id,
                        'temporary_id': guest_order.temporary_id,
                        'customer_name': guest_order.customer_name,
                        'restaurant_name': restaurant_name,
                        'total_amount': str(guest_order.total_amount),
                        'timestamp': timezone.now().isoformat()
                    }
                )
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {'error': f'Failed to create guest order: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def track(self, request):
        temporary_id = request.query_params.get('temporary_id')
        if not temporary_id:
            return Response({'error': 'temporary_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            guest_order = GuestOrder.objects.get(temporary_id=temporary_id)
            from django.utils import timezone
            if guest_order.expires_at and guest_order.expires_at < timezone.now():
                return Response({'error': 'Order has expired'}, status=status.HTTP_410_GONE)
            serializer = GuestOrderTrackingSerializer(guest_order)
            return Response(serializer.data)
        except GuestOrder.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        guest_order = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note', '')
        if not new_status:
            return Response({'error': 'status is required'}, status=status.HTTP_400_BAD_REQUEST)
        if new_status not in dict(GuestOrder.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = guest_order.current_status
        guest_order.current_status = new_status
        guest_order.save()
        GuestDeliveryStatusLog.objects.create(
            guest_order=guest_order,
            status=new_status,
            note=note,
            updated_by_user=request.user
        )
        
        # ไม่ต้องส่ง notification ให้แอดมิน เพราะแอดมินเป็นคนอัปเดตเอง
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"guest_order_{guest_order.temporary_id}",
            {
                'type': 'guest_order_status_update',
                'order_id': guest_order.guest_order_id,
                'temporary_id': guest_order.temporary_id,
                'old_status': old_status,
                'new_status': new_status,
                'note': note,
                'timestamp': timezone.now().isoformat()
            }
        )
        async_to_sync(channel_layer.group_send)(
            "guest_orders_all",
            {
                'type': 'guest_order_status_update',
                'order_id': guest_order.guest_order_id,
                'temporary_id': guest_order.temporary_id,
                'old_status': old_status,
                'new_status': new_status,
                'note': note,
                'timestamp': timezone.now().isoformat()
            }
        )
        return Response({
            'message': 'Status updated successfully',
            'old_status': old_status,
            'new_status': new_status
        })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def multi(self, request):
        try:
            order_data_str = request.data.get('order_data')
            proof_of_payment = request.FILES.get('proof_of_payment')
            if not order_data_str:
                return Response({'error': 'order_data is required'}, status=status.HTTP_400_BAD_REQUEST)
            import json
            order_data = json.loads(order_data_str)
            serializer = GuestMultiRestaurantOrderSerializer(data=order_data)
            if serializer.is_valid():
                guest_order = serializer.save()
                if proof_of_payment:
                    guest_order.proof_of_payment = proof_of_payment
                    guest_order.save()
                # ไม่ส่ง notification และ WebSocket สำหรับ phone orders (ไม่มี email)
                if guest_order.customer_email:
                    admin_users = User.objects.filter(role='admin')
                    for admin_user in admin_users:
                        Notification.objects.create(
                            user=admin_user,
                            title='New Multi-Restaurant Guest Order Received',
                            message=f'Multi-restaurant guest order #{guest_order.guest_order_id} ({guest_order.temporary_id}) was placed by {guest_order.customer_name}',
                            type='guest_order',
                            related_guest_order=guest_order
                        )
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        "orders_admin",
                        {
                            'type': 'new_guest_order',
                            'order_id': guest_order.guest_order_id,
                            'temporary_id': guest_order.temporary_id,
                            'customer_name': guest_order.customer_name,
                            'restaurant_name': 'Multi-Restaurant Guest Order',
                            'total_amount': str(guest_order.total_amount),
                            'timestamp': timezone.now().isoformat()
                        }
                    )
                return Response(GuestOrderSerializer(guest_order).data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Failed to create multi-restaurant guest order: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """ลบ Guest Order (เฉพาะแอดมิน)"""
        # ตรวจสอบ permission - เฉพาะ admin เท่านั้น
        if request.user.role != 'admin':
            return Response(
                {'error': 'เฉพาะแอดมินเท่านั้นที่สามารถลบ Guest Order ได้'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        guest_order = self.get_object()
        order_id = guest_order.guest_order_id
        temporary_id = guest_order.temporary_id
        
        # ส่ง WebSocket notification ก่อนลบ
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"guest_order_{temporary_id}",
            {
                'type': 'guest_order_deleted',
                'order_id': order_id,
                'temporary_id': temporary_id,
                'message': 'Guest Order ของคุณถูกลบโดยระบบ',
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # ส่ง notification ให้แอดมินคนอื่น
        async_to_sync(channel_layer.group_send)(
            "guest_orders_all",
            {
                'type': 'guest_order_deleted',
                'order_id': order_id,
                'temporary_id': temporary_id,
                'message': f'Guest Order #{temporary_id} ถูกลบโดย {request.user.username}',
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # ลบ Guest Order (Django จะลบข้อมูลที่เกี่ยวข้องอัตโนมัติเพราะ CASCADE)
        guest_order.delete()
        
        return Response(
            {
                'success': True, 
                'message': f'ลบ Guest Order #{temporary_id} เรียบร้อยแล้ว'
            },
            status=status.HTTP_200_OK
        )



