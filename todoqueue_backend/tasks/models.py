from django.db import models

class Task(models.Model):
    task_name = models.CharField(max_length=255)
    task_id = models.CharField(max_length=255, unique=True)
    brownie_point_value = models.IntegerField()
    max_interval = models.IntegerField()
    min_interval = models.IntegerField()
    priority = models.IntegerField()
    description = models.TextField()

    def __str__(self):
        return self.task_name
