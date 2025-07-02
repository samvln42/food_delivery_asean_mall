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
            'unique': "This email is already in use. Please use a different email.",
        }
    )
    
    # Email verification fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Google OAuth field
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    def save(self, *args, **kwargs):
        # If superuser, set role to admin and verify email immediately
        if self.is_superuser:
            self.role = 'admin'
            self.is_email_verified = True
            
        # Check for duplicate email (for existing data updates)
        if self.email:
            existing_user = User.objects.filter(email__iexact=self.email).exclude(pk=self.pk).first()
            if existing_user:
                from django.core.exceptions import ValidationError
                raise ValidationError({'email': 'This email is already in use. Please use a different email.'})
                
        super().save(*args, **kwargs)

    def clean(self):
        """Validate model fields"""
        super().clean()
        if self.email:
            # Check for duplicate email (case-insensitive)
            existing_user = User.objects.filter(email__iexact=self.email).exclude(pk=self.pk).first()
            if existing_user:
                from django.core.exceptions import ValidationError
                raise ValidationError({'email': 'This email is already in use. Please use a different email.'})

    def __str__(self):
        return self.username 

# Signals for automatic token creation
@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    """
    Create authentication token in the following cases:
    1. New user created by admin (created_by_admin=True)
    2. Superuser (always)
    3. User with verified email (is_email_verified=True)
    """
    if created:
        # Check if created by admin
        created_by_admin = getattr(instance, '_created_by_admin', False)
        
        if instance.is_superuser or created_by_admin or instance.is_email_verified:
            Token.objects.get_or_create(user=instance)
            
            # Log token creation
            if instance.is_superuser:
                # print(f"🔑 Token created for superuser: {instance.username}")
                pass
            elif created_by_admin:
                # print(f"🔑 Token created for admin-created user: {instance.username}")
                pass
            elif instance.is_email_verified:
                # print(f"🔑 Token created for verified user: {instance.username}")
                pass
    
    # For existing superusers
    elif instance.is_superuser:
        Token.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def ensure_superuser_privileges(sender, instance=None, **kwargs):
    """Ensure superuser has correct permissions and settings"""
    if instance.is_superuser:
        updated = False
        
        # Set role to admin if not already
        if instance.role != 'admin':
            instance.role = 'admin'
            updated = True
            
        # Verify email if not already verified
        if not instance.is_email_verified:
            instance.is_email_verified = True
            updated = True
            
        # Set as staff if not already
        if not instance.is_staff:
            instance.is_staff = True
            updated = True
            
        # Save if there are changes (prevent recursive save)
        if updated:
            instance.__class__.objects.filter(pk=instance.pk).update(
                role=instance.role,
                is_email_verified=instance.is_email_verified,
                is_staff=instance.is_staff
            )
            # print(f"👑 Superuser privileges updated for: {instance.username}")
            pass

@receiver(post_save, sender=User)
def create_token_after_email_verification(sender, instance=None, created=False, **kwargs):
    """Create token after successful email verification (for self-registered users)"""
    if not created and instance.is_email_verified:
        # Check if token doesn't exist yet
        if not hasattr(instance, 'auth_token'):
            try:
                Token.objects.get(user=instance)
            except Token.DoesNotExist:
                Token.objects.create(user=instance)
                # print(f"🔑 Token created after email verification for: {instance.username}") 
                pass