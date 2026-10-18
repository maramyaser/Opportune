
from django.urls import path

from .views import (
    Preferences,
    RequestVerification,
    VerifyEmail,
    Disconnect,
)

from .cron_views import (
    ReminderHealthView,
    RunScheduledRemindersView,
)

urlpatterns = [
    path(
        "preferences/",
        Preferences.as_view(),
        name="reminder-preferences",
    ),
    path(
        "request-verification/",
        RequestVerification.as_view(),
        name="reminder-request-verification",
    ),
    path(
        "verify/",
        VerifyEmail.as_view(),
        name="reminder-verify",
    ),
    path(
        "disconnect/",
        Disconnect.as_view(),
        name="reminder-disconnect",
    ),

    # Cloud scheduling
    path(
        "health/",
        ReminderHealthView.as_view(),
        name="reminder-health",
    ),
    path(
        "run-scheduled/",
        RunScheduledRemindersView.as_view(),
        name="run-scheduled-reminders",
    ),
]
