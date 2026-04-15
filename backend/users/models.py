from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USER = "USER"
    CREATOR = "CREATOR"
    ROLE_CHOICES = (
        (USER, "User"),
        (CREATOR, "Creator"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=USER)
    bio = models.TextField(blank=True, null=True)
    avatar = models.FileField(upload_to="avatars/", blank=True, null=True)
    auth_provider = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.username
