from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0037_country_flag'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='entertainmentvenue',
            name='venue_type',
        ),
    ]
