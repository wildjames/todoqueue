# Generated by Django 4.2.5 on 2023-09-29 16:01

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Task',
            new_name='FlexibleTask',
        ),
    ]