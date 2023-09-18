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

    # Calculate the staleness of this task
    @property
    def staleness(self):
        time_since_last_completed = timezone.now() - self.last_completed
        
        if time_since_last_completed < self.min_interval:
            return 0
        
        if time_since_last_completed > self.max_interval:
            return 1
        
        staleness = (time_since_last_completed - self.min_interval) / (self.max_interval - self.min_interval)
        
        return staleness

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

    # When a work log is created, set the last_completed field of the task to now
    def save(self, *args, **kwargs):
        self.task.last_completed = timezone.now()
        self.task.save()
        super(WorkLog, self).save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.user.username} completed {self.task.task_name} at {self.timestamp}"
        )
