# Generated by Django 4.2.5 on 2023-11-04 09:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_customuser_username'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='has_logged_in',
            field=models.BooleanField(default=False),
        ),
    ]