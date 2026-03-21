# Generated manually to add served fields to DineInOrderDetail

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0028_dineincart_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='dineinorderdetail',
            name='is_served',
            field=models.BooleanField(default=False, help_text='Has this item been served?'),
        ),
        migrations.AddField(
            model_name='dineinorderdetail',
            name='served_at',
            field=models.DateTimeField(blank=True, null=True, help_text='Time when this item was served'),
        ),
        migrations.AddField(
            model_name='dineinorderdetail',
            name='served_by',
            field=models.ForeignKey(
                blank=True, 
                null=True, 
                on_delete=django.db.models.deletion.SET_NULL, 
                related_name='served_order_details', 
                to=settings.AUTH_USER_MODEL,
                help_text='Staff who served this item',
            ),
        ),
    ]

