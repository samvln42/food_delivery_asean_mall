# Generated manually to add unique_together constraint and clean duplicate data

from django.db import migrations, models
from django.db.models import Count


def clean_duplicate_carts(apps, schema_editor):
    """
    ทำความสะอาดข้อมูล duplicate carts
    สำหรับแต่ละ (table, session_id, is_active) เก็บแค่ตัวล่าสุด (ตาม created_at)
    ลบ cart เก่าที่เหลือออก (ไม่ว่าจะเป็น active หรือ inactive)
    """
    DineInCart = apps.get_model('api', 'DineInCart')
    
    # หา groups ที่มี cart มากกว่า 1 ตัวสำหรับแต่ละ (table_id, session_id, is_active)
    # ต้องตรวจสอบทั้ง is_active=True และ is_active=False
    total_deleted = 0
    
    for is_active_value in [True, False]:
        duplicates = (
            DineInCart.objects
            .filter(is_active=is_active_value)
            .values('table_id', 'session_id', 'is_active')
            .annotate(count=Count('cart_id'))
            .filter(count__gt=1)
        )
        
        for dup in duplicates:
            # ดึง carts ทั้งหมดใน group นี้ เรียงตาม created_at (ใหม่สุดก่อน)
            carts = (
                DineInCart.objects
                .filter(
                    table_id=dup['table_id'],
                    session_id=dup['session_id'],
                    is_active=dup['is_active']
                )
                .order_by('-created_at')
            )
            
            # เก็บตัวแรก (ใหม่สุด) ลบตัวอื่นๆ
            keep_cart = carts.first()
            carts_to_delete = carts.exclude(cart_id=keep_cart.cart_id)
            
            # Django จะ cascade delete cart items ให้เอง (ตาม ForeignKey on_delete=CASCADE)
            deleted_count = carts_to_delete.delete()[0]
            total_deleted += deleted_count
            
            print(f"Deleted {deleted_count} duplicate {'active' if is_active_value else 'inactive'} carts for table_id={dup['table_id']}, session_id={dup['session_id']}")
    
    print(f"Total deleted duplicate carts: {total_deleted}")


def reverse_clean_duplicate_carts(apps, schema_editor):
    """
    Reverse operation - ไม่สามารถ restore ข้อมูลได้
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_dineinorder_bill_requested_and_more'),
    ]

    operations = [
        # ทำความสะอาดข้อมูล duplicate ก่อน
        migrations.RunPython(clean_duplicate_carts, reverse_clean_duplicate_carts),
        # เพิ่ม unique_together constraint
        migrations.AlterUniqueTogether(
            name='dineincart',
            unique_together={('table', 'session_id', 'is_active')},
        ),
    ]

