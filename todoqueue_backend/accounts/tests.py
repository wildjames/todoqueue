from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from logging import getLogger, basicConfig, INFO
basicConfig(level=INFO)
logger = getLogger(__name__)

from .serializers import CustomUserSerializer
from .models import CustomUser


class CustomUserModelTests(APITestCase):
    def test_create_user(self):
        user = CustomUser.objects.create_user(
            email="test@example.com", username="testuser", password="testpass123"
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.username, "testuser")
        self.assertTrue(user.check_password("testpass123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        user = CustomUser.objects.create_superuser(
            email="admin@example.com", username="adminuser", password="adminpass123"
        )
        self.assertEqual(user.email, "admin@example.com")
        self.assertEqual(user.username, "adminuser")
        self.assertTrue(user.check_password("adminpass123"))
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)


class CustomUserSerializerTests(APITestCase):
    def setUp(self):
        self.user_data = {
            "email": "serializer@example.com",
            "username": "serializeruser",
        }
        self.user = CustomUser.objects.create(**self.user_data)

    def test_user_serializer(self):
        data = CustomUserSerializer(self.user).data
        self.assertEqual(
            set(data.keys()),
            set(
                [
                    "id",
                    "email",
                    "username",
                    "date_joined",
                    "brownie_point_credit",
                    "brownie_point_debit",
                ]
            ),
        )
        self.assertEqual(data["email"], self.user_data["email"])
        self.assertEqual(data["username"], self.user_data["username"])


class AccountViewsTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="viewstest@example.com", username="viewstest", password="testpass123"
        )
        self.login_url = reverse("token_obtain_pair")
        self.data = {"email": "viewstest@example.com", "password": "testpass123"}

    def test_login(self):
        response = self.client.post(self.login_url, self.data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("access" in response.data)
        self.assertTrue("refresh" in response.data)

    def test_register(self):
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "newpass123",
        }
        response = self.client.post(reverse("register"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(email="newuser@example.com").exists())

    def test_activate(self):
        user = CustomUser.objects.create_user(
            email="toactivate@example.com",
            username="toactivate",
            password="activatepass123",
            is_active=False,
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        response = self.client.get(
            reverse("activate", kwargs={"uidb64": uid, "token": token})
        )
        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)


class CustomUserTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="testuser@example.com", username="testuser", password="testpass"
        )
        self.client = APIClient()

    def test_create_user(self):
        self.assertEqual(self.user.email, "testuser@example.com")
        self.assertEqual(self.user.username, "testuser")
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

    def test_register_user_api(self):
        url = reverse("register")
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "newpass",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["detail"],
            "Please confirm your email address to complete the registration.",
        )

    def test_token_authentication(self):
        url = reverse("token_obtain_pair")
        data = {"email": "testuser@example.com", "password": "testpass"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout(self):
        # First get a token for the user
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

        # Now, logout
        url = reverse("logout")
        data = {"refresh_token": str(token)}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

    def test_forgot_password(self):
        url = reverse("forgot_password")
        data = {"email": "testuser@example.com"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["detail"],
            "Please check your email for the password reset link.",
        )

    def test_complete_forgot_password(self):
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        url = reverse("complete_forgot_password", args=[uid, token])
        data = {"new_password": "newtestpass", "confirm_new_password": "newtestpass"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["detail"], "Password has been reset with the new password."
        )

    def test_register_existing_email(self):
        url = reverse('register')
        data = {
            "email": "testuser@example.com",
            "username": "someotheruser",
            "password": "somepass"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'User with this email already exists.')

    def test_failed_login(self):
        url = reverse('token_obtain_pair')
        data = {
            "email": "testuser@example.com",
            "password": "wrongpassword"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "No active account found with the given credentials")

    def test_custom_user_viewset_list(self):
        # First get a token for the user
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        # Now, retrieve list of users
        url = reverse('customuser-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_custom_user_viewset_retrieve(self):
        # First get a token for the user
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        # Now, retrieve the user's own details
        url = reverse('customuser-detail', args=[self.user.id])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
