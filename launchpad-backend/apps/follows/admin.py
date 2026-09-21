from django.contrib import admin

from .models import TopicFollow, UserFollow


@admin.register(UserFollow)
class UserFollowAdmin(admin.ModelAdmin):
    list_display = ("id", "follower", "followee", "created_at")


@admin.register(TopicFollow)
class TopicFollowAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "topic", "created_at")
