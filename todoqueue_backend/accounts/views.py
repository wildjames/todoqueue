from logging import getLogger

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import HttpResponseRedirect
from .serializers import (
    CustomUserSerializer,
    CustomUserRegistrationSerializer,
    ResetPasswordSerializer,
)

logger = getLogger(__name__)

user_model = get_user_model()


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = user_model.objects.all().order_by("-date_joined")
    serializer_class = CustomUserSerializer


class AuthView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        content = {"message": "Authenticated"}
        return Response(content)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    def post(self, request):
        logger.info(f"Registering user with email: {request.data['email']}")
        serializer = CustomUserRegistrationSerializer(data=request.data)

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

                # Create activation link
                mail_subject = "Activate your account"
                message = render_to_string(
                    "accounts/activation_email.html",
                    {
                        "user": user,
                        "domain": current_site.domain,
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
            
            site = get_current_site(request).domain

            # Redirect the user to the login page on frontend
            return HttpResponseRedirect(f"{site}/login")

        else:
            logger.info(f"Activation failed")
            return HttpResponseRedirect(f"{site}/signup")


class ForgotPasswordView(APIView):
    def post(self, request):
        logger.info(
            f"Forgot password request for user with email: {request.data['email']}"
        )
        try:
            user = user_model.objects.get(email=request.data["email"])
            logger.info(f"User found: {user}")
        except user_model.DoesNotExist:
            logger.info(f"User not found")
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
            mail_subject = "Reset your password"
            message = render_to_string(
                "accounts/password_reset_email.html",  # Update the path based on where you place the email template
                {
                    "user": user,
                    "domain": current_site.domain,
                    "uid": uid,
                    "token": token,
                },
            )

            # Send password reset email
            logger.info(f"Sending password reset email to {user.email}")
            send_mail(
                subject=mail_subject,
                message=None,
                from_email=None,
                html_message=message,
                recipient_list=[user.email],
            )
            logger.info(f"Password reset email sent to {user.email}")

            return Response(
                {"detail": "Please check your email for the password reset link."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.info(f"Password reset failed: {e}")
            return Response(
                {"detail": "Password reset failed: {}".format(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CompleteForgotPasswordView(APIView):
    def post(self, request, uidb64, token):
        logger.info(f"Completing forgot password for user with uidb64: {uidb64}")
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = user_model.objects.get(pk=uid)
            logger.info(f"User found: {user}")
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            logger.info(f"Token and user ID are valid for password reset of user {user}")
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
