
import hashlib

from django.core.cache import caches
from rest_framework.throttling import SimpleRateThrottle


class SharedIPThrottle(SimpleRateThrottle):
    """
    Rate-limit requests by client IP.

    Uses a database-backed shared cache.
    """

    cache = caches["security"]

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
