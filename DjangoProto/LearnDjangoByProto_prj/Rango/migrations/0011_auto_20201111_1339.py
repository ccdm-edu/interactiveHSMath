# Generated by Django 3.1 on 2020-11-11 18:39

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Rango', '0010_auto_20200908_1833'),
    ]

    operations = [
        migrations.AddField(
            model_name='page',
            name='last_visit',
            field=models.DateTimeField(default=datetime.datetime(2020, 11, 11, 13, 39, 55, 209036)),
        ),
        migrations.AlterField(
            model_name='category',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2020, 11, 11, 13, 39, 55, 209036)),
        ),
    ]
