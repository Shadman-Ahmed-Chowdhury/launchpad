from django.contrib import admin

from .models import AuditLog, CommentReport, ProductReport


@admin.register(ProductReport)
class ProductReportAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "reporter", "status", "created_at")
    list_filter = ("status",)


@admin.register(CommentReport)
class CommentReportAdmin(admin.ModelAdmin):
    list_display = ("id", "comment", "reporter", "status", "created_at")
    list_filter = ("status",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "actor", "action", "target_type", "target_id", "created_at")
    list_filter = ("action", "target_type")
