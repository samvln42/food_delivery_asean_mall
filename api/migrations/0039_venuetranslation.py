from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0038_remove_entertainmentvenue_venue_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='VenueTranslation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('translated_name', models.CharField(blank=True, max_length=200)),
                ('translated_description', models.TextField(blank=True)),
                ('language', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.language')),
                ('venue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='api.entertainmentvenue')),
            ],
            options={
                'db_table': 'venue_translations',
                'unique_together': {('venue', 'language')},
            },
        ),
    ]
