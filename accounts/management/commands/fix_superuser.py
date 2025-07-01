from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix existing superusers by setting admin role and creating tokens'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            help='Specific username to fix (optional)',
        )

    def handle(self, *args, **options):
        username = options.get('username')
        
        if username:
            # แก้ไข superuser คนเดียว
            try:
                user = User.objects.get(username=username, is_superuser=True)
                self.fix_user(user)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Superuser "{username}" not found!')
                )
                return
        else:
            # แก้ไข superuser ทั้งหมด
            superusers = User.objects.filter(is_superuser=True)
            
            if not superusers.exists():
                self.stdout.write(
                    self.style.WARNING('No superusers found!')
                )
                return
            
            for user in superusers:
                self.fix_user(user)

    def fix_user(self, user):
        """แก้ไข superuser ให้มี role admin และ token"""
        updated_fields = []
        
        # แก้ไข role ถ้าไม่ใช่ admin
        if user.role != 'admin':
            old_role = user.role
            user.role = 'admin'
            updated_fields.append(f'Role: {old_role} → admin')
        
        # ยืนยันอีเมลถ้ายังไม่ได้ยืนยัน
        if not user.is_email_verified:
            user.is_email_verified = True
            updated_fields.append('Email verified: False → True')
        
        # บันทึกการเปลี่ยนแปลง
        if updated_fields:
            user.save()
        
        # สร้าง token ถ้ายังไม่มี
        token, created = Token.objects.get_or_create(user=user)
        if created:
            updated_fields.append(f'Token created: {token.key}')
        else:
            updated_fields.append(f'Token exists: {token.key}')
        
        # แสดงผลลัพธ์
        if updated_fields:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Fixed superuser "{user.username}":\n' +
                    '\n'.join(f'  • {field}' for field in updated_fields)
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Superuser "{user.username}" already configured correctly'
                )
            ) 