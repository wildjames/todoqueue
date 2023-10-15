from django.contrib import admin
from .models import FlexibleTask, WorkLog, Household, ScheduledTask, DummyTask


class HouseholdAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name", "users__email")
    filter_horizontal = ("users",)


class DummyTaskAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "household",
    )
    search_fields = ("id",)
    list_filter = ("household",)


class FlexibleTaskAdmin(admin.ModelAdmin):
    list_display = (
        "task_name",
        "household",
        "last_completed",
        "max_interval",
        "min_interval",
    )
    search_fields = ("task_name",)
    list_filter = ("last_completed",)


class ScheduledTaskAdmin(admin.ModelAdmin):
    list_display = (
        "task_name",
        "household",
        "last_completed",
        "max_interval",
        "cron_schedule",
    )
    search_fields = ("task_name",)
    list_filter = ("last_completed",)

    def next_due(self, obj):
        return obj.next_due.strftime("%Y-%m-%d %H:%M:%S")

    next_due.short_description = "Next Due"


# Custom admin view for WorkLog model
class WorkLogAdmin(admin.ModelAdmin):
    list_display = (
        "content_type",
        "object_id",
        "content_object",
        "user",
        "timestamp",
        "completion_time",
        "grossness",
        "brownie_points",
    )
    search_fields = ("task__task_name", "user__email")
    list_filter = ("timestamp", "user", "content_type", "object_id")


# Register your models here.
admin.site.register(DummyTask, DummyTaskAdmin)
admin.site.register(FlexibleTask, FlexibleTaskAdmin)
admin.site.register(ScheduledTask, ScheduledTaskAdmin)
admin.site.register(WorkLog, WorkLogAdmin)
admin.site.register(Household, HouseholdAdmin)
