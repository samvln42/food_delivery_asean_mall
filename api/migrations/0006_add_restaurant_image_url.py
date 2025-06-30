# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_add_restaurant_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='image_url',
            field=models.CharField(blank=True, help_text='URL รูปภาพหน้าร้าน', max_length=255, null=True),
        ),
    ] 