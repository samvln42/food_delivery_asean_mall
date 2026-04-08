# Generated manually: reference tables Country/City + FK on Restaurant & EntertainmentVenue

from django.db import migrations, models
import django.db.models.deletion


def forwards_migrate_location_strings(apps, schema_editor):
    Country = apps.get_model('api', 'Country')
    City = apps.get_model('api', 'City')
    Restaurant = apps.get_model('api', 'Restaurant')
    EntertainmentVenue = apps.get_model('api', 'EntertainmentVenue')

    def apply_to_row(row):
        cn = (getattr(row, 'country_name_legacy', None) or '').strip()
        ct = (getattr(row, 'city_name_legacy', None) or '').strip()
        row.country_id = None
        row.city_id = None
        cid = None
        if cn:
            country, _ = Country.objects.get_or_create(
                name=cn[:100],
                defaults={'sort_order': 0, 'is_active': True},
            )
            cid = country.country_id
            row.country_id = cid
        if ct and cid:
            city, _ = City.objects.get_or_create(
                country_id=cid,
                name=ct[:120],
            )
            row.city_id = city.city_id
        row.save(update_fields=['country_id', 'city_id'])

    for r in Restaurant.objects.all():
        apply_to_row(r)
    for v in EntertainmentVenue.objects.all():
        apply_to_row(v)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_add_country_city_to_restaurant_and_venue'),
    ]

    operations = [
        migrations.CreateModel(
            name='Country',
            fields=[
                ('country_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'countries',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='City',
            fields=[
                ('city_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=120)),
                ('country', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='cities',
                    to='api.country',
                )),
            ],
            options={
                'db_table': 'cities',
                'ordering': ['country', 'name'],
            },
        ),
        migrations.AddConstraint(
            model_name='city',
            constraint=models.UniqueConstraint(fields=('country', 'name'), name='unique_city_name_per_country'),
        ),
        migrations.AddIndex(
            model_name='country',
            index=models.Index(fields=['is_active', 'sort_order'], name='countries_active_sort_idx'),
        ),
        migrations.RenameField(
            model_name='restaurant',
            old_name='country',
            new_name='country_name_legacy',
        ),
        migrations.RenameField(
            model_name='restaurant',
            old_name='city',
            new_name='city_name_legacy',
        ),
        migrations.AddField(
            model_name='restaurant',
            name='country',
            field=models.ForeignKey(
                blank=True,
                help_text='Country where the restaurant is located',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='restaurants',
                to='api.country',
            ),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='city',
            field=models.ForeignKey(
                blank=True,
                help_text='City where the restaurant is located',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='restaurants',
                to='api.city',
            ),
        ),
        migrations.RenameField(
            model_name='entertainmentvenue',
            old_name='country',
            new_name='country_name_legacy',
        ),
        migrations.RenameField(
            model_name='entertainmentvenue',
            old_name='city',
            new_name='city_name_legacy',
        ),
        migrations.AddField(
            model_name='entertainmentvenue',
            name='country',
            field=models.ForeignKey(
                blank=True,
                help_text='Country where the venue is located',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='entertainment_venues',
                to='api.country',
            ),
        ),
        migrations.AddField(
            model_name='entertainmentvenue',
            name='city',
            field=models.ForeignKey(
                blank=True,
                help_text='City where the venue is located',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='entertainment_venues',
                to='api.city',
            ),
        ),
        migrations.RunPython(forwards_migrate_location_strings, backwards_noop),
        migrations.RemoveField(
            model_name='restaurant',
            name='country_name_legacy',
        ),
        migrations.RemoveField(
            model_name='restaurant',
            name='city_name_legacy',
        ),
        migrations.RemoveField(
            model_name='entertainmentvenue',
            name='country_name_legacy',
        ),
        migrations.RemoveField(
            model_name='entertainmentvenue',
            name='city_name_legacy',
        ),
    ]
