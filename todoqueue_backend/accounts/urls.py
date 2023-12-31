from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomUserViewSet,
    GetUserData,
    AuthView,
    LogoutView,
    RegisterView,
    ConfirmRegistrationView,
    ForgotPasswordView,
    CompleteForgotPasswordView,
)
from rest_framework_simplejwt import views as jwt_views

router = DefaultRouter()
router.register(r"accounts", CustomUserViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/", AuthView.as_view(), name="auth"),
    path("token/", jwt_views.TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", jwt_views.TokenRefreshView.as_view(), name="token_refresh"),
    path("user_info/", GetUserData.as_view(), name="user_info"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("register/", RegisterView.as_view(), name="register"),
    path(
        "activate/<uidb64>/<token>/", ConfirmRegistrationView.as_view(), name="activate"
    ),
    path("forgot_password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path(
        "complete_forgot_password/<uidb64>/<token>/",
        CompleteForgotPasswordView.as_view(),
        name="complete_forgot_password",
    ),
]
