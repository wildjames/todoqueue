from datetime import timedelta
from logging import INFO, basicConfig, getLogger

from accounts.serializers import CustomUserWithBrowniePointsSerializer
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication


from .models import (
    CreateHouseholdSerializer,
    FlexibleTask,
    FlexibleTaskSerializer,
    Household,
    HouseholdSerializer,
    ScheduledTask,
    ScheduledTaskSerializer,
    AllTasksSerializer,
    UserStatisticsSerializer,
    WorkLog,
    WorkLogSerializer,
    get_task_by_id,
)

from .utils import bp_function, parse_duration

logger = getLogger(__name__)
basicConfig(level=INFO)


class ScheduledTaskViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = ScheduledTask.objects.all().order_by("-task_name")
    serializer_class = ScheduledTaskSerializer

    def get_queryset(self):
        """When a user requests a task list, only return tasks that belong to the household they are in"""
        logger.info(f"Getting tasks for user: {self.request.user}")
        user = self.request.user
        household_id = self.request.query_params.get("household", None)

        if household_id is None:
            # Return an empty queryset if household is not provided
            logger.info(f"No household provided")
            return ScheduledTask.objects.none()

        household = get_object_or_404(Household, id=household_id)

        if user in household.users.all():
            return ScheduledTask.objects.filter(household=household).order_by(
                "-task_name"
            )
        else:
            # Return an empty queryset if the user does not belong to the household
            return ScheduledTask.objects.none()


class FlexibleTaskViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = FlexibleTask.objects.all().order_by("-task_name")
    serializer_class = FlexibleTaskSerializer

    def get_queryset(self):
        """When a user requests a task list, only return tasks that belong to the household they are in"""
        logger.info(f"Getting tasks for user: {self.request.user}")
        user = self.request.user
        household_id = self.request.query_params.get("household", None)

        if household_id is None:
            # Return an empty queryset if household is not provided
            logger.info(f"No household provided")
            return FlexibleTask.objects.none()

        household = get_object_or_404(Household, id=household_id)

        if user in household.users.all():
            return FlexibleTask.objects.filter(household=household).order_by(
                "-task_name"
            )
        else:
            # Return an empty queryset if the user does not belong to the household
            return FlexibleTask.objects.none()


class AllTasksViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = AllTasksSerializer

    def get_queryset(self):
        user = self.request.user
        household_id = self.request.query_params.get("household", None)

        if household_id is None:
            # Return an empty queryset if household is not provided
            return []

        household = get_object_or_404(Household, id=household_id)

        if user in household.users.all():
            scheduled_tasks = ScheduledTask.objects.filter(household=household)
            flexible_tasks = FlexibleTask.objects.filter(household=household)
            return list(scheduled_tasks) + list(flexible_tasks)
        else:
            # Return an empty queryset if the user does not belong to the household
            return []

    def retrieve(self, request, *args, **kwargs):
        task_id = kwargs.get("pk")
        task, task_type = get_task_by_id(task_id)

        if not task:
            return Response(
                {"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND
            )

        data = AllTasksSerializer(task).data

        return Response(data)

    def delete(self, request, *args, **kwargs):
        task_id = kwargs.get("pk")
        task, task_type = get_task_by_id(task_id)

        if not task:
            return Response(
                {"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND
            )

        task.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_frozen(request, taskId):
    # Use the get_task_by_id function to retrieve the task
    task, task_type = get_task_by_id(taskId)

    if not task:
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

    # Toggle the frozen attribute
    task.frozen = not task.frozen
    task.save(update_fields=["frozen"])

    return Response({"frozen": task.frozen}, status=status.HTTP_200_OK)


class WorkLogViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = WorkLog.objects.all().order_by("-timestamp")
    serializer_class = WorkLogSerializer


class UserStatisticsView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = get_user_model().objects.all()
    serializer_class = UserStatisticsSerializer


class HouseholdViewSet(viewsets.ModelViewSet):
    serializer_class = HouseholdSerializer
    queryset = Household.objects.all()
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        # Only return households where the user is a member
        user = self.request.user
        logger.debug(f"Getting households for user: {user}")
        return Household.objects.filter(users__in=[user])

    def perform_create(self, serializer):
        # Automatically add the creating user to the household
        logger.info(
            f"Creating household called {serializer.validated_data['name']} for user {self.request.user}"
        )
        household = serializer.save()
        household.users.add(self.request.user)

    def update(self, request, *args, **kwargs):
        # Only allow users who are members of the household to update it
        instance = self.get_object()
        if request.user not in instance.users.all():
            return Response(status=status.HTTP_403_FORBIDDEN)

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only allow the user to delete a household if they are a member
        instance = self.get_object()
        if request.user not in instance.users.all():
            return Response(status=status.HTTP_403_FORBIDDEN)

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["GET"], url_path="users")
    def list_users(self, request, pk=None):
        """List the users that are members of this household"""
        # First, get the household object
        household = self.get_object()

        # Check if the requesting user is a member of the household
        if request.user not in household.users.all():
            return Response(
                {"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN
            )

        # Date calculations
        start_datetime = timezone.now() - timedelta(minutes=5)

        # Prefetch worklogs from the last 7 days and annotate the sum of brownie points
        users = household.users.annotate(
            rolling_brownie_points=Coalesce(
                Sum(
                    "worklog__brownie_points",
                    filter=Q(worklog__timestamp__gte=start_datetime),
                ),
                0,
            )
        )

        # Serialize the users of the household
        user_serializer = CustomUserWithBrowniePointsSerializer(users, many=True)

        return Response(user_serializer.data)

    @action(detail=True, methods=["GET"], url_path="tasks")
    def list_tasks(self, request, pk=None):
        """List the tasks that are members of this household"""
        # First, get the household object
        household = self.get_object()

        # Check if the requesting user is a member of the household
        if request.user not in household.users.all():
            return Response(
                {"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN
            )

        # Serialize the tasks of the household
        tasks = []

        flexible_task_serializer = FlexibleTaskSerializer(
            household.flexible_tasks.all(), many=True
        )
        tasks.extend(flexible_task_serializer.data)

        scheduled_task_serializer = ScheduledTaskSerializer(
            household.scheduled_tasks.all(), many=True
        )
        tasks.extend(scheduled_task_serializer.data)

        return Response(tasks)


class CreateHouseholdView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        logger.info(f"Creating a household: {request.data}")
        serializer = CreateHouseholdSerializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            household = serializer.save()
            logger.info(f"Household created: {household}")
            household.users.add(self.request.user)
            household.save()

        return Response("OK", 201)


class AddUserToHouseholdView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        logger.info(f"Adding user to household")
        # If the household doesn't exist, return a meaningful error
        try:
            household = Household.objects.get(pk=pk)
        except Household.DoesNotExist:
            logger.info(f"Household {pk} does not exist")
            return Response(
                {"detail": "Household does not exist"}, status=status.HTTP_404_NOT_FOUND
            )

        logger.info(f"Adding a user to the household: {household}")
        logger.info(f"Request: {request}")

        if "email" not in request.data:
            logger.info(f"Missing email")
            return Response(
                {"detail": "Missing email"}, status=status.HTTP_400_BAD_REQUEST
            )

        email = request.data["email"]

        try:
            user = get_user_model().objects.get(email=email)
            logger.info("Got user")
        except get_user_model().DoesNotExist:
            logger.info(f"User {email} does not exist")
            return Response(
                {"detail": "User does not exist"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            household.users.add(user)
        except Exception as e:
            logger.error(f"Failed to add user to household. Error: {e}")
            return Response(
                {"detail": "Failed to add user to household"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        user.save()
        household.save()

        return Response("OK", 200)


class RemoveUserFromHouseholdView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        logger.info(f"Removing user from household")
        household = Household.objects.get(pk=pk)

        logger.info(f"Removing a user from the household: {household}")
        logger.info(f"Request: {request}")

        email = request.data["email"]

        user = get_user_model().objects.get(email=email)
        logger.info("Got user")
        household.users.remove(user)

        logger.info(f"Household has {household.users.count()} users")
        if household.users.count() == 0:
            logger.info("Deleting household")
            household.delete()
        else:
            household.save()

        user.save()

        return Response("OK", 200)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def calculate_brownie_points_view(request):
    if request.method == "POST":
        task_id = request.data.get("task_id")
        completion_time = request.data.get("completion_time")
        grossness = request.data.get("grossness")

        if completion_time is None or grossness is None:
            return Response(
                {"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST
            )

        brownie_points = None
        grossnesses = None
        completion_times = None
        try:
            if task_id is not None:
                # Get all the work logs associated with this task
                work_logs = WorkLog.objects.filter(object_id=task_id)
                grossnesses = [work_log.grossness for work_log in work_logs]
                completion_times = [
                    work_log.completion_time.seconds / 60 for work_log in work_logs
                ]

            # Convert completion time to a timedelta. It's a string formatted for a DurationField ("[-]DD HH:MM:SS")
            completion_time_td = parse_duration(completion_time)
            completion_time_minutes = completion_time_td.seconds / 60

        except Exception as e:
            logger.info(f"Failed to calcualte brownie points. Error: {e}")
            return Response(
                {"error": "Could not calculate brownie points"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        brownie_points = bp_function(
            completion_time_minutes, grossness, grossnesses, completion_times
        )
        return Response({"brownie_points": brownie_points}, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def award_brownie_points(request, pk):
    logger.info(f"Awarding brownie points")
    logger.info(f"Household PK: {pk}")
    # Retrieve brownie_points from query parameters
    brownie_points = request.GET.get("brownie_points")
    logger.info(f"Brownie points: {brownie_points}")
    if brownie_points is None:
        return Response(
            {"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Convert brownie_points to integer
    try:
        brownie_points = int(brownie_points)
    except ValueError:
        return Response(
            {"error": "Invalid brownie_points value"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    household = get_object_or_404(
        Household, pk=pk
    )  # It'll return 404 if the household does not exist

    if user not in household.users.all():
        return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

    try:
        user.brownie_point_credit.setdefault(
            str(household.id), 0
        )  # This ensures the key exists
        user.brownie_point_credit[str(household.id)] += brownie_points
        user.save()
    except:
        return Response(
            {"error": "Failed to credit brownie points"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"success": "Credited brownie points"}, status=status.HTTP_200_OK)
