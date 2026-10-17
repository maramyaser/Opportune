
from django.urls import path

from .views import (
    Preferences,
    RequestVerification,
    VerifyEmail,
    Disconnect,
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
]
