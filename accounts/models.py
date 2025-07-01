from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
import uuid

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('special_restaurant', 'Special Restaurant'),
        ('general_restaurant', 'General Restaurant'),
        ('customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    
    # Override email field to make it unique and required
    email = models.EmailField(
        verbose_name='email address',
        unique=True,
        blank=False,
        null=False,
        help_text='Required. Enter a valid email address.',
        error_messages={
            'unique': "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น",
        }
    )
    
    # Email verification fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Google OAuth field
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    def save(self, *args, **kwargs):
        # ถ้าเป็น superuser ให้ตั้ง role เป็น admin และยืนยันอีเมลทันที
        if self.is_superuser:
            self.role = 'admin'
            self.is_email_verified = True
            
        # ตรวจสอบว่าอีเมลไม่ซ้ำ (สำหรับการปรับปรุงข้อมูลเดิม)
        if self.email:
            existing_user = User.objects.filter(email__iexact=self.email).exclude(pk=self.pk).first()
            if existing_user:
                from django.core.exceptions import ValidationError
                raise ValidationError({'email': 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'})
                
        super().save(*args, **kwargs)

    def clean(self):
        """Validate model fields"""
        super().clean()
        if self.email:
            # ตรวจสอบอีเมลซ้ำแบบ case-insensitive
            existing_user = User.objects.filter(email__iexact=self.email).exclude(pk=self.pk).first()
            if existing_user:
                from django.core.exceptions import ValidationError
                raise ValidationError({'email': 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'})

    def __str__(self):
        return self.username 

# Signals เพื่อสร้าง token อัตโนมัติ
@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    """สร้าง authentication token เมื่อสร้างผู้ใช้ใหม่หรือเมื่อเป็น superuser"""
    if created or instance.is_superuser:
        Token.objects.get_or_create(user=instance)
        
        # Log การสร้าง token สำหรับ superuser
        if instance.is_superuser:
            print(f"🔑 Token created for superuser: {instance.username}")

@receiver(post_save, sender=User)
def ensure_superuser_privileges(sender, instance=None, **kwargs):
    """ตรวจสอบให้แน่ใจว่า superuser มีสิทธิ์และการตั้งค่าที่ถูกต้อง"""
    if instance.is_superuser:
        updated = False
        
        # ตั้ง role เป็น admin ถ้ายังไม่ใช่
        if instance.role != 'admin':
            instance.role = 'admin'
            updated = True
            
        # ยืนยันอีเมลถ้ายังไม่ได้ยืนยัน
        if not instance.is_email_verified:
            instance.is_email_verified = True
            updated = True
            
        # ตั้งให้เป็น staff ถ้ายังไม่ใช่
        if not instance.is_staff:
            instance.is_staff = True
            updated = True
            
        # บันทึกถ้ามีการเปลี่ยนแปลง (ป้องกัน recursive save)
        if updated:
            instance.__class__.objects.filter(pk=instance.pk).update(
                role=instance.role,
                is_email_verified=instance.is_email_verified,
                is_staff=instance.is_staff
            )
            print(f"👑 Superuser privileges updated for: {instance.username}") 