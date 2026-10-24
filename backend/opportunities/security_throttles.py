
import hashlib

from django.core.cache import caches
from rest_framework.throttling import SimpleRateThrottle



class SharedIPThrottle(SimpleRateThrottle):
    """
    Rate-limit requests by client IP.

    On Render, the trusted edge sets the first
    X-Forwarded-For entry to the real client IP.

    Uses the shared database-backed security cache.
    """

    cache = caches["security"]

    def get_ident(self, request):
        forwarded_for = request.META.get(
            "HTTP_X_FORWARDED_FOR", ""
        )

        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()

        return request.META.get("REMOTE_ADDR", "")

    def get_cache_key(self, request, view):
        identifier = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": identifier,
        }


class LoginIPThrottle(SharedIPThrottle):
    scope = "login_ip"


class RegistrationThrottle(SharedIPThrottle):
    scope = "register_ip"


class EmailVerificationThrottle(SharedIPThrottle):
    scope = "verify_ip"


class ResendVerificationThrottle(SharedIPThrottle):
    scope = "resend_ip"


class ReminderRequestThrottle(SharedIPThrottle):
    scope = "reminder_request_ip"


class ReminderVerifyThrottle(SharedIPThrottle):
    scope = "reminder_verify_ip"


class LoginIdentifierThrottle(SimpleRateThrottle):
    """
    Rate-limit login attempts for a particular
    username/email regardless of client IP.
    """

    scope = "login_identifier"
    cache = caches["security"]

    def get_cache_key(self, request, view):
        identifier = str(
            request.data.get("username", "")
        ).strip().casefold()

        if not identifier:
            return None

        hashed_identifier = hashlib.sha256(
            identifier.encode("utf-8")
        ).hexdigest()

        return self.cache_format % {
            "scope": self.scope,
            "ident": hashed_identifier,
        }


class PasswordResetIPThrottle(SharedIPThrottle):
    scope = "password_reset_ip"


class PasswordResetConfirmThrottle(SharedIPThrottle):
    scope = "password_reset_confirm"


class PasswordResetEmailThrottle(SimpleRateThrottle):
    scope = "password_reset_email"
    cache = caches["security"]

    def get_cache_key(self, request, view):
        email = str(
            request.data.get("email", "")
        ).strip().casefold()

        if not email:
            return None

        identifier = hashlib.sha256(
            email.encode("utf-8")
        ).hexdigest()

        return self.cache_format % {
            "scope": self.scope,
            "ident": identifier,
        }
