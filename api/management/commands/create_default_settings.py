from django.core.management.base import BaseCommand
from api.models import AppSettings


class Command(BaseCommand):
    help = 'Create default app settings'

    def handle(self, *args, **options):
        # Check if settings already exist
        if AppSettings.objects.exists():
            self.stdout.write(
                self.style.WARNING('App settings already exist. Skipping creation.')
            )
            return

        # Create default settings
        settings = AppSettings.objects.create(
            app_name='Food Delivery',
            app_description='ระบบสั่งอาหารออนไลน์',
            contact_email='support@fooddelivery.com',
            contact_phone='02-xxx-xxxx',
            contact_address='123 ถนนสุขุมวิท กรุงเทพฯ 10110',
            hero_title='สั่งอาหารง่ายๆ ส่งถึงบ้านคุณ',
            hero_subtitle='เลือกจากร้านอาหารชั้นนำ ส่งเร็ว อร่อย ปลอดภัย',
            feature_1_title='ส่งเร็ว',
            feature_1_description='ส่งอาหารถึงมือคุณภายใน 30-45 นาที',
            feature_1_icon='🚚',
            feature_2_title='คุณภาพดี',
            feature_2_description='ร้านอาหารคุณภาพ ผ่านการคัดเลือก',
            feature_2_icon='🍽️',
            feature_3_title='จ่ายง่าย',
            feature_3_description='รองรับการชำระเงินหลายช่องทาง',
            feature_3_icon='💳',
            meta_keywords='food delivery, ส่งอาหาร, restaurant, อาหารออนไลน์',
            meta_description='ระบบสั่งอาหารออนไลน์ที่ดีที่สุด ส่งเร็ว ส่งฟรี คุณภาพดี',
            maintenance_mode=False,
            maintenance_message='ระบบอยู่ระหว่างการปรับปรุง กรุณาลองใหม่อีกครั้ง'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created default app settings with ID: {settings.id}')
        ) 