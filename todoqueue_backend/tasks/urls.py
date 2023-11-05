from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"flexible-tasks", views.FlexibleTaskViewSet)
router.register(r"scheduled-tasks", views.ScheduledTaskViewSet)
router.register(r"all-tasks", views.AllTasksViewSet, basename="all-tasks")
router.register(r"worklogs", views.WorkLogViewSet)
router.register(r"households", views.HouseholdViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("toggle_frozen/<uuid:taskId>/", views.toggle_frozen, name="toggle_frozen"),
    path('dismiss_task/<uuid:taskId>/', views.dismiss_task, name='dismiss_task'),
    path(
        "calculate_brownie_points/",
        views.calculate_brownie_points_view,
        name="calculate_brownie_points",
    ),
    path(
        "user_statistics/", views.UserStatisticsView.as_view(), name="user_statistics"
    ),
    path(
        "create_household/",
        views.CreateHouseholdView.as_view(),
        name="create_household",
    ),
    path(
        "households/<int:pk>/get_dummy_task_id/",
        views.get_dummy_task_id,
        name="get_dummy_task_id",
    ),
    # path(
    #     "households/<pk>/add_user/",
    #     views.AddUserToHouseholdView.as_view(),
    #     name="add_user_to_household",
    # ),
    path(
        "households/<pk>/remove_user/",
        views.RemoveUserFromHouseholdView.as_view(),
        name="remove_user_from_household",
    ),
    path(
        "households/<int:pk>/invite_user/",
        views.InviteUserToHouseholdView.as_view(),
        name="invite_user_to_household",
    ),
    path(
        "invitations/pending/",
        views.PendingInvitationsView.as_view(),
        name="pending_invitations",
    ),
    path(
        "invitations/<int:invitation_id>/respond/",
        views.RespondToInvitationView.as_view(),
        name="respond_to_invitation",
    ),
]
