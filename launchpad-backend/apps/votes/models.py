from django.conf import settings
from django.db import models

from apps.products.models import Product


class Vote(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "user")

    def __str__(self):
        return f"{self.product_id}:{self.user_id}"
