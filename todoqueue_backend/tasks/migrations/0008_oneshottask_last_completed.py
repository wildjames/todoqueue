# Generated by Django 4.2.5 on 2023-11-06 20:50

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0007_alter_oneshottask_due_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='oneshottask',
            name='last_completed',
            field=models.DateTimeField(auto_now_add=True, default=datetime.datetime(2023, 11, 6, 20, 50, 34, 981370, tzinfo=datetime.timezone.utc)),
            preserve_default=False,
        ),
    ]
