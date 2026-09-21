from django.conf import settings
from django.db import models

from apps.topics.models import Topic


class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_REVIEW = "pending_review", "Pending review"
        CHANGES_REQUESTED = "changes_requested", "Changes requested"
        REJECTED = "rejected", "Rejected"
        APPROVED = "approved", "Approved"
        SCHEDULED = "scheduled", "Scheduled"
        LAUNCHED = "launched", "Launched"
        TAKEN_DOWN = "taken_down", "Taken down"

    founder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    tagline = models.CharField(max_length=255)
    description = models.TextField()
    logo = models.CharField(max_length=255, blank=True)  # S3 key
    website_url = models.URLField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    launch_date = models.DateField(null=True, blank=True)
    launched_at = models.DateTimeField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProductTopic(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="product_topics")
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="topic_products")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "topic")

    def __str__(self):
        return f"{self.product_id}:{self.topic_id}"


class ProductScreenshot(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="screenshots")
    image = models.CharField(max_length=255)  # S3 key
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"{self.product_id}:{self.position}"


class ProductReview(models.Model):
    class Action(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CHANGES_REQUESTED = "changes_requested", "Changes requested"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="product_reviews"
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    notes = models.TextField(blank=True)  # shown to founder
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product_id}:{self.action}"


class ProductDailyRanking(models.Model):
    class PeriodType(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        ALL_TIME = "all_time", "All time"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="rankings")
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE, related_name="rankings", null=True, blank=True
    )
    period_type = models.CharField(max_length=20, choices=PeriodType.choices)
    period_key = models.CharField(max_length=20)  # e.g. '2026-09-21', '2026-W38', '2026-09'
    rank = models.PositiveIntegerField()
    score = models.DecimalField(max_digits=10, decimal_places=4)
    votes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)  # frozen once the period ends

    class Meta:
        unique_together = ("product", "period_type", "period_key", "topic")

    def __str__(self):
        return f"{self.product_id}:{self.period_type}:{self.period_key}"
