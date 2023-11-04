from datetime import timedelta
from logging import getLogger
from time import sleep

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.http import HttpResponseRedirect
from django.contrib.sites.shortcuts import get_current_site
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    CustomUserSerializer,
    CustomUserRegistrationSerializer,
    ResetPasswordSerializer,
)
from .utils import is_rate_limited

logger = getLogger(__name__)

user_model = get_user_model()


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = user_model.objects.all().order_by("-date_joined")
    serializer_class = CustomUserSerializer

    def get_queryset(self, *args, **kwargs):
        user = self.request.user
        # If user is admin, they can see all users
        if user.is_staff:
            return user_model.objects.all().order_by("-date_joined")
        # Otherwise, just show the logged in user
        return user_model.objects.filter(pk=user.pk)

    def check_permissions(self, request):
        super().check_permissions(request)
        # If it's a 'list' action and user is not admin, deny access
        if self.action == "list" and not request.user.is_staff:
            raise PermissionDenied(
                "You do not have permission to view the list of users."
            )


class GetUserData(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        """Return the serialization of the user who authenticated this request"""
        logger.info("Getting serialization of a single user")
        user = request.user
        serializer = CustomUserSerializer(user)
        serialized_data = serializer.data
        logger.info(f"User data: {serialized_data}")
        
        return Response(serialized_data)

class AuthView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        content = {"message": "Authenticated"}
        return Response(content)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        logger.info(f"Logging out user with email: {request.user.email}")
        try:
            refresh_token = request.data["refresh_token"]
            logger.info(f"Logging out user with refresh token: {refresh_token}")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            logger.info(f"Ran into an error logging out")
            logger.info(f"Error: {e}")
            return Response(status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    def post(self, request):
        # Check if the rate limit has been exceeded
        if is_rate_limited(
            request.META['REMOTE_ADDR'], "init_registration", max_attempts=20, period=timedelta(hours=1)
        ):
            return Response(
                {"detail": "Registration requests are limited to 20 per hour."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        logger.info(f"Registering user with email: {request.data['email']}")
        serializer = CustomUserRegistrationSerializer(data=request.data)

        # If the user already exists, and is not activated, then delete the user and create a new one
        try:
            user = user_model.objects.get(email=request.data["email"])
            if not user.is_active:
                logger.info(f"User found: {user}")
                user.delete()
                logger.info(f"User deleted: {user}")
            else:
                logger.info(f"User already exists: {user}")
                return Response(
                    {"detail": "User with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except user_model.DoesNotExist:
            pass

        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            logger.info(f"User created: {user}")
            user.is_active = False  # Deactivate account till it is confirmed
            user.save()

            try:
                # Generate token for email confirmation
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # Get the current site from the request
                current_site = get_current_site(request)
                # If we're using HTTP/HTTPS, use that as the protocol
                protocol = request.scheme
                current_site = f"{protocol}://{current_site.domain}"

                # Create activation link
                mail_subject = "Activate your account"
                message = render_to_string(
                    "accounts/activation_email.html",
                    {
                        "user": user,
                        "domain": current_site,
                        "uid": uid,
                        "token": token,
                    },
                )

                # Send activation email
                logger.info(f"Sending activation email to {user.email}")
                send_mail(
                    subject=mail_subject,
                    message=None,
                    from_email=None,
                    html_message=message,
                    recipient_list=[user.email],
                )
                logger.info(f"Activation email sent to {user.email}")

                return Response(
                    {
                        "detail": "Please confirm your email address to complete the registration."
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                logger.info(f"Registration failed: {e}")
                user.delete()
                return Response(
                    {"detail": "Registration failed: {}".format(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            {"detail": "Registration failed: {}".format(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ConfirmRegistrationView(APIView):
    def get(self, request, uidb64, token):
        # Check if the rate limit has been exceeded
        if is_rate_limited(
            request.META['REMOTE_ADDR'], "confirm_registration", max_attempts=50, period=timedelta(hours=1)
        ):
            return Response(
                {"detail": "Please stop spamming the confirmation endpoint."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        logger.info(f"Confirming registration for user with uidb64: {uidb64}")
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = user_model.objects.get(pk=uid)
            logger.info(f"User found: {user}")
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            logger.info(f"User activated: {user}")

            # Redirect the user to the login page on frontend
            return HttpResponseRedirect(f"/registration_confirmed")

        else:
            logger.info(f"Activation failed")
            return HttpResponseRedirect(f"/registration_failed")


class ForgotPasswordView(APIView):
    def post(self, request):
        # Check if the rate limit has been exceeded
        if is_rate_limited(
            request.META['REMOTE_ADDR'], "forgot_password", max_attempts=5, period=timedelta(hours=1)
        ):
            return Response(
                {"detail": "Password reset requests are limited to 5 per hour."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        logger.info(
            f"Forgot password request for user with email: {request.data['email']}"
        )
        try:
            user = user_model.objects.get(email=request.data["email"])
            logger.info(f"User found: {user}")
        except user_model.DoesNotExist:
            logger.info(f"User not found")
            sleep(10)
            return Response(
                {"detail": "User with this email does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Generate token for password reset
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Create password reset link
            current_site = get_current_site(request)
            # If we're using HTTP/HTTPS, use that as the protocol
            protocol = request.scheme
            current_site = f"{protocol}://{current_site.domain}"
            mail_subject = "Reset your password"
            message = render_to_string(
                "accounts/password_reset_email.html",  # Update the path based on where you place the email template
                {
                    "user": user,
                    "domain": current_site,
                    "uid": uid,
                    "token": token,
                },
            )

            # Send password reset email
            logger.info(f"Sending password reset email to {user.email}")
            try:
                send_mail(
                    subject=mail_subject,
                    message=None,
                    from_email=None,
                    html_message=message,
                    recipient_list=[user.email],
                )
            except Exception as e:
                return Response(
                    {"detail": "Password reset failed could not send email"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            logger.info(f"Password reset email sent to {user.email}")

            return Response(
                {"detail": "Please check your email for the password reset link."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.info(f"Password reset failed: {e}")
            return Response(
                {"detail": "Password reset failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CompleteForgotPasswordView(APIView):
    def post(self, request, uidb64, token):
        # Check if the rate limit has been exceeded
        if is_rate_limited(
            request.META['REMOTE_ADDR'], "new_password", max_attempts=20, period=timedelta(hours=1)
        ):
            return Response(
                {"detail": "Please stop spamming the password reset endpoint."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        logger.info(f"Completing forgot password for user with uidb64: {uidb64}")
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = user_model.objects.get(pk=uid)
            logger.info(f"User found: {user}")
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            logger.info(
                f"Token and user ID are valid for password reset of user {user}"
            )
            serializer = ResetPasswordSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                logger.info(f"Password reset for user: {user}")
                new_password = serializer.validated_data["new_password"]
                user.set_password(new_password)
                user.save()
                logger.info(f"Password reset complete for user: {user}")
                return Response(
                    {"detail": "Password has been reset with the new password."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"detail": "Password reset failed: {}".format(serializer.errors)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            logger.info(f"Invalid token or user ID")
            return Response(
                {"detail": "Invalid token or user ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
