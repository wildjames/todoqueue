from rest_framework import serializers
from .models import Task, WorkLog

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
