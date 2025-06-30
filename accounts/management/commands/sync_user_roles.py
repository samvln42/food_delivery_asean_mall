from django.core.management.base import BaseCommand
from accounts.models import User
from api.models import Restaurant


class Command(BaseCommand):
    help = 'Sync User roles with Restaurant types'

    def handle(self, *args, **options):
        self.stdout.write("🔍 ตรวจสอบข้อมูลที่ไม่ตรงกัน...")
        
        mismatched_count = 0
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
                    mismatched_count += 1
                    old_role = user.role
                    new_role = 'special_restaurant' if restaurant.is_special else 'general_restaurant'
                    
                    self.stdout.write(
                        f"❌ {user.username} (ID: {user.id})\n"
                        f"   User Role: {old_role}\n"
                        f"   Restaurant: {restaurant.restaurant_name}\n"
                        f"   Is Special: {restaurant.is_special}\n"
                        f"   Should be: {new_role}"
                    )
                    
                    # แก้ไข
                    user.role = new_role
                    user.save()
                    fixed_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"   ✅ แก้ไขเป็น: {new_role}")
                    )
                    self.stdout.write("---")
                    
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"⚠️ User {user.username} มี role {user.role} แต่ไม่มีร้าน: {e}")
                )
        
        if mismatched_count == 0:
            self.stdout.write(
                self.style.SUCCESS("✅ ข้อมูลทั้งหมดถูกต้องแล้ว")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"\n🎉 แก้ไขข้อมูลเรียบร้อยแล้ว {fixed_count}/{mismatched_count} รายการ")
            )
        
        self.stdout.write("\n📝 กรุณา refresh หน้าจัดการผู้ใช้งานใน browser") 