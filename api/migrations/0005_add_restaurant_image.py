# Generated manually

from django.db import migrations, models
import api.models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_add_image_field_to_product'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='image',
            field=models.ImageField(blank=True, help_text='รูปภาพหน้าร้าน', null=True, upload_to=api.models.restaurant_image_upload_path),
        ),
    ] 