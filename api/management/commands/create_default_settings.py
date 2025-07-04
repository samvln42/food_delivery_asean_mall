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
            app_description='Online Food Delivery System',
            contact_email='lcs7397@gmail.com',
            contact_phone='020-5239-7676',
            contact_address='123 vientiane Road, Vientiane 10110',
            hero_title='Order Food Easily, Delivered to Your Home',
            hero_subtitle='Choose from premium restaurants, fast, delicious and safe delivery',
            feature_1_title='Fast Delivery',
            feature_1_description='Food delivered to you within 30-45 minutes',
            feature_1_icon='🚚',
            feature_2_title='Quality Food',
            feature_2_description='Quality restaurants, carefully selected',
            feature_2_icon='🍽️',
            feature_3_title='Easy Payment',
            feature_3_description='Multiple payment methods supported',
            feature_3_icon='💳',
            meta_keywords='food delivery, online food, restaurant, food ordering',
            meta_description='The best online food delivery system, fast delivery, free shipping, quality guaranteed',
            maintenance_mode=False,
            maintenance_message='System is under maintenance, please try again later'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created default app settings with ID: {settings.id}')
        ) 