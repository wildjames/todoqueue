from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth import get_user_model

from logging import getLogger

logger = getLogger(__name__)

usermodel = get_user_model()


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

        total_completion_time = sum([work_log.completion_time for work_log in work_logs], timezone.timedelta())
        mean_completion_time = total_completion_time / work_logs.count()
        return mean_completion_time.total_seconds()

    def __str__(self):
        return self.task_name


class WorkLog(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    user = models.ForeignKey(usermodel, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    completion_time = models.DurationField()
    grossness = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    brownie_points = models.IntegerField()

    def save(self, *args, **kwargs):
        self.task.last_completed = timezone.now()
        self.task.save()

        self.user.brownie_point_credit += self.brownie_points
        self.user.save()
        logger.info(f"User {self.user.username} was credited with {self.brownie_points} BP, and now has a total credit of {self.user.brownie_point_credit} BP")

        super(WorkLog, self).save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.user.username} completed {self.task.task_name} at {self.timestamp}"
        )
