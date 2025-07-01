from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Count
from collections import defaultdict

User = get_user_model()

class Command(BaseCommand):
    help = 'Check and handle duplicate emails before making email field unique'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Automatically fix duplicate emails by appending numbers',
        )
        parser.add_argument(
            '--delete-duplicates',
            action='store_true',
            help='Delete newer duplicate accounts (DANGEROUS - use with caution)',
        )

    def handle(self, *args, **options):
        self.stdout.write("🔍 ตรวจสอบอีเมลซ้ำในระบบ...")
        
        # หาอีเมลที่ซ้ำกัน (case-insensitive)
        duplicates = self.find_duplicate_emails()
        
        if not duplicates:
            self.stdout.write(
                self.style.SUCCESS("✅ ไม่พบอีเมลซ้ำในระบบ สามารถรัน migration ได้")
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f"⚠️ พบอีเมลซ้ำ {len(duplicates)} รายการ:")
        )
        
        total_duplicates = 0
        for email, users in duplicates.items():
            total_duplicates += len(users) - 1  # ลบ 1 เพราะบัญชีแรกไม่ถือว่าซ้ำ
            self.stdout.write(f"  📧 {email}: {len(users)} บัญชี")
            for i, user in enumerate(users):
                status = "🔵 เก็บไว้" if i == 0 else "🔴 ซ้ำ"
                self.stdout.write(f"    {status} ID:{user.id} - {user.username} (สร้าง: {user.date_joined})")
        
        self.stdout.write(f"\n📊 สรุป: พบบัญชีซ้ำทั้งหมด {total_duplicates} บัญชี")
        
        if options['fix']:
            self.fix_duplicate_emails(duplicates)
        elif options['delete_duplicates']:
            self.delete_duplicate_accounts(duplicates)
        else:
            self.stdout.write(
                self.style.WARNING(
                    "\n💡 วิธีแก้ไข:\n"
                    "  • รัน --fix เพื่อแก้ไขอีเมลซ้ำโดยเพิ่มหมายเลข\n"
                    "  • รัน --delete-duplicates เพื่อลบบัญชีซ้ำ (อันตราย!)\n"
                    "  • หรือแก้ไขด้วยตนเองผ่าน Admin panel"
                )
            )

    def find_duplicate_emails(self):
        """หาอีเมลที่ซ้ำกัน"""
        duplicates = defaultdict(list)
        
        # สร้าง dictionary ของอีเมลทั้งหมด (case-insensitive)
        all_users = User.objects.all().order_by('date_joined')
        
        for user in all_users:
            if user.email:
                email_lower = user.email.lower()
                duplicates[email_lower].append(user)
        
        # เก็บเฉพาะที่มีมากกว่า 1 บัญชี
        return {email: users for email, users in duplicates.items() if len(users) > 1}

    def fix_duplicate_emails(self, duplicates):
        """แก้ไขอีเมลซ้ำโดยเพิ่มหมายเลข"""
        self.stdout.write("🔧 กำลังแก้ไขอีเมลซ้ำ...")
        
        fixed_count = 0
        for email, users in duplicates.items():
            # เก็บบัญชีแรก (เก่าที่สุด) ไว้
            original_user = users[0]
            self.stdout.write(f"  ✅ เก็บไว้: {original_user.username} - {original_user.email}")
            
            # แก้ไขบัญชีที่เหลือ
            for i, user in enumerate(users[1:], 1):
                old_email = user.email
                new_email = f"{email.split('@')[0]}.{i}@{email.split('@')[1]}"
                
                # ตรวจสอบว่าอีเมลใหม่ไม่ซ้ำ
                counter = i
                while User.objects.filter(email__iexact=new_email).exists():
                    counter += 1
                    new_email = f"{email.split('@')[0]}.{counter}@{email.split('@')[1]}"
                
                user.email = new_email
                user.save()
                
                self.stdout.write(f"  🔄 แก้ไขแล้ว: {user.username} - {old_email} → {new_email}")
                fixed_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f"✅ แก้ไขอีเมลซ้ำเสร็จสิ้น {fixed_count} รายการ")
        )

    def delete_duplicate_accounts(self, duplicates):
        """ลบบัญชีซ้ำ (เก็บไว้เฉพาะบัญชีแรก)"""
        self.stdout.write(
            self.style.ERROR("⚠️ อันตราย: กำลังลบบัญชีซ้ำ (เก็บไว้เฉพาะบัญชีเก่าที่สุด)")
        )
        
        deleted_count = 0
        for email, users in duplicates.items():
            original_user = users[0]
            self.stdout.write(f"  ✅ เก็บไว้: {original_user.username} - {original_user.email}")
            
            for user in users[1:]:
                self.stdout.write(f"  🗑️ ลบ: {user.username} - {user.email}")
                user.delete()
                deleted_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f"✅ ลบบัญชีซ้ำเสร็จสิ้น {deleted_count} รายการ")
        ) 