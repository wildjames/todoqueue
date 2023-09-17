from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth import get_user_model

usermodel = get_user_model()


class Task(models.Model):
    task_name = models.CharField(max_length=255)
    task_id = models.CharField(max_length=255, unique=True, primary_key=True)
    description = models.TextField()
    max_interval = models.DurationField()
    min_interval = models.DurationField()
    last_completed = models.DateTimeField(auto_now_add=True)

    @property
    def mean_completion_time(self):
        if self.worklog_set.count() == 0:
            return None
        else:
            return sum(
                [worklog.completion_time for worklog in self.worklog_set.all()]
            ) / self.worklog_set.count()

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

    def __str__(self):
        return (
            f"{self.user.username} completed {self.task.task_name} at {self.timestamp}"
        )
