from django.conf import settings
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "bio",
            "avatar",
            "avatar_url",
            "auth_provider",
        )

    read_only_fields = ("id", "username", "email", "role", "auth_provider")

    def get_avatar(self, obj):
        return self._get_public_avatar_url(obj)

    def get_avatar_url(self, obj):
        return self._get_public_avatar_url(obj)

    def _get_public_avatar_url(self, obj):
        avatar = getattr(obj, "avatar", None)
        if not avatar or not getattr(avatar, "name", None):
            return None
        return f"{settings.MEDIA_URL.rstrip('/')}/{avatar.name.lstrip('/')}"


class GithubAuthSerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("code must be provided")
        return value
