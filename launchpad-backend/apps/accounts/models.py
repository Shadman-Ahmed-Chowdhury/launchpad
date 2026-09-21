from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        MEMBER = "member", "Member"
        REVIEWER = "reviewer", "Reviewer"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    avatar = models.CharField(max_length=255, blank=True)  # S3 key
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    is_verified = models.BooleanField(default=False)
    verify_token = models.CharField(max_length=255, null=True, blank=True)
    is_suspended = models.BooleanField(default=False)
    bio = models.CharField(max_length=255, blank=True)  # one line, public profile

    def __str__(self):
        return self.email


class UserLink(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="links")
    label = models.CharField(max_length=100)  # e.g. "Twitter", "Website"
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id}:{self.label}"
