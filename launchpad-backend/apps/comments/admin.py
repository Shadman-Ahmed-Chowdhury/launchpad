from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "user", "is_removed", "created_at")
    list_filter = ("is_removed",)
