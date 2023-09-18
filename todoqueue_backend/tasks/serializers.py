from rest_framework import serializers
from .models import Task, WorkLog

from django.contrib.auth import get_user_model
from django.utils import timezone

class TaskSerializer(serializers.ModelSerializer):
    staleness = serializers.SerializerMethodField()
    mean_completion_time = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'

    def get_staleness(self, obj):
        return obj.staleness
    
    def get_mean_completion_time(self, obj):
        return obj.mean_completion_time

class WorkLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkLog
        fields = '__all__'

class UserStatisticsSerializer(serializers.ModelSerializer):
    completed_tasks = serializers.SerializerMethodField()
    brownie_points = serializers.IntegerField(source='brownie_point_credit')  # Assuming you have this field

    class Meta:
        model = get_user_model()
        fields = ('username', 'completed_tasks', 'brownie_points')

    def get_completed_tasks(self, obj):
        # Get the logs for the user, from the last 30 days
        work_logs = WorkLog.objects.filter(user=obj, timestamp__gte=timezone.now() - timezone.timedelta(days=30))
        return [
            {
                'task_name': log.task.task_name,
                'completion_time': log.completion_time.total_seconds(),
                'grossness': log.grossness,
                'brownie_points': log.brownie_points,
                'timestamp': log.timestamp
            }
            for log in work_logs
        ]