from datetime import timedelta, datetime
from rest_framework import viewsets
from .models import Task, WorkLog
from .serializers import TaskSerializer, WorkLogSerializer

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from logging import getLogger, basicConfig, INFO

logger = getLogger(__name__)
basicConfig(level=INFO)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by("-task_name")
    serializer_class = TaskSerializer


class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all().order_by("-timestamp")
    serializer_class = WorkLogSerializer


def renormalize(value, old_min, old_max, new_min, new_max):
    old_range = old_max - old_min
    new_range = new_max - new_min
    new_value = (((value - old_min) * new_range) / old_range) + new_min
    return new_value


def calculate_brownie_points(task_id, completion_time, grossness):
    task = Task.objects.get(task_id=task_id)
    if task is None:
        logger.error("No task found with ID: {task_id}")
        return None

    # Convert completion time to a timedelta. It's a string formatted for a DurationField
    completion_time = datetime.strptime(completion_time, "%H:%M:%S")
    completion_time = timedelta(
        hours=completion_time.hour,
        minutes=completion_time.minute,
        seconds=completion_time.second,
    )
    
    grossness = float(grossness)

    logger.info(f"Completion time: {completion_time}")
    logger.info(f"Grossness: {grossness}")
    logger.info(f"Task max interval: {task.max_interval}")

    # Get all the work logs associated with this task
    work_logs = WorkLog.objects.filter(task=task)
    if work_logs is None:
        logger.info("No work logs for this task. Using this work log as the first.")
        average_grossness = renormalize(grossness, 0, 5, 0.5, 2)
        average_completion_time = completion_time

    else:
        # Calculate the average completion time (This is a timedelta)
        total_completion_time = timedelta(seconds=0)
        for work_log in work_logs:
            total_completion_time += work_log.completion_time
        average_completion_time = total_completion_time / len(work_logs)

        # Calculate the average grossness.
        # Grossness as rated ranges from 1 to 5, but we need to map these values to the range 0.5 to 2
        total_grossness = 0
        for work_log in work_logs:
            total_grossness += renormalize(work_log.grossness, 1, 5, 0.5, 2)
        average_grossness = total_grossness / len(work_logs)

    # Calculate the brownie points
    brownie_points = (
        (grossness * completion_time) / (average_grossness * average_completion_time)
    ) * (average_completion_time)

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
