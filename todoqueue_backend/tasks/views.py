from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer

usermodel = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by("-priority")
    serializer_class = TaskSerializer

    @action(detail=False, methods=["POST"])
    def delete_task(self, request):
        task_id = request.data.get("task_id")
        try:
            task = Task.objects.get(task_id=task_id)
            task.delete()
            return Response(
                {"message": "Task deleted successfully"}, status=status.HTTP_200_OK
            )
        except Task.DoesNotExist:
            return Response(
                {"error": "Task does not exist"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["POST"])
    def task_done(self, request):
        task_id = request.data.get("task_id")
        username = request.data.get("username")
        try:
            task = Task.objects.get(task_id=task_id)
            user = usermodel.objects.get(username=username)

            user.brownie_points += task.brownie_point_value
            user.save()

            return Response(
                {"message": f"Task completed by {username}"}, status=status.HTTP_200_OK
            )
        except Task.DoesNotExist:
            return Response(
                {"error": "Task does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
