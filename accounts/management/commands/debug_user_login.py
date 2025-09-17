from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug user login issues and fix email verification'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Debug specific user by username',
        )
        parser.add_argument(
            '--fix-all',
            action='store_true',
            help='Fix email verification for all users',
        )

    def handle(self, *args, **options):
        username = options.get('username')
        fix_all = options.get('fix_all')

        self.stdout.write(
            self.style.SUCCESS('🔍 Debugging user login issues...\n')
        )

        if username:
            # Debug specific user
            try:
                user = User.objects.get(username=username)
                self.debug_user(user)
                
                if not user.is_email_verified:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  Fixing email verification for user: {username}')
                    )
                    user.is_email_verified = True
                    user.save()
                    
                    # Create token if doesn't exist
                    token, created = Token.objects.get_or_create(user=user)
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Fixed! User {username} can now login')
                    )
                    
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ User not found: {username}')
                )
                return
        else:
            # Show all users
            users = User.objects.all().order_by('date_joined')
            
            self.stdout.write(f'📊 Total users in system: {users.count()}\n')
            
            for user in users:
                self.debug_user(user)
                
            # Fix all if requested
            if fix_all:
                self.stdout.write(
                    self.style.WARNING('\n⚠️  Fixing email verification for all users...')
                )
                
                updated_count = 0
                with transaction.atomic():
                    for user in users.filter(is_email_verified=False):
                        user.is_email_verified = True
                        user.save()
                        
                        # Create token if doesn't exist
                        token, created = Token.objects.get_or_create(user=user)
                        
                        updated_count += 1
                        self.stdout.write(f'✅ Fixed: {user.username}')
                
                self.stdout.write(
                    self.style.SUCCESS(f'\n🎉 Fixed {updated_count} users')
                )

    def debug_user(self, user):
        has_token = Token.objects.filter(user=user).exists()
        
        status_icon = "✅" if user.is_email_verified else "❌"
        token_icon = "✅" if has_token else "❌"
        active_icon = "✅" if user.is_active else "❌"
        
        self.stdout.write(f'👤 {user.username}:')
        self.stdout.write(f'   📧 Email: {user.email}')
        self.stdout.write(f'   👑 Role: {user.role}')
        self.stdout.write(f'   {status_icon} Email Verified: {user.is_email_verified}')
        self.stdout.write(f'   {token_icon} Has Token: {has_token}')
        self.stdout.write(f'   {active_icon} Is Active: {user.is_active}')
        self.stdout.write(f'   📅 Created: {user.date_joined}')
        self.stdout.write(f'   🔧 Is Superuser: {user.is_superuser}')
        self.stdout.write('') 