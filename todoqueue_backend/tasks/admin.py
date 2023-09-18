from django.contrib import admin
from .models import Task, WorkLog  # Import your models here

# Custom admin view for Task model
class TaskAdmin(admin.ModelAdmin):
    list_display = ('task_name', 'task_id', 'last_completed', 'max_interval', 'min_interval')
    search_fields = ('task_name', 'task_id')
    list_filter = ('last_completed',)

# Custom admin view for WorkLog model
class WorkLogAdmin(admin.ModelAdmin):
    list_display = ('task', 'user', 'timestamp', 'completion_time', 'grossness', 'brownie_points')
    search_fields = ('task__task_name', 'user__username')
    list_filter = ('timestamp', 'user', 'task')

# Register your models here.
admin.site.register(Task, TaskAdmin)
admin.site.register(WorkLog, WorkLogAdmin)
