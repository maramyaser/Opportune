
from django.contrib import admin
from .models import Opportunity


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "organization",
        "opportunity_type",
        "deadline",
        "status",
        "user",
    )

    list_filter = (
        "opportunity_type",
        "status",
    )

    search_fields = (
        "title",
        "organization",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("deadline", "-created_at")
