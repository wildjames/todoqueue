# Generated by Django 4.2.5 on 2023-10-09 08:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="scheduledtask",
            name="recur_dayhour",
        ),
        migrations.RemoveField(
            model_name="scheduledtask",
            name="recur_monthday",
        ),
        migrations.RemoveField(
            model_name="scheduledtask",
            name="recur_weekday",
        ),
        migrations.RemoveField(
            model_name="scheduledtask",
            name="recur_yearmonth",
        ),
        migrations.AddField(
            model_name="scheduledtask",
            name="cron_schedule",
            field=models.CharField(default="0 * * * *", max_length=255),
        ),
    ]
