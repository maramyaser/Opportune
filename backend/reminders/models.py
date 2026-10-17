from django.conf import settings
from django.db import models
from django.utils import timezone

class EmailReminderPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_reminder_preference")
    email_verified = models.BooleanField(default=False)
    reminders_enabled = models.BooleanField(default=False)
    reminder_days = models.JSONField(default=list)
    verification_token_hash = models.CharField(max_length=64, blank=True)
    verification_expires_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

class ReminderDelivery(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    opportunity_id = models.PositiveBigIntegerField()
    days_before = models.PositiveSmallIntegerField()
    deadline_date = models.DateField()
    sent_at = models.DateTimeField(default=timezone.now)
    resend_email_id = models.CharField(max_length=255, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user","opportunity_id","days_before","deadline_date"], name="unique_opportunity_reminder_delivery")]
