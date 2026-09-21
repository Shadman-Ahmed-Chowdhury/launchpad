from django.contrib import admin

from .models import Product, ProductDailyRanking, ProductReview, ProductScreenshot, ProductTopic


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "founder", "status", "launch_date")
    list_filter = ("status",)


@admin.register(ProductTopic)
class ProductTopicAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "topic")


@admin.register(ProductScreenshot)
class ProductScreenshotAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "position")


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "reviewer", "action", "created_at")


@admin.register(ProductDailyRanking)
class ProductDailyRankingAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "period_type", "period_key", "rank")
    list_filter = ("period_type",)
