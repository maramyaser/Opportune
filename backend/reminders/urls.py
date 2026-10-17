from django.urls import path
from .views import Preferences, RequestVerification, VerifyEmail, Disconnect
urlpatterns = [
    path("preferences/", Preferences.as_view()),
    path("request-verification/", RequestVerification.as_view()),
    path("verify/", VerifyEmail.as_view()),
    path("disconnect/", Disconnect.as_view()),
]
