# Generated manually: flag image on Country

import os

from django.db import migrations, models
from django.utils.text import slugify


def country_flag_upload_path(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else 'png'
    base = slugify(instance.name) or f'country_{instance.pk or "new"}'
    pk = instance.pk or 'tmp'
    fname = f'{pk}_{base}.{ext}'
    return os.path.join('countries', 'flags', fname)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_country_city_models_and_fk'),
    ]

    operations = [
        migrations.AddField(
            model_name='country',
            name='flag',
            field=models.ImageField(
                blank=True,
                help_text='รูปธงชาติ (แนะนำสัดส่วนใกล้เคียง 4:3 หรือสี่เหลี่ยมจัตุรัส)',
                null=True,
                upload_to=country_flag_upload_path,
            ),
        ),
    ]
