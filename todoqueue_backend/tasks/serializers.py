from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['task_name', 'task_id', 'brownie_point_value', 'max_interval', 'min_interval', 'priority', 'description']
