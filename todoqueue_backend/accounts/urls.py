from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomUserViewSet,
    AuthView,
    LogoutView,
    RegisterView,
    ConfirmRegistrationView,
)
from rest_framework_simplejwt import views as jwt_views

router = DefaultRouter()
router.register(r"accounts", CustomUserViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/", AuthView.as_view(), name="auth"),
    path("token/", jwt_views.TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", jwt_views.TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("register/", RegisterView.as_view(), name="register"),
    path(
        "activate/<uidb64>/<token>/", ConfirmRegistrationView.as_view(), name="activate"
    ),
]
