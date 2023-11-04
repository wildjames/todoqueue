from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = (
        "email",
        "username",
        "date_joined",
        "is_active",
        "is_staff",
        "has_logged_in",
        "brownie_point_credit",
        "brownie_point_debit",
    )
    list_filter = ("email", "username", "is_active", "is_staff")
    search_fields = ("email", "username")
    ordering = ("date_joined",)

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
        (
            "Additional Info",
            {
                "fields": (
                    "brownie_point_credit",
                    "brownie_point_debit",
                    "has_logged_in",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )


admin.site.register(CustomUser, CustomUserAdmin)
