from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from django.core.management.utils import get_random_secret_key
import getpass

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser with admin role and authentication token'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            help='Username for the superuser',
        )
        parser.add_argument(
            '--email',
            help='Email for the superuser',
        )
        parser.add_argument(
            '--password',
            help='Password for the superuser',
        )

    def handle(self, *args, **options):
        username = options.get('username')
        email = options.get('email')
        password = options.get('password')

        # รับข้อมูลจากผู้ใช้หากไม่ได้ระบุใน arguments
        if not username:
            username = input('Username: ')
        
        if not email:
            email = input('Email: ')
        
        if not password:
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Password (again): ')
            if password != password_confirm:
                self.stdout.write(
                    self.style.ERROR('Passwords do not match!')
                )
                return

        # ตรวจสอบว่า username ซ้ำหรือไม่
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.ERROR(f'User with username "{username}" already exists!')
            )
            return

        # ตรวจสอบว่า email ซ้ำหรือไม่
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'User with email "{email}" already exists!')
            )
            return

        try:
            # สร้าง superuser พร้อม role admin
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            
            # ตั้ง role เป็น admin
            user.role = 'admin'
            user.is_email_verified = True  # ยืนยันอีเมลทันที
            user.save()

            # สร้าง authentication token
            token, created = Token.objects.get_or_create(user=user)

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Superuser "{username}" created successfully!\n'
                    f'📧 Email: {email}\n'
                    f'👑 Role: {user.role}\n'
                    f'🔑 API Token: {token.key}\n'
                    f'✅ Email verified: {user.is_email_verified}\n'
                    f'✅ Is superuser: {user.is_superuser}\n'
                    f'✅ Is staff: {user.is_staff}'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            ) 