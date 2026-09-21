from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User, UserLink


class UserAdmin(DjangoUserAdmin):
    list_display = ("id", "email", "role", "is_verified", "is_suspended")
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Launchpad",
            {
                "fields": (
                    "role",
                    "google_id",
                    "avatar",
                    "is_verified",
                    "verify_token",
                    "is_suspended",
                    "bio",
                )
            },
        ),
    )


admin.site.register(User, UserAdmin)


@admin.register(UserLink)
class UserLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "label", "url")
