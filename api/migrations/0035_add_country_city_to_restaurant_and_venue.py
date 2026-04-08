# Generated manually on 2026-04-07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_dineinproducttranslation'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='country',
            field=models.CharField(blank=True, help_text='Country where the restaurant is located', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='city',
            field=models.CharField(blank=True, help_text='City where the restaurant is located', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='entertainmentvenue',
            name='country',
            field=models.CharField(blank=True, help_text='Country where the venue is located', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='entertainmentvenue',
            name='city',
            field=models.CharField(blank=True, help_text='City where the venue is located', max_length=100, null=True),
        ),
    ]
