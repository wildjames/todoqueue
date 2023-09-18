from datetime import timedelta
from logging import INFO, basicConfig, getLogger

from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task, WorkLog
from .models import TaskSerializer, UserStatisticsSerializer, WorkLogSerializer

logger = getLogger(__name__)
basicConfig(level=INFO)


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = Task.objects.all().order_by("-task_name")
    serializer_class = TaskSerializer


class WorkLogViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = WorkLog.objects.all().order_by("-timestamp")
    serializer_class = WorkLogSerializer


class UserStatisticsView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = get_user_model().objects.all()
    serializer_class = UserStatisticsSerializer


def renormalize(value, old_min, old_max, new_min, new_max):
    old_range = old_max - old_min
    new_range = new_max - new_min
    new_value = (((value - old_min) * new_range) / old_range) + new_min
    return new_value


def parse_duration(duration_str):
    """Generate a timedelta object from a string formatted for a DurationField ("[-]DD HH:MM:SS")"""
    # Split by days and time
    if " " in duration_str:
        days_str, time_str = duration_str.split(" ")
        days = int(days_str)
    else:
        days = 0
        time_str = duration_str

    # Split time into hours, minutes, and seconds
    hours, minutes, seconds = map(int, time_str.split(":"))

    # Create a timedelta object
    return timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)


def calculate_brownie_points(task_id, completion_time, grossness):
    task = Task.objects.get(task_id=task_id)
    if task is None:
        logger.error("No task found with ID: {task_id}")
        return None

    logger.debug(f"[Task {task_id}]  Completion time: {completion_time}")

    # Convert completion time to a timedelta. It's a string formatted for a DurationField ("[-]DD HH:MM:SS")
    completion_time = parse_duration(completion_time)

    grossness = renormalize(float(grossness), 0, 5, 1, 2)

    logger.debug(f"[Task {task_id}]  Completion time as timedelta: {completion_time}")
    logger.debug(f"[Task {task_id}]  Grossness: {grossness}")
    logger.debug(f"[Task {task_id}]  Task max interval: {task.max_interval}")

    # Get all the work logs associated with this task
    work_logs = WorkLog.objects.filter(task=task)
    if work_logs is None or len(work_logs) == 0:
        logger.debug(
            f"[Task {task_id}]  No work logs for this task. Using this work log as the first."
        )
        average_grossness = grossness
        average_completion_time = completion_time

    else:
        # Calculate the average completion time (This is a timedelta)
        total_completion_time = timedelta(seconds=0)
        for work_log in work_logs:
            total_completion_time += work_log.completion_time
        logger.debug(f"[Task {task_id}]  Work logs have {len(work_logs)} entries")
        average_completion_time = total_completion_time / len(work_logs)

        # Calculate the average grossness.
        # Grossness as rated ranges from 1 to 5, but we need to map these values to the range 0.5 to 2
        total_grossness = 0
        for work_log in work_logs:
            total_grossness += renormalize(work_log.grossness, 1, 5, 0.5, 2)
        average_grossness = total_grossness / len(work_logs)

    completion_time_minutes = completion_time.seconds / 60
    average_completion_time_minutes = average_completion_time.seconds / 60

    # Calculate the brownie points
    brownie_points = (
        (grossness * completion_time_minutes)
        / (average_grossness * average_completion_time_minutes)
    ) * (average_completion_time_minutes * grossness)

    logger.debug(
        f"[Task {task_id}]  Average completion time (minutes): {average_completion_time_minutes}"
    )
    logger.debug(f"[Task {task_id}]  Average grossness: {average_grossness}")
    logger.debug(f"[Task {task_id}]  Brownie points: {brownie_points}")

    return brownie_points


@api_view(["POST"])
def calculate_brownie_points_view(request):
    if request.method == "POST":
        task_id = request.data.get("task_id")
        completion_time = request.data.get("completion_time")
        grossness = request.data.get("grossness")

        if task_id is None or completion_time is None or grossness is None:
            return Response(
                {"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Call your calculation function
        brownie_points = calculate_brownie_points(task_id, completion_time, grossness)

        if not brownie_points:
            return Response(
                {"error": "Could not calculate brownie points"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"brownie_points": brownie_points}, status=status.HTTP_200_OK)
