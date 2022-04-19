# Generated by Django 3.1 on 2021-01-04 23:31

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('Rango', '0013_auto_20201112_1124'),
    ]

    operations = [
        migrations.CreateModel(
            name='BotChkResults',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('pass_honeypot', models.BooleanField(default=False)),
                ('pass_mathtest', models.BooleanField(default=False)),
                ('recaptcha_v3_quartile', models.CharField(choices=[('1Q', 'Definitely_robot'), ('2Q', 'Maybe_robot'), ('3Q', 'Maybe_human'), ('4Q', 'Definitely_human')], max_length=2)),
                ('count', models.IntegerField(default=0)),
            ],
        ),
        migrations.AlterField(
            model_name='category',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='page',
            name='last_visit',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]