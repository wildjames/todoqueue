import json
from logging import getLogger

from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone
from rest_framework import serializers
from rest_framework.renderers import JSONRenderer


logger = getLogger(__name__)

usermodel = get_user_model()


class Household(models.Model):
    users = models.ManyToManyField(get_user_model(), related_name="households")
    tasks = models.ManyToManyField("Task", related_name="households")
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Task(models.Model):
    task_name = models.CharField(max_length=255)
    task_id = models.CharField(max_length=255, unique=True, primary_key=True)
    description = models.TextField()
    max_interval = models.DurationField()
    min_interval = models.DurationField()
    last_completed = models.DateTimeField(auto_now_add=True)

    # Calculate the staleness of this task
    @property
    def staleness(self):
        time_since_last_completed = timezone.now() - self.last_completed

        if time_since_last_completed < self.min_interval:
            return 0

        if time_since_last_completed > self.max_interval:
            return 1

        staleness = (time_since_last_completed.seconds - self.min_interval.seconds) / (
            self.max_interval - self.min_interval
        ).seconds
        return staleness

    @property
    def mean_completion_time(self):
        work_logs = WorkLog.objects.filter(task=self)
        if work_logs.count() == 0:
            return timezone.timedelta(seconds=0)

        total_completion_time = sum(
            [work_log.completion_time for work_log in work_logs], timezone.timedelta()
        )
        mean_completion_time = total_completion_time / work_logs.count()
        return mean_completion_time.total_seconds()

    def __str__(self):
        return self.task_name


class WorkLog(models.Model):
    # Preserve the work logs, even if the task is deleted
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(usermodel, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    completion_time = models.DurationField()
    grossness = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    brownie_points = models.IntegerField()

    task_json = models.JSONField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # If the task has been deleted, it'll be None
        if self.task:
            self.task.last_completed = timezone.now()
            self.task.save()

        # Only credit the user if the work log is new
        if self.pk is None:
            self.user.brownie_point_credit += self.brownie_points
            self.user.save()
            logger.info(
                f"User {self.user.username} was credited with {self.brownie_points} BP, and now has a total credit of {self.user.brownie_point_credit} BP"
            )

        super(WorkLog, self).save(*args, **kwargs)

    @receiver(pre_delete, sender=Task)
    def save_task_to_worklogs(sender, instance, **kwargs):
        """When a task is deleted, preserve it's data in the worklogs as JSON"""
        worklogs = WorkLog.objects.filter(task=instance)
        serialized_task = TaskSerializer(instance)
        json_task = JSONRenderer().render(serialized_task.data)

        for worklog in worklogs:
            worklog.task_json = json.loads(json_task.decode("utf-8"))
            worklog.task = None  # Set task to NULL
            worklog.save()

    def __str__(self):
        if self.task:
            task_name = self.task.task_name
        else:
            task_name = self.task_json["task_name"]
        return f"{self.user.username} completed {task_name} at {self.timestamp}"


# Serializers have to live here, to avoid circular imports :(


class TaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


class WorkLogSerializer(serializers.ModelSerializer):
    task_data = serializers.SerializerMethodField()

    class Meta:
        model = WorkLog
        fields = "__all__"

    def get_task_data(self, obj):
        if obj.task:
            return TaskSerializer(obj.task).data
        else:
            return obj.task_json


class UserStatisticsSerializer(serializers.ModelSerializer):
    completed_tasks = serializers.SerializerMethodField()
    brownie_points = serializers.IntegerField(
        source="brownie_point_credit"
    )  # Assuming you have this field

    class Meta:
        model = get_user_model()
        fields = ("username", "completed_tasks", "brownie_points")

    def get_completed_tasks(self, obj):
        # Get the logs for the user, from the last 30 days
        work_logs = WorkLog.objects.filter(
            user=obj, timestamp__gte=timezone.now() - timezone.timedelta(days=30)
        )

        # If the task was deleted, fetch the data from the JSON field. If the task still exists, get it from the task object
        return [
            {
                "task_name": log.task.task_name
                if log.task
                else log.task_json["task_name"],
                "completion_time": log.completion_time.total_seconds(),
                "grossness": log.grossness,
                "brownie_points": log.brownie_points,
                "timestamp": log.timestamp,
            }
            for log in work_logs
        ]
