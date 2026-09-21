from django.conf import settings
from django.db import models


class NotificationPreference(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    notification_type = models.CharField(max_length=50)  # e.g. product_approved, new_comment
    is_enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "notification_type")

    def __str__(self):
        return f"{self.user_id}:{self.notification_type}"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=50)  # matches NotificationPreference.notification_type
    data = models.JSONField(default=dict, blank=True)  # e.g. product_id, comment_id
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id}:{self.type}"
