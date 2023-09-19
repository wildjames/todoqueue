from django.contrib import admin
from .models import Task, WorkLog, Household


class HouseholdAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name", "users__email")
    filter_horizontal = ("users",)


class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "task_name",
        "task_id",
        "last_completed",
        "max_interval",
        "min_interval",
    )
    search_fields = ("task_name", "task_id")
    list_filter = ("last_completed",)


# Custom admin view for WorkLog model
class WorkLogAdmin(admin.ModelAdmin):
    list_display = (
        "task",
        "user",
        "timestamp",
        "completion_time",
        "grossness",
        "brownie_points",
    )
    search_fields = ("task__task_name", "user__email")
    list_filter = ("timestamp", "user", "task")


# Register your models here.
admin.site.register(Task, TaskAdmin)
admin.site.register(WorkLog, WorkLogAdmin)
admin.site.register(Household, HouseholdAdmin)
