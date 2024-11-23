# Generated by Django 4.2.5 on 2023-11-01 21:43

from django.db import migrations, models
import tasks.models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0003_dummytask"),
    ]

    operations = [
        migrations.AlterField(
            model_name="flexibletask",
            name="description",
            field=models.TextField(
                default="", validators=[tasks.models.validate_profanity]
            ),
        ),
        migrations.AlterField(
            model_name="flexibletask",
            name="task_name",
            field=models.CharField(
                max_length=255, validators=[tasks.models.validate_profanity]
            ),
        ),
        migrations.AlterField(
            model_name="household",
            name="name",
            field=models.CharField(
                max_length=255, validators=[tasks.models.validate_profanity]
            ),
        ),
        migrations.AlterField(
            model_name="scheduledtask",
            name="description",
            field=models.TextField(
                default="", validators=[tasks.models.validate_profanity]
            ),
        ),
        migrations.AlterField(
            model_name="scheduledtask",
            name="task_name",
            field=models.CharField(
                max_length=255, validators=[tasks.models.validate_profanity]
            ),
        ),
    ]
