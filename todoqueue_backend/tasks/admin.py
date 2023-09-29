from django.contrib import admin
from .models import FlexibleTask, WorkLog, Household


class HouseholdAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name", "users__email")
    filter_horizontal = ("users",)


class FlexibleTaskAdmin(admin.ModelAdmin):
    list_display = (
        "task_name",
        "last_completed",
        "max_interval",
        "min_interval",
    )
    search_fields = ("task_name",)
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
admin.site.register(FlexibleTask, FlexibleTaskAdmin)
admin.site.register(WorkLog, WorkLogAdmin)
admin.site.register(Household, HouseholdAdmin)
