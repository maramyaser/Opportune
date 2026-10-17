import hashlib, os, secrets
from datetime import timedelta
from urllib.parse import urlencode
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import EmailReminderPreference
from .resend import send_email

DEFAULT_DAYS = [7, 3, 1]
def email_of(user): return (getattr(user, "email", "") or "").strip()
def payload(pref, user):
    return {"email": email_of(user), "email_verified": pref.email_verified, "reminders_enabled": pref.reminders_enabled, "reminder_days": pref.reminder_days or DEFAULT_DAYS}

class Preferences(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        pref, _ = EmailReminderPreference.objects.get_or_create(user=request.user, defaults={"reminder_days": DEFAULT_DAYS})
        return Response(payload(pref, request.user))
    def patch(self, request):
        pref, _ = EmailReminderPreference.objects.get_or_create(user=request.user, defaults={"reminder_days": DEFAULT_DAYS})
        days = request.data.get("reminder_days", pref.reminder_days or DEFAULT_DAYS)
        enabled = request.data.get("reminders_enabled", pref.reminders_enabled)
        if not isinstance(days, list) or not set(days).issubset({1,3,7}):
            return Response({"detail":"reminder_days must contain only 1, 3, and/or 7."}, status=400)
        if not isinstance(enabled, bool):
            return Response({"detail":"reminders_enabled must be true or false."}, status=400)
        if enabled and not pref.email_verified:
            return Response({"detail":"Verify your account email before enabling reminders."}, status=400)
        pref.reminder_days, pref.reminders_enabled = sorted(set(days), reverse=True), enabled
        pref.save()
        return Response(payload(pref, request.user))

class RequestVerification(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        email = email_of(request.user)
        if not email: return Response({"detail":"Your account has no email address."}, status=400)
        pref, _ = EmailReminderPreference.objects.get_or_create(user=request.user, defaults={"reminder_days": DEFAULT_DAYS})
        if pref.email_verified: return Response({"detail":"Email already verified.", **payload(pref, request.user)})
        base = os.environ.get("BACKEND_PUBLIC_URL", getattr(settings, "BACKEND_PUBLIC_URL", "")).rstrip("/")
        if not base: return Response({"detail":"Configure BACKEND_PUBLIC_URL."}, status=503)
        token = secrets.token_urlsafe(32)
        pref.verification_token_hash = hashlib.sha256(token.encode()).hexdigest()
        pref.verification_expires_at = timezone.now() + timedelta(hours=24)
        pref.save()
        url = f"{base}/api/reminders/verify/?{urlencode({'token':token})}"
        try:
            send_email(email, "Verify your email for Opportune reminders", f'<h2>Stay on track ✨</h2><p>Confirm your email to receive deadline reminders.</p><p><a href="{url}">Verify my email</a></p><p>This link expires in 24 hours.</p>')
        except RuntimeError as exc:
            return Response({"detail":str(exc)}, status=502)
        return Response({"detail":f"Verification link sent to {email}."}, status=202)

class VerifyEmail(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        token = request.query_params.get("token", "")
        pref = EmailReminderPreference.objects.filter(verification_token_hash=hashlib.sha256(token.encode()).hexdigest(), verification_expires_at__gt=timezone.now()).first() if token else None
        if not pref: return Response({"detail":"Invalid or expired link. Request another verification email."}, status=400)
        pref.email_verified, pref.verified_at, pref.verification_token_hash, pref.verification_expires_at = True, timezone.now(), "", None
        pref.save()
        return HttpResponse("<main style='font:16px Arial;max-width:520px;margin:12vh auto;color:#245d5d'><h1>Email verified! ✨</h1><p>Return to Opportune and enable deadline reminders.</p></main>")

class Disconnect(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        pref, _ = EmailReminderPreference.objects.get_or_create(user=request.user, defaults={"reminder_days":DEFAULT_DAYS})
        pref.reminders_enabled, pref.email_verified = False, False
        pref.verification_token_hash, pref.verification_expires_at = "", None
        pref.save()
        return Response({"detail":"Email reminders disconnected.", **payload(pref, request.user)})
