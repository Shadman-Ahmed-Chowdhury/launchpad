from django.conf import settings
from django.db import models

from apps.topics.models import Topic


class UserFollow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following"
    )
    followee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "followee")

    def __str__(self):
        return f"{self.follower_id}->{self.followee_id}"


class TopicFollow(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="topic_follows"
    )
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "topic")

    def __str__(self):
        return f"{self.user_id}->{self.topic_id}"
