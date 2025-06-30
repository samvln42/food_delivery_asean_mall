from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    restaurant_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'address', 
                 'role', 'password', 'date_joined', 'last_login', 'restaurant_info', 'is_active']
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_restaurant_info(self, obj):
        """Get restaurant info for restaurant users"""
        if obj.role in ['general_restaurant', 'special_restaurant']:
            try:
                restaurant = obj.restaurant
                return {
                    'id': restaurant.restaurant_id,
                    'name': restaurant.restaurant_name,
                    'is_special': restaurant.is_special,
                    'status': restaurant.status,
                    'role_matches_restaurant': (
                        (obj.role == 'special_restaurant' and restaurant.is_special) or
                        (obj.role == 'general_restaurant' and not restaurant.is_special)
                    )
                }
            except AttributeError:
                return {
                    'id': None,
                    'name': None,
                    'is_special': None,
                    'status': 'no_restaurant',
                    'role_matches_restaurant': False
                }
        return None
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        old_role = instance.role
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        
        # อัปเดทร้านอัตโนมัติเมื่อเปลี่ยนบทบาท
        if 'role' in validated_data and validated_data['role'] != old_role:
            self._update_restaurant_type(instance)
        
        return instance
    
    def _update_restaurant_type(self, user):
        """อัปเดทประเภทร้านให้ตรงกับบทบาทผู้ใช้"""
        try:
            restaurant = user.restaurant
            if user.role == 'special_restaurant':
                restaurant.is_special = True
            elif user.role == 'general_restaurant':
                restaurant.is_special = False
            restaurant.save()
        except AttributeError:
            # ไม่มีร้าน
            pass


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        help_text="Username or email address"
    )
    password = serializers.CharField(write_only=True)
    
    def validate_username(self, value):
        """Allow both username and email"""
        if not value:
            raise serializers.ValidationError("Username or email is required")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default='customer')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 
                 'phone_number', 'address', 'role']
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        
        # ตั้งค่า default role ถ้าไม่ได้ส่งมา
        if 'role' not in data or not data['role']:
            data['role'] = 'customer'
        
        # ตรวจสอบ role ที่อนุญาตสำหรับการสมัครสมาชิก
        # special_restaurant ต้องได้รับการอนุมัติจากแอดมินเท่านั้น
        allowed_registration_roles = ['customer', 'general_restaurant']
        if data.get('role') not in allowed_registration_roles:
            raise serializers.ValidationError(
                f"Invalid role for registration. Allowed roles are: {', '.join(allowed_registration_roles)}. "
                f"Special restaurant status requires admin approval."
            )
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        # ตั้งค่า default role ถ้าไม่มี
        if 'role' not in validated_data:
            validated_data['role'] = 'customer'
        
        user_role = validated_data.get('role')
        
        # สร้าง user
        user = User.objects.create_user(**validated_data)
        
        # สร้าง email verification token
        import uuid
        from django.utils import timezone
        user.email_verification_token = uuid.uuid4()
        user.email_verification_sent_at = timezone.now()
        user.is_email_verified = False
        user.save()
        
        # ส่ง notification ไปหาแอดมินเมื่อมีการสมัครเป็นร้านอาหาร
        if user_role == 'general_restaurant':
            self._notify_admin_new_restaurant_registration(user)
        
        return user
    
    def _notify_admin_new_restaurant_registration(self, user):
        """ส่ง notification ไปหาแอดมินทุกคนเมื่อมีร้านอาหารใหม่สมัครเข้ามา"""
        try:
            # หา admin ทุกคน
            admin_users = User.objects.filter(role='admin', is_active=True)
            
            # Import Notification model
            from api.models import Notification
            
            # สร้าง notification สำหรับแอดมินแต่ละคน
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title='🏪 มีร้านอาหารใหม่สมัครเข้าระบบ',
                    message=f'ผู้ใช้ "{user.username}" ({user.email}) ได้สมัครเป็นเจ้าของร้านอาหารใหม่ กรุณาตรวจสอบและอนุมัติการสร้างร้านอาหาร',
                    type='new_restaurant_registration'
                )
            
            print(f"✅ Notified {admin_users.count()} admin(s) about new restaurant registration: {user.username}")
            
        except Exception as e:
            # ถ้าส่ง notification ไม่ได้ก็ไม่เป็นไร ไม่ให้หยุดการสมัครสมาชิก
            print(f"⚠️ Failed to notify admins about new restaurant registration: {e}")


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return data


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (read-only fields except basic info)"""
    total_orders = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'address', 
                 'role', 'date_joined', 'is_email_verified', 'total_orders', 'total_spent']
        read_only_fields = ['id', 'username', 'email', 'role', 'date_joined', 'is_email_verified']


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    
    def validate_token(self, value):
        try:
            user = User.objects.get(email_verification_token=value)
            if user.is_email_verified:
                raise serializers.ValidationError("Email is already verified")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if user.is_email_verified:
                raise serializers.ValidationError("Email is already verified")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Email not found")


class GoogleOAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication"""
    access_token = serializers.CharField()
    
    def validate_access_token(self, value):
        """Validate Google access token"""
        from google.auth.transport import requests
        from google.oauth2 import id_token
        from django.conf import settings
        
        try:
            # Verify the token with Google
            request = requests.Request()
            id_info = id_token.verify_oauth2_token(
                value, request, settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            
            # Check if token is valid
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise serializers.ValidationError('Invalid token issuer')
            
            return id_info
        except ValueError as e:
            raise serializers.ValidationError(f'Invalid token: {str(e)}') 