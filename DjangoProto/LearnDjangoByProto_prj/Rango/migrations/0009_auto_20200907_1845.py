# Generated by Django 3.1 on 2020-09-07 22:45

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Rango', '0008_auto_20200907_1832'),
    ]

    operations = [
        migrations.AlterField(
            model_name='category',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2020, 9, 7, 18, 45, 48, 755171)),
        ),
    ]