from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

def send_verification_email(user):
    """
    ส่งอีเมลยืนยันให้ผู้ใช้
    """
    try:
        # สร้าง verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_verification_token}"
        
        # Context สำหรับ template
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'Food Delivery',
        }
        
        # สร้างเนื้อหาอีเมล
        subject = 'Verify your email - Food Delivery'
        text_content = render_to_string('accounts/emails/email_verification.txt', context)
        html_content = render_to_string('accounts/emails/email_verification.html', context)
        
        # สร้างและส่งอีเมล
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # ส่งอีเมล
        result = msg.send()
        
        if result:
            # อัปเดตเวลาส่ง email
            user.email_verification_sent_at = timezone.now()
            user.save()
            
            logger.info(f"Verification email sent successfully to {user.email}")
            return True
        else:
            logger.error(f"Failed to send verification email to {user.email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending verification email to {user.email}: {str(e)}")
        return False


def send_password_reset_email(user, reset_token):
    """
    ส่งอีเมลรีเซ็ตรหัสผ่าน (สำหรับอนาคต)
    """
    try:
        # สร้าง reset URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': 'Food Delivery',
        }
        
        subject = 'Reset your password - Food Delivery'
        
        # ในตัวอย่างนี้ใช้ text เท่านั้น (สามารถสร้าง HTML template ได้)
        message = f"""
Hello {user.username},

You have requested to reset your password for Food Delivery account

Please click the link below to reset your password:
{reset_url}

Note:
- This link will expire in 1 hour
- If you did not request a password reset, please ignore this email

© 2025 Food Delivery
"""
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        
        result = msg.send()
        
        if result:
            logger.info(f"Password reset email sent successfully to {user.email}")
            return True
        else:
            logger.error(f"Failed to send password reset email to {user.email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending password reset email to {user.email}: {str(e)}")
        return False


def is_email_verification_expired(user, hours=24):
    """
    ตรวจสอบว่าอีเมลยืนยันหมดอายุหรือไม่
    """
    if not user.email_verification_sent_at:
        return True
    
    from datetime import timedelta
    expiry_time = user.email_verification_sent_at + timedelta(hours=hours)
    return timezone.now() > expiry_time 