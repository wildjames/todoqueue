import json
import typing
import uuid
from logging import getLogger

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import m2m_changed, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from rest_framework import serializers
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.validators import UniqueValidator

logger = getLogger(__name__)
usermodel = get_user_model()


class Household(models.Model):
    users = models.ManyToManyField(get_user_model(), related_name="households")
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super(Household, self).save(*args, **kwargs)
        for user in self.users.all():
            logger.info(
                f"Setting BP for user {user}. Current BP: {user.brownie_point_credit}"
            )
            if str(self.id) not in user.brownie_point_credit:
                logger.info(f"Setting BP credit for user {user}")
                user.brownie_point_credit[str(self.id)] = 0.0
            if str(self.id) not in user.brownie_point_debit:
                logger.info(f"Setting BP debit for user {user}")
                user.brownie_point_debit[str(self.id)] = 0.0
            logger.info("saving user")
            user.save()


@receiver(m2m_changed, sender=Household.users.through)
def update_brownie_points(sender, instance, action, **kwargs):
    if action == "post_add":
        for user in instance.users.all():
            logger.info("Setting up brownie points for users in household")
            logger.info(f"Users in household: {instance.users.all()}")
            for user in instance.users.all():
                logger.info(
                    f"Setting BP for user {user}. Current BP: {user.brownie_point_credit}"
                )
                if str(instance.id) not in user.brownie_point_credit:
                    logger.info(f"Setting BP credit for user {user}")
                    user.brownie_point_credit[str(instance.id)] = 0.0
                if str(instance.id) not in user.brownie_point_debit:
                    logger.info(f"Setting BP debit for user {user}")
                    user.brownie_point_debit[str(instance.id)] = 0.0
                logger.info("saving user")
                user.save()

        logger.info("OK")

        return Response("OK", 200)


class ScheduledTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task_name = models.CharField(max_length=255)
    description = models.TextField(default="")
    last_completed = models.DateTimeField(auto_now_add=True)
    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="scheduled_tasks"
    )
    frozen = models.BooleanField(default=False)

    recur_dayhour = models.IntegerField(default=-1)
    recur_weekday = models.IntegerField(default=-1)
    recur_monthday = models.IntegerField(default=-1)
    recur_yearmonth = models.IntegerField(default=-1)

    max_interval = models.DurationField(default="0:0")

    # Calculate the staleness of this task
    @property
    def staleness(self):
        # TODO: implement
        return 1.0

    @property
    def mean_completion_time(self):
        work_logs = WorkLog.objects.filter(object_id=self.id)
        if work_logs.count() == 0:
            return timezone.timedelta(seconds=0)

        total_completion_time = sum(
            [work_log.completion_time for work_log in work_logs], timezone.timedelta()
        )
        mean_completion_time = total_completion_time / work_logs.count()
        return mean_completion_time.total_seconds()

    def save(self, *args, **kwargs):
        interval_list = [
            self.recur_dayhour,
            self.recur_weekday,
            self.recur_monthday,
            self.recur_yearmonth,
        ]

        # Exactly one recurrance interval has to be set
        if all([l == -1 for l in interval_list]):
            raise ValueError("One of the recur fields must be set (you set none)")

        # Check that exactly one is set
        recur_sum = sum(interval_list)
        check = recur_sum - max(interval_list)
        if check != -(len(interval_list) - 1):
            raise ValueError(
                "Exactly one of the recur fields must be set (you set more than one)"
            )

        super(ScheduledTask, self).save(*args, **kwargs)


class FlexibleTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task_name = models.CharField(max_length=255)
    description = models.TextField(default="")
    max_interval = models.DurationField(default="0:0")
    min_interval = models.DurationField(default="0:0")
    last_completed = models.DateTimeField(auto_now_add=True)
    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="flexible_tasks"
    )
    frozen = models.BooleanField(default=False)

    # Calculate the staleness of this task
    @property
    def staleness(self):
        if self.frozen:
            return 0

        time_since_last_completed = timezone.now() - self.last_completed
        if time_since_last_completed < self.min_interval:
            return 0
        if time_since_last_completed > self.max_interval:
            return 1

        # Calculate how many intervals have passed since the task was last completed
        staleness = (time_since_last_completed - self.min_interval) / (
            self.max_interval - self.min_interval
        )

        return staleness

    @property
    def mean_completion_time(self):
        work_logs = WorkLog.objects.filter(object_id=self.id)
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
    # Link to the User model
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    timestamp = models.DateTimeField(auto_now_add=True)
    grossness = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    completion_time = models.DurationField()
    brownie_points = models.IntegerField()

    # Generic relation to link to the Task model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return (
            f"{self.user.username} completed {self.content_object} at {self.timestamp}"
        )

    def save(self, *args, **kwargs):
        # If the task has been deleted, it'll be None
        if self.content_object:
            try:
                # Tasks MUST have a last_completed field
                self.content_object.last_completed = timezone.now()
                self.content_object.save()
            except AttributeError:
                logger.error(
                    f"Task {self.content_object} does not have a last_completed field."
                )

        # Only credit the user if the work log is new
        if self.pk is None:
            try:
                # Tasks MUST have a household field
                household = self.content_object.household
                logger.info(
                    f"Crediting user {self.user.email} in household {household.id}"
                )
                logger.info(f"Current BP: {self.user.brownie_point_credit}")
                self.user.brownie_point_credit[str(household.id)] += self.brownie_points
                self.user.save()
                logger.info(
                    f"User {self.user.username} was credited with {self.brownie_points} BP, and now has a total credit of {self.user.brownie_point_credit} BP"
                )
            except AttributeError:
                logger.error(
                    f"Task {self.content_object} does not have a household field or user does not have brownie_point_credit field."
                )

        super(WorkLog, self).save(*args, **kwargs)

    # TODO: Worklogs should carry a JSON payload of their tasks, in case the task gets deleted?


def get_task_by_id(task_id) -> FlexibleTask | ScheduledTask | None:
    # Add other task models to this list as needed
    task_models = [FlexibleTask, ScheduledTask]

    for model in task_models:
        try:
            task = model.objects.get(id=task_id)
            type = ContentType.objects.get_for_model(model)
            return task, type
        except model.DoesNotExist:
            continue
        except ContentType.DoesNotExist:
            logger.error(f"No content type found for model: {model}")
            continue

    logger.error(f"No task found with ID: {task_id}")
    return None


# Serializers have to live here, to avoid circular imports :(


class ScheduledTaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ScheduledTask
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


class FlexibleTaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = FlexibleTask
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


def get_serializer_for_task(
    task_instance: FlexibleTask | ScheduledTask,
) -> FlexibleTaskSerializer | ScheduledTaskSerializer:
    # Return the appropriate serializer based on the type of task_instance
    if isinstance(task_instance, FlexibleTask):
        return FlexibleTaskSerializer
    if isinstance(task_instance, ScheduledTask):
        return ScheduledTaskSerializer

    # Add other conditions for other task types. Don't forget!!


class WorkLogSerializer(serializers.ModelSerializer):
    task_id = serializers.UUIDField(write_only=True)
    user = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all())

    class Meta:
        model = WorkLog
        fields = (
            "task_id",
            "user",
            "completion_time",
            "grossness",
            "brownie_points",
            "timestamp",
            "content_type",
            "object_id",
        )
        read_only_fields = ("timestamp", "content_type", "object_id")

    def create(self, validated_data):
        task_id = validated_data.pop("task_id")

        # Check if the task is a ScheduledTask or FlexibleTask
        task, type = get_task_by_id(task_id)
        if task is None:
            raise serializers.ValidationError("Task with the given ID does not exist.")

        # Set the content_object to the task
        validated_data["content_object"] = task
        validated_data["content_type"] = type
        validated_data["object_id"] = task_id

        return super(WorkLogSerializer, self).create(validated_data)


class UserStatisticsSerializer(serializers.ModelSerializer):
    completed_tasks = serializers.SerializerMethodField()
    brownie_points = serializers.IntegerField(source="brownie_point_credit")

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


class HouseholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Household
        fields = "__all__"


class CreateHouseholdSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=255, validators=[UniqueValidator(queryset=Household.objects.all())]
    )

    class Meta:
        model = Household
        fields = ("name",)

    def create(self, validated_data):
        logger.info(f"Creating household with name: {validated_data['name']}")
        return Household.objects.create(name=validated_data["name"])
