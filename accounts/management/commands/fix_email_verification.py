from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Check and fix email verification issues for existing users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show results without making actual changes',
        )
        parser.add_argument(
            '--verify-all',
            action='store_true',
            help='Verify email for all users who have not verified yet',
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Fix specific user by username',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verify_all = options['verify_all']
        username = options['username']

        self.stdout.write(
            self.style.SUCCESS('🔍 Checking email verification status...\n')
        )

        # Query users who haven't verified email
        if username:
            users = User.objects.filter(username=username)
            if not users.exists():
                self.stdout.write(
                    self.style.ERROR(f'❌ User not found with username: {username}')
                )
                return
        else:
            users = User.objects.filter(is_email_verified=False)

        unverified_users = users.filter(is_email_verified=False)
        
        if not unverified_users.exists():
            self.stdout.write(
                self.style.SUCCESS('✅ No users found with unverified email')
            )
            return

        self.stdout.write(f'📊 Found {unverified_users.count()} users with unverified email\n')

        # Show user details
        for user in unverified_users:
            has_token = Token.objects.filter(user=user).exists()
            self.stdout.write(f'👤 User: {user.username}')
            self.stdout.write(f'   📧 Email: {user.email}')
            self.stdout.write(f'   👑 Role: {user.role}')
            self.stdout.write(f'   🔑 Has Token: {"✅" if has_token else "❌"}')
            self.stdout.write(f'   📅 Created: {user.date_joined}')
            self.stdout.write(f'   ✉️ Email Verified: {"✅" if user.is_email_verified else "❌"}')
            self.stdout.write('')

        if verify_all and not dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  Verifying email for all users...')
            )
            
            with transaction.atomic():
                updated_count = 0
                for user in unverified_users:
                    # Verify email
                    user.is_email_verified = True
                    user.save()
                    
                    # Create token if doesn't exist
                    token, created = Token.objects.get_or_create(user=user)
                    
                    updated_count += 1
                    self.stdout.write(f'✅ Updated: {user.username}')

                self.stdout.write(
                    self.style.SUCCESS(f'\n🎉 Update completed! Verified email for {updated_count} users')
                )

        elif verify_all and dry_run:
            self.stdout.write(
                self.style.WARNING('🔍 DRY RUN: Will verify email for the following users:')
            )
            for user in unverified_users:
                self.stdout.write(f'   - {user.username} ({user.email})')

        # Show statistics
        self.stdout.write('\n📈 Overall Statistics:')
        total_users = User.objects.count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        admin_users = User.objects.filter(role='admin').count()
        
        self.stdout.write(f'   👥 Total Users: {total_users}')
        self.stdout.write(f'   ✅ Verified Users: {verified_users}')
        self.stdout.write(f'   ❌ Unverified Users: {total_users - verified_users}')
        self.stdout.write(f'   👑 Admin Users: {admin_users}')

        if not verify_all and not dry_run:
            self.stdout.write(
                self.style.WARNING('\n💡 To verify email for all users, use: --verify-all')
            )
            self.stdout.write(
                self.style.WARNING('💡 To see results without making changes, use: --dry-run')
            ) 