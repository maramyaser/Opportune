
from django.conf import settings
from django.db import models


class Note(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="personal_notes",
    )

    title = models.CharField(
        max_length=200,
        blank=True,
    )

    content = models.TextField(
        blank=True,
    )

    link = models.URLField(
        max_length=2000,
        blank=True,
    )

    # Optional email reminder
    reminder_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Prevent sending the same reminder repeatedly
    reminder_sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "updated_at"]),
            models.Index(fields=["reminder_at"]),
        ]

    def __str__(self):
        return self.title or f"Note #{self.pk}"
