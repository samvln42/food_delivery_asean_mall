from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import User
from .serializers import (
    UserSerializer, LoginSerializer, RegisterSerializer,
    ChangePasswordSerializer, UserProfileSerializer,
    ResetPasswordSerializer, ResetPasswordConfirmSerializer,
    EmailVerificationSerializer, ResendVerificationSerializer,
    GoogleOAuthSerializer
)


class AuthViewSet(viewsets.GenericViewSet):
    """ViewSet for authentication endpoints"""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer  # Default serializer
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new user"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Send email verification
            self._send_verification_email(user)
            
            # ไม่สร้าง token จนกว่าจะยืนยันอีเมล
            # token จะถูกสร้างเมื่อยืนยันอีเมลสำเร็จ
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'is_email_verified': user.is_email_verified
                },
                'message': f'เราได้ส่งรหัสยืนยันไปยัง {user.email} แล้ว กรุณาตรวจสอบอีเมลและกรอกรหัสยืนยันเพื่อเสร็จสิ้นการสมัครสมาชิก',
                'email_verification_required': True,
                'status': 'pending_verification'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _send_verification_email(self, user):
        """Send email verification"""
        from .utils import send_verification_email
        
        # ส่งอีเมลยืนยัน
        success = send_verification_email(user)
        return success
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login user with username or email"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username_or_email = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = None
            
            # ลองหา user ด้วย email ก่อน (ถ้ามี @ ในข้อมูล)
            if '@' in username_or_email:
                try:
                    user = User.objects.get(email=username_or_email)
                    user = authenticate(request, username=user.username, password=password)
                except User.DoesNotExist:
                    pass
            
            # ถ้าไม่เจอ หรือไม่ใช่ email ให้ลองใช้ username
            if not user:
                user = authenticate(request, username=username_or_email, password=password)
            
            # ถ้ายังไม่เจอ ลองหา user ด้วย email อีกครั้ง (กรณีไม่มี @)
            if not user:
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(request, username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if user and user.is_active:
                # ตรวจสอบว่ายืนยันอีเมลแล้วหรือยัง
                if not user.is_email_verified:
                    return Response({
                        'error': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ ตรวจสอบอีเมลของคุณและกรอกรหัสยืนยัน',
                        'email_verification_required': True,
                        'user_email': user.email
                    }, status=status.HTTP_403_FORBIDDEN)
                
                login(request, user)
                
                # Create or get token for API authentication
                token, created = Token.objects.get_or_create(user=user)
                
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'message': 'เข้าสู่ระบบสำเร็จ'
                })
            
            return Response({
                'error': 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user"""
        logout(request)
        return Response({'message': 'ออกจากระบบสำเร็จ'})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        user = request.user
        
        # คำนวณสถิติ
        from api.models import Order
        user_stats = Order.objects.filter(user=user).aggregate(
            total_orders=Count('order_id'),
            total_spent=Sum('total_amount')
        )
        
        serializer = UserProfileSerializer(user)
        data = serializer.data
        data['total_orders'] = user_stats['total_orders'] or 0
        data['total_spent'] = user_stats['total_spent'] or 0
        
        return Response(data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            if not user.check_password(old_password):
                return Response({
                    'error': 'รหัสผ่านเดิมไม่ถูกต้อง'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.save()
            
            # Re-authenticate user
            login(request, user)
            
            return Response({'message': 'เปลี่ยนรหัสผ่านสำเร็จ'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        """Request password reset"""
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
                # ในการใช้งานจริง ควรส่ง email พร้อม reset token
                # ตอนนี้จะ return success message เท่านั้น
                return Response({
                    'message': 'Password reset email sent'
                })
            except User.DoesNotExist:
                # ไม่ควรบอกว่า email ไม่มีในระบบ (security reason)
                return Response({
                    'message': 'Password reset email sent'
                })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_password_confirm(self, request):
        """Confirm password reset with token"""
        serializer = ResetPasswordConfirmSerializer(data=request.data)
        if serializer.is_valid():
            # ในการใช้งานจริง ควรตรวจสอบ token และ reset password
            # ตอนนี้จะ return success message เท่านั้น
            return Response({
                'message': 'Password reset successful'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='verify-email')
    def verify_email(self, request):
        """Verify user email with token"""
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                user = User.objects.get(email_verification_token=token)
                
                if user.is_email_verified:
                    return Response({
                        'message': 'อีเมลนี้ได้รับการยืนยันแล้ว คุณสามารถเข้าสู่ระบบได้',
                        'user': UserSerializer(user).data
                    })
                
                # ยืนยันอีเมลและสร้าง token สำหรับ login
                user.is_email_verified = True
                user.save()
                
                # สร้าง authentication token เมื่อยืนยันอีเมลสำเร็จ
                auth_token, created = Token.objects.get_or_create(user=user)
                
                return Response({
                    'message': 'ยืนยันอีเมลสำเร็จ! การสมัครสมาชิกเสร็จสมบูรณ์ คุณสามารถเข้าสู่ระบบได้แล้ว',
                    'user': UserSerializer(user).data,
                    'token': auth_token.key,
                    'status': 'registration_complete'
                })
            except User.DoesNotExist:
                return Response({
                    'error': 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอส่งรหัสยืนยันใหม่'
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='resend-verification')
    def resend_verification(self, request):
        """Resend email verification"""
        serializer = ResendVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
                
                # Generate new token
                import uuid
                user.email_verification_token = uuid.uuid4()
                user.save()
                
                # Send verification email
                success = self._send_verification_email(user)
                
                if not success:
                    return Response({
                        'error': 'ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่อีกครั้งในภายหลัง'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    'message': f'เราได้ส่งรหัสยืนยันใหม่ไปยัง {email} แล้ว กรุณาตรวจสอบอีเมลและกรอกรหัสยืนยันเพื่อเสร็จสิ้นการสมัครสมาชิก'
                })
            except User.DoesNotExist:
                return Response({
                    'error': 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่'
                }, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='google-login')
    def google_login(self, request):
        """Login/Register with Google OAuth"""
        serializer = GoogleOAuthSerializer(data=request.data)
        if serializer.is_valid():
            google_user_data = serializer.validated_data['access_token']
            
            email = google_user_data.get('email')
            google_id = google_user_data.get('sub')
            name = google_user_data.get('name', '')
            picture = google_user_data.get('picture', '')
            
            if not email:
                return Response({
                    'error': 'Email not provided by Google'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Try to find existing user
                user = User.objects.get(email=email)
                
                # Update Google ID if not set
                if not user.google_id:
                    user.google_id = google_id
                    user.save()
                
            except User.DoesNotExist:
                # Create new user from Google data
                username = email.split('@')[0]
                
                # Ensure unique username
                counter = 1
                original_username = username
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    google_id=google_id,
                    is_email_verified=True,  # Google emails are pre-verified
                    role='customer'  # Default role for Google users
                )
                
                # Set name if provided
                if name:
                    user.first_name = name.split(' ')[0] if ' ' in name else name
                    if ' ' in name:
                        user.last_name = ' '.join(name.split(' ')[1:])
                    user.save()
            
            # Create or get authentication token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'Google login successful'
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['username', 'email', 'phone_number']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login']
    ordering = ['-date_joined']
    filterset_fields = ['role', 'is_active']
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [AllowAny]
        elif self.action in ['list']:
            # Admin only for list action
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        
        # Check if user is authenticated
        if not user.is_authenticated:
            return User.objects.none()
        
        # Admin can see all users
        if hasattr(user, 'role') and user.role == 'admin':
            return User.objects.all()
        
        # Others can only see their own profile
        return User.objects.filter(id=user.id)
    
    def _auto_sync_user_roles(self):
        """Auto-sync user roles with restaurant types (silent operation)"""
        try:
            fixed_count = 0
            for user in User.objects.filter(role__in=['general_restaurant', 'special_restaurant']):
                try:
                    restaurant = user.restaurant
                    
                    # ตรวจสอบว่าข้อมูลตรงกันหรือไม่
                    role_matches = (
                        (user.role == 'special_restaurant' and restaurant.is_special) or
                        (user.role == 'general_restaurant' and not restaurant.is_special)
                    )
                    
                    if not role_matches:
                        # แก้ไขโดยอัตโนมัติ
                        new_role = 'special_restaurant' if restaurant.is_special else 'general_restaurant'
                        user.role = new_role
                        user.save()
                        fixed_count += 1
                        
                except AttributeError:
                    # ไม่มีร้าน - ไม่ต้องทำอะไร
                    pass
            
            return fixed_count
        
        except Exception as e:
            # ถ้า sync ไม่ได้ ก็ไม่เป็นไร continue ต่อไป
            print(f"Auto-sync error: {e}")
            return 0

    def list(self, request, *args, **kwargs):
        """Override list to add debug info and handle admin-only access with auto-sync"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Auto-sync user roles with restaurant types (silent operation)
        fixed_count = self._auto_sync_user_roles()
        if fixed_count > 0:
            print(f"🔄 Auto-synced {fixed_count} user roles")
        
        return super().list(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        """Get user's orders"""
        user = self.get_object()
        
        # ตรวจสอบ permission
        if request.user != user and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from api.models import Order
        from api.serializers import OrderSerializer
        
        orders = Order.objects.filter(user=user).order_by('-order_date')
        
        # Pagination
        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = OrderSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def favorites(self, request, pk=None):
        """Get user's favorites"""
        user = self.get_object()
        
        # ตรวจสอบ permission
        if request.user != user and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from api.models import UserFavorite
        from api.serializers import UserFavoriteSerializer
        
        favorites = UserFavorite.objects.filter(user=user)
        serializer = UserFavoriteSerializer(favorites, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def notifications(self, request, pk=None):
        """Get user's notifications"""
        user = self.get_object()
        
        # ตรวจสอบ permission
        if request.user != user and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from api.models import Notification
        from api.serializers import NotificationSerializer
        
        notifications = Notification.objects.filter(user=user).order_by('-created_at')
        
        # Filter by read status
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            notifications = notifications.filter(is_read=is_read.lower() == 'true')
        
        # Pagination
        page = self.paginate_queryset(notifications)
        if page is not None:
            serializer = NotificationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def search_history(self, request, pk=None):
        """Get user's search history"""
        user = self.get_object()
        
        # ตรวจสอบ permission
        if request.user != user and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from api.models import SearchHistory
        from api.serializers import SearchHistorySerializer
        
        history = SearchHistory.objects.filter(user=user).order_by('-created_at')[:50]
        serializer = SearchHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get user's reviews"""
        user = self.get_object()
        
        # ตรวจสอบ permission
        if request.user != user and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from api.models import Review, ProductReview
        from api.serializers import ReviewSerializer, ProductReviewSerializer
        
        restaurant_reviews = Review.objects.filter(user=user).order_by('-review_date')
        product_reviews = ProductReview.objects.filter(user=user).order_by('-review_date')
        
        return Response({
            'restaurant_reviews': ReviewSerializer(restaurant_reviews, many=True).data,
            'product_reviews': ProductReviewSerializer(product_reviews, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user statistics (Admin only)"""
        if request.user.role != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        total_users = User.objects.count()
        users_by_role = User.objects.values('role').annotate(count=Count('user_id'))
        new_users_today = User.objects.filter(
            date_joined__date=timezone.now().date()
        ).count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Notification statistics
        try:
            from api.models import Notification
            from django.utils import timezone
            from datetime import timedelta
            
            # Unread notifications for admin
            unread_notifications = Notification.objects.filter(
                user=request.user, 
                is_read=False
            ).count()
            
            # New restaurant registrations today
            new_restaurant_notifications_today = Notification.objects.filter(
                type='new_restaurant_registration',
                created_at__date=timezone.now().date()
            ).count()
            
            # Unread new restaurant registrations
            unread_restaurant_notifications = Notification.objects.filter(
                user=request.user,
                type='new_restaurant_registration',
                is_read=False
            ).count()
            
        except ImportError:
            unread_notifications = 0
            new_restaurant_notifications_today = 0
            unread_restaurant_notifications = 0
        
        return Response({
            'total_users': total_users,
            'users_by_role': users_by_role,
            'new_users_today': new_users_today,
            'active_users': active_users,
            'notifications': {
                'unread_total': unread_notifications,
                'new_restaurants_today': new_restaurant_notifications_today,
                'unread_restaurant_registrations': unread_restaurant_notifications
            }
        })
    
    @action(detail=True, methods=['post'], url_path='upgrade-to-special')
    def upgrade_to_special(self, request, pk=None):
        """Upgrade general restaurant to special restaurant (Admin only)"""
        if request.user.role != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        
        if user.role != 'general_restaurant':
            return Response({
                'error': 'User must be a general restaurant to upgrade to special restaurant'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # อัปเกรดเป็น special restaurant
        user.role = 'special_restaurant'
        user.save()
        
        # อัปเดตร้านให้ตรงกับ role ใหม่
        try:
            restaurant = user.restaurant
            restaurant.is_special = True
            restaurant.save()
        except AttributeError:
            pass  # ไม่มีร้าน
        
        # ส่ง notification ให้ผู้ใช้ (ถ้ามี notification system)
        try:
            from api.models import Notification
            Notification.objects.create(
                user=user,
                title='🎉 ยินดีด้วย! คุณได้รับการอัปเกรดเป็นร้านอาหารพิเศษแล้ว',
                message='บัญชีของคุณได้รับการอัปเกรดเป็น Special Restaurant แล้ว คุณสามารถใช้ฟีเจอร์พิเศษต่างๆ ได้แล้ว',
                notification_type='upgrade'
            )
        except ImportError:
            pass  # ถ้าไม่มี notification model
        
        return Response({
            'message': f'User {user.username} has been upgraded to special restaurant successfully',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], url_path='downgrade-to-general')
    def downgrade_to_general(self, request, pk=None):
        """Downgrade special restaurant to general restaurant (Admin only)"""
        if request.user.role != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        
        if user.role != 'special_restaurant':
            return Response({
                'error': 'User must be a special restaurant to downgrade to general restaurant'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ดาวน์เกรดเป็น general restaurant
        user.role = 'general_restaurant'
        user.save()
        
        # อัปเดตร้านให้ตรงกับ role ใหม่
        try:
            restaurant = user.restaurant
            restaurant.is_special = False
            restaurant.save()
        except AttributeError:
            pass  # ไม่มีร้าน
        
        # ส่ง notification ให้ผู้ใช้
        try:
            from api.models import Notification
            Notification.objects.create(
                user=user,
                title='📢 การเปลี่ยนแปลงสถานะบัญชี',
                message='บัญชีของคุณได้รับการเปลี่ยนแปลงจาก Special Restaurant เป็น General Restaurant',
                notification_type='downgrade'
            )
        except ImportError:
            pass
        
        return Response({
            'message': f'User {user.username} has been downgraded to general restaurant',
            'user': UserSerializer(user).data
        })
    
    @action(detail=False, methods=['post'], url_path='sync-all-roles')
    def sync_all_roles(self, request):
        """Sync all user roles with restaurant types (Admin only)"""
        if request.user.role != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        mismatched_users = []
        fixed_users = []
        
        for user in User.objects.filter(role__in=['general_restaurant', 'special_restaurant']):
            try:
                restaurant = user.restaurant
                
                # ตรวจสอบว่าข้อมูลตรงกันหรือไม่
                role_matches = (
                    (user.role == 'special_restaurant' and restaurant.is_special) or
                    (user.role == 'general_restaurant' and not restaurant.is_special)
                )
                
                if not role_matches:
                    old_role = user.role
                    new_role = 'special_restaurant' if restaurant.is_special else 'general_restaurant'
                    
                    mismatched_users.append({
                        'username': user.username,
                        'old_role': old_role,
                        'new_role': new_role,
                        'restaurant_name': restaurant.restaurant_name,
                        'restaurant_is_special': restaurant.is_special
                    })
                    
                    # แก้ไข
                    user.role = new_role
                    user.save()
                    fixed_users.append(user.username)
                    
            except AttributeError:
                # ไม่มีร้าน - ไม่ต้องทำอะไร
                pass
        
        return Response({
            'message': f'Synced {len(fixed_users)} users successfully',
            'fixed_users': fixed_users,
            'details': mismatched_users
        })
    
 