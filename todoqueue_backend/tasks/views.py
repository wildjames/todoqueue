from rest_framework import viewsets
from .models import Task, WorkLog
from .serializers import TaskSerializer, WorkLogSerializer

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from logging import getLogger
logger = getLogger(__name__)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by("-task_name")
    serializer_class = TaskSerializer


class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all().order_by("-timestamp")
    serializer_class = WorkLogSerializer


def calculate_brownie_points(task, completion_time, grossness):
    # Perform  calculations here
    # Return the calculated brownie points
    return 10  # Placeholder, replace with calculation

@api_view(['POST'])
def calculate_brownie_points_view(request):
    if request.method == 'POST':
        task_id = request.data.get('task_id')
        completion_time = request.data.get('completion_time')
        grossness = request.data.get('grossness')
        
        if task_id is None or completion_time is None or grossness is None:
            return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)

        # Call your calculation function
        brownie_points = calculate_brownie_points(task_id, completion_time, grossness)

        return Response({'brownie_points': brownie_points}, status=status.HTTP_200_OK)