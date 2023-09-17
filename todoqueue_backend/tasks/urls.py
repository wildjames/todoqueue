# tasks/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"tasks", views.TaskViewSet)
router.register(r"worklogs", views.WorkLogViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path(
        "calculate_brownie_points/",
        views.calculate_brownie_points_view,
        name="calculate_brownie_points",
    ),
]
