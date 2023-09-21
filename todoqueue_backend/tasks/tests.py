from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Task

from django.contrib.auth import get_user_model

usermodel = get_user_model()


class TaskTests(APITestCase):
    def setUp(self):
        self.task1 = Task.objects.create(
            task_name="Test Task 1",
            brownie_point_value=5,
            max_interval=7,
            min_interval=3,
            priority=1,
            description="This is a test task 1",
        )
        self.task2 = Task.objects.create(
            task_name="Test Task 2",
            brownie_point_value=10,
            max_interval=14,
            min_interval=7,
            priority=2,
            description="This is a test task 2",
        )
        self.user = usermodel.objects.create_user(
            username="test_user",
            password="test_password",
            email="test@email.com",
        )

    def test_create_task(self):
        url = reverse("task-list")
        data = {
            "task_name": "Test Task 3",
            "brownie_point_value": 20,
            "max_interval": 21,
            "min_interval": 10,
            "priority": 3,
            "description": "This is a test task 3",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 3)

    def test_delete_task(self):
        url = reverse("task-list") + "delete_task/"
        data = {"id": self.task1.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Task.objects.count(), 1)

    def test_task_done(self):
        url = reverse("task-list") + "task_done/"
        data = {"id": self.task1.id, "username": self.user.username}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            usermodel.objects.get(username=self.user.username).brownie_points,
            self.task1.brownie_point_value,
        )

    def test_list_tasks(self):
        url = reverse("task-list")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
