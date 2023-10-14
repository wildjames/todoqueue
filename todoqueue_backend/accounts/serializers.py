from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from logging import getLogger

logger = getLogger(__name__)


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = (
            "id",
            "email",
            "username",
            "date_joined",
            "brownie_point_credit",
            "brownie_point_debit",
        )


class CustomUserWithBrowniePointsSerializer(CustomUserSerializer):
    rolling_brownie_points = serializers.IntegerField(read_only=True, default=0)

    class Meta(CustomUserSerializer.Meta):
        fields = CustomUserSerializer.Meta.fields + ("rolling_brownie_points",)


class CustomUserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=get_user_model().objects.all())]
    )
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=get_user_model().objects.all())]
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ("email", "username", "password")

    def create(self, validated_data):
        logger.info(f"Creating user with email: {validated_data['email']}")
        user = get_user_model().objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return user


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError(
                {"confirm_new_password": "Passwords do not match"}
            )
        return data
