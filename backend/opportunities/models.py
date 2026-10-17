
from django.conf import settings
from django.db import models


class Opportunity(models.Model):

    class OpportunityType(models.TextChoices):
        INTERNSHIP = "internship", "Internship"
        SCHOLARSHIP = "scholarship", "Scholarship"
        JOB = "job", "Job"
        GRANT = "grant", "Grant"
        FELLOWSHIP = "fellowship", "Fellowship"
        COMPETITION = "competition", "Competition"
        VOLUNTEERING = "volunteering", "Volunteering"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        SAVED = "saved", "Saved"
        PLANNING = "planning", "Planning to Apply"
        IN_PROGRESS = "in_progress", "In Progress"
        SUBMITTED = "submitted", "Submitted"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="opportunities",
    )

    title = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, blank=True)

    opportunity_type = models.CharField(
        max_length=20,
        choices=OpportunityType.choices,
        default=OpportunityType.OTHER,
    )

    source_url = models.URLField(max_length=2048, blank=True)
    application_url = models.URLField(max_length=2048, blank=True)

    description = models.TextField(blank=True)
    eligibility = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    benefits = models.TextField(blank=True)

    # Store a list of documents, e.g. ["CV", "Motivation letter"].
    required_documents = models.JSONField(default=list, blank=True)

    # Null means the deadline is unknown; do not invent one.
    deadline = models.DateTimeField(null=True, blank=True)

    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SAVED,
    )

    # Whether the user has marked this opportunity as a favorite.
    is_favorite = models.BooleanField(default=False)

    notes = models.TextField(blank=True)

    # Confidence and warnings help users review AI extraction results.
    extraction_confidence = models.FloatField(null=True, blank=True)
    extraction_warnings = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["deadline", "-created_at"]
        indexes = [
            models.Index(fields=["user", "deadline"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.user}"


from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class EmailVerificationCode(models.Model):
    PURPOSE_CHOICES = [
        ("account", "Account Verification"),
        ("reminder", "Reminder Email Verification"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_codes",
    )

    email = models.EmailField()

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default="account",
    )

    code_hash = models.CharField(max_length=128)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)

    attempts = models.PositiveSmallIntegerField(
        default=0
    )

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"{self.email} - {self.purpose}"



""" user ensures every opportunity belongs to its owner.



deadline accepts NULL for opportunities whose deadlines have not been identified.



required_documents stores a list of documents without requiring another database table.



extraction_warnings lets the AI service flag missing or ambiguous information.



status tracks progress from saving an opportunity to submitting an application.



Indexes help with common dashboard queries. """