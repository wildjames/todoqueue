from datetime import datetime
import uuid
from logging import getLogger

import croniter
from profanity_check import predict as is_profane
from profanity_check import predict_prob as how_profane

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.validators import UniqueValidator

from accounts.serializers import CustomUserSerializer

logger = getLogger(__name__)
usermodel = get_user_model()


def validate_profanity(value):
    logger.debug(f"Validating profanity for value: {value}")
    if is_profane([value])[0] == 1:
        logger.debug("Profanity detected!")
        raise ValidationError("Profanity is not allowed")
    logger.debug(f"Value {value} is OK - profanity score: {how_profane([value])[0]}")


class Household(models.Model):
    users = models.ManyToManyField(get_user_model(), related_name="households")
    name = models.CharField(max_length=255, validators=[validate_profanity])

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super(Household, self).save(*args, **kwargs)
        for user in self.users.all():
            logger.debug(
                f"Setting BP for user {user}. Current BP: {user.brownie_point_credit}"
            )
            if str(self.id) not in user.brownie_point_credit:
                logger.debug(f"Setting BP credit for user {user}")
                user.brownie_point_credit[str(self.id)] = 0.0
            if str(self.id) not in user.brownie_point_debit:
                logger.debug(f"Setting BP debit for user {user}")
                user.brownie_point_debit[str(self.id)] = 0.0
            logger.debug("saving user")
            user.save()

        # If this household has NO dummy task associated with it, create one
        if self.dummy_tasks.count() == 0:
            logger.debug("Creating dummy task for household")
            DummyTask.objects.create(household=self)
            logger.debug("OK")

    def get_dummy_task(self):
        """Returns the first dummy task for this household, or None if it doesn't exist."""
        try:
            logger.debug(f" Getting dummy task for household {self.name}")
            return self.dummy_tasks.first()
        except DummyTask.DoesNotExist:
            logger.debug(f" No dummy task found for household {self.name}")
            return None


@receiver(m2m_changed, sender=Household.users.through)
def update_brownie_points(sender, instance, action, **kwargs):
    if action == "post_add":
        for user in instance.users.all():
            logger.debug("Setting up brownie points for users in household")
            logger.debug(f"Users in household: {instance.users.all()}")
            for user in instance.users.all():
                logger.debug(
                    f"Setting BP for user {user}. Current BP: {user.brownie_point_credit}"
                )
                if str(instance.id) not in user.brownie_point_credit:
                    logger.debug(f"Setting BP credit for user {user}")
                    user.brownie_point_credit[str(instance.id)] = 0.0
                if str(instance.id) not in user.brownie_point_debit:
                    logger.debug(f"Setting BP debit for user {user}")
                    user.brownie_point_debit[str(instance.id)] = 0.0
                logger.debug("saving user")
                user.save()

        logger.debug("OK")

        return Response("OK", 200)


class ScheduledTask(models.Model):
    """A task that is scheduled to be completed at a certain time, or on a certain day of the week/month/year.
    Once the scheduled time has passed, the staleness of the task will increase linearly until the max_interval
    has passed, after which the staleness will be 1.0.

    There is a cron_schedule field, which accepts a string. This is a cron expression defining when the task should
    be due. From Cron docs:
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task_name = models.CharField(max_length=255, validators=[validate_profanity])
    description = models.TextField(default="", validators=[validate_profanity])
    last_completed = models.DateTimeField(auto_now_add=True)
    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="scheduled_tasks"
    )
    frozen = models.BooleanField(default=False)

    # Recurrance schedule. Cron syntax.
    cron_schedule = models.CharField(max_length=255, default="0 * * * *")
    max_interval = models.DurationField(default="0:0")

    @property
    def last_due(self):
        """Returns the previous time this task was due, as a datetime object."""
        cron = croniter.croniter(
            self.cron_schedule, timezone.now().astimezone(), ret_type=datetime
        )
        prev_due = cron.get_prev()
        logger.debug(f"The last time this task was due was: {prev_due}")
        return prev_due

    @property
    def next_due(self):
        """Returns the next time this task will occur, as a datetime object."""
        cron = croniter.croniter(
            self.cron_schedule, timezone.now().astimezone(), ret_type=datetime
        )
        next_due = cron.get_next()
        logger.debug(f"The next time this task is due is: {next_due}")
        return next_due

    # Calculate the staleness of this task
    @property
    def staleness(self):
        if self.frozen:
            return 0

        last_due = self.last_due
        now = timezone.now()
        logger.debug(f"Time is now: {now.astimezone()}")
        logger.debug(f"The task was last completed at {self.last_completed}")
        logger.debug(f"The task was last due at {last_due}")

        if self.last_completed > last_due:
            logger.debug("The task HAS been done since the last due date, so is fresh")
            return 0.0
        logger.debug("The task has not been done since the last due date.")

        # Allow some wiggle room. If the task was done in the last fifth of the previous interval,
        # we consider the last completion date to be within this interval too.
        if self.last_completed < last_due:
            if (last_due - self.last_completed) < (self.max_interval):
                logger.debug(
                    f"The task was completed in the last allowed interval time the previous due date, so we still consider it done"
                )
                return 0.0

        if now > (last_due + self.max_interval):
            logger.debug("The task is urgent!")
            return 1.0

        staleness = (now - last_due) / self.max_interval
        logger.debug(f"It has been {now - last_due} since the last due date")
        logger.debug(f"And the max interval allowed is {self.max_interval}")

        logger.debug(f"Staleness is {staleness}")
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


class FlexibleTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task_name = models.CharField(max_length=255, validators=[validate_profanity])
    description = models.TextField(default="", validators=[validate_profanity])
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


class OneShotTask(models.Model):
    """One-shot tasks only appear once, then when they are completed they never stop being fresh again"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task_name = models.CharField(max_length=255, validators=[validate_profanity])
    description = models.TextField(default="", validators=[validate_profanity])
    due_date = models.DateTimeField()
    due_before = models.BooleanField(default=False)
    time_to_complete = models.DurationField(default="0:0")
    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="oneshot_tasks"
    )
    frozen = models.BooleanField(default=False)
    last_completed = models.DateTimeField(auto_now_add=True)
    has_completed = models.BooleanField(default=False)

    @property
    def staleness(self):
        if self.frozen or self.has_completed:
            return 0

        now = timezone.now()
        remaining = None

        if self.due_before:
            deadline = self.due_date - self.time_to_complete

            if now < deadline:
                return 0
            remaining = now - deadline

        else:
            if now < self.due_date:
                return 0
            remaining = now - self.due_date

        logger.debug(f"Remaining: {remaining}")
        logger.debug(f"")

        # Normalize staleness to a value between 0 and 1
        staleness = min(remaining / self.time_to_complete, 1)
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


class DummyTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="dummy_tasks"
    )
    last_completed = models.DateTimeField(auto_now_add=True)
    frozen = models.BooleanField(default=False)

    @property
    def staleness(self):
        return 0.0

    @property
    def mean_completion_time(self):
        return 0.0

    def __str__(self):
        return "Dummy task for household {}".format(self.household.name)


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

                # Check if the task is a OneShotTask and set has_completed to True
                if isinstance(self.content_object, OneShotTask):
                    self.content_object.has_completed = True

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
                logger.debug(
                    f"Crediting user {self.user.email} in household {household.id}"
                )
                logger.debug(f"Current BP: {self.user.brownie_point_credit}")
                self.user.brownie_point_credit[str(household.id)] += self.brownie_points
                self.user.save()
                logger.debug(
                    f"User {self.user.username} was credited with {self.brownie_points} BP, and now has a total credit of {self.user.brownie_point_credit} BP"
                )
            except AttributeError:
                logger.error(
                    f"Task {self.content_object} does not have a household field or user does not have brownie_point_credit field."
                )

        super(WorkLog, self).save(*args, **kwargs)

    # TODO: Worklogs should carry a JSON payload of their tasks, in case the task gets deleted?


def get_task_by_id(task_id):
    """Returns both the Task object, and the ContentType object for the given task ID, as a tuple."""
    # Add other task models to this list as needed
    task_models = [DummyTask, FlexibleTask, ScheduledTask, OneShotTask]

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
    return None, None


class Invitation(models.Model):
    household = models.ForeignKey("Household", on_delete=models.CASCADE)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_invitations",
        on_delete=models.CASCADE,
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="received_invitations",
        on_delete=models.CASCADE,
    )
    accepted = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invitation from {self.sender} to {self.recipient} for {self.household}"


# Serializers have to live here, to avoid circular imports :(


class ScheduledTaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    next_due = serializers.SerializerMethodField()
    last_due = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()
    description = serializers.CharField(
        required=False, allow_blank=True, validators=[validate_profanity]
    )

    class Meta:
        model = ScheduledTask
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_next_due(self, obj):
        return obj.next_due

    def get_last_due(self, obj):
        return obj.last_due

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


class FlexibleTaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()
    description = serializers.CharField(
        required=False, allow_blank=True, validators=[validate_profanity]
    )

    class Meta:
        model = FlexibleTask
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


class OneShotTaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()
    description = serializers.CharField(
        required=False, allow_blank=True, validators=[validate_profanity]
    )

    class Meta:
        model = OneShotTask
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


class DummyTaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()

    class Meta:
        model = DummyTask
        fields = "__all__"

    def get_staleness(self, obj):
        return obj.staleness

    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time


def get_serializer_for_task(
    task_instance: FlexibleTask | ScheduledTask | OneShotTask | DummyTask,
) -> FlexibleTaskSerializer | ScheduledTaskSerializer | OneShotTaskSerializer | DummyTaskSerializer:
    # Return the appropriate serializer based on the type of task_instance
    if isinstance(task_instance, FlexibleTask):
        return FlexibleTaskSerializer
    if isinstance(task_instance, ScheduledTask):
        return ScheduledTaskSerializer
    if isinstance(task_instance, OneShotTask):
        return OneShotTaskSerializer
    if isinstance(DummyTask):
        return DummyTaskSerializer

    # Add other conditions for other task types. Don't forget!!

    raise TypeError("Task instance is not a valid task type.")


class AllTasksSerializer(serializers.BaseSerializer):
    def to_representation(self, obj):
        task, type = get_task_by_id(obj.id)
        if task is None:
            raise serializers.ValidationError("Task with the given ID does not exist.")

        try:
            serialized_data = get_serializer_for_task(task)(task).data
            serialized_data["type"] = type.model
        except TypeError:
            raise serializers.ValidationError("Failed to serialize task.")

        return serialized_data


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
        max_length=255,
        validators=[
            UniqueValidator(queryset=Household.objects.all()),
            validate_profanity,
        ],
    )

    class Meta:
        model = Household
        fields = ("name",)

    def create(self, validated_data):
        logger.info(f"Creating household with name: {validated_data['name']}")
        return Household.objects.create(name=validated_data["name"])


class InvitationSerializer(serializers.ModelSerializer):
    sender = CustomUserSerializer(read_only=True)
    recipient = CustomUserSerializer(read_only=True)
    household = HouseholdSerializer(read_only=True)

    class Meta:
        model = Invitation
        fields = ["id", "household", "sender", "recipient", "accepted", "timestamp"]

    def create(self, validated_data):
        # Custom create method, if needed. Might be useful if I ever add push notifications.
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Custom update method, if needed. Could push notification when invite is accepted
        return super().update(instance, validated_data)
