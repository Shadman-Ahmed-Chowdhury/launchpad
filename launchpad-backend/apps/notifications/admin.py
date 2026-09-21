from django.contrib import admin

from .models import Notification, NotificationPreference


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "notification_type", "is_enabled")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "is_read", "created_at")
    list_filter = ("is_read", "type")
