
from django.utils import timezone
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle

from opportunities.models import EmailVerificationCode
from opportunities.services.email_verification import (
    send_verification_code,
    verify_email_code,
)

from .models import EmailReminderPreference
from opportunities.security_throttles import (
    ReminderRequestThrottle,
    ReminderVerifyThrottle,
)


DEFAULT_DAYS = [7, 3, 1]
ALLOWED_DAYS = {1, 3, 7}



class ReminderRequestUserThrottle(UserRateThrottle):
    scope = "reminder_request_user"
    rate = "5/hour"


class ReminderVerifyUserThrottle(UserRateThrottle):
    scope = "reminder_verify_user"
    rate = "20/hour"


def email_of(user):
    return (getattr(user, "email", "") or "").strip().lower()


def get_preference(user):
    pref, _ = EmailReminderPreference.objects.get_or_create(
        user=user,
        defaults={"reminder_days": DEFAULT_DAYS},
    )
    return pref


def account_email_is_verified(user):
    """
    Check for successful registration email verification.
    Don't assume older active accounts were email-verified.
    """
    email = email_of(user)

    return bool(
        email
        and user.is_active
        and EmailVerificationCode.objects.filter(
            user=user,
            email__iexact=email,
            purpose="account",
            is_used=True,
        ).exists()
    )


def payload(pref, user):
    return {
        "account_email": email_of(user),
        "account_email_verified": account_email_is_verified(user),
        "reminder_email": pref.reminder_email,
        "email_verified": pref.email_verified,
        "reminders_enabled": pref.reminders_enabled,
        "reminder_days": (
            pref.reminder_days
            if pref.reminder_days is not None
            else DEFAULT_DAYS
        ),
    }


class Preferences(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref = get_preference(request.user)
        return Response(payload(pref, request.user))

    def patch(self, request):
        pref = get_preference(request.user)

        days = request.data.get(
            "reminder_days",
            pref.reminder_days,
        )
        enabled = request.data.get(
            "reminders_enabled",
            pref.reminders_enabled,
        )

        if (
            not isinstance(days, list)
            or any(
                type(day) is not int or day not in ALLOWED_DAYS
                for day in days
            )
        ):
            return Response(
                {
                    "detail": (
                        "reminder_days must be a list "
                        "containing only 1, 3, and/or 7."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(enabled, bool):
            return Response(
                {
                    "detail": (
                        "reminders_enabled must be "
                        "true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if enabled and (
            not pref.email_verified
            or not pref.reminder_email
        ):
            return Response(
                {
                    "detail": (
                        "Verify your selected reminder email "
                        "before enabling reminders."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pref.reminder_days = sorted(set(days), reverse=True)
        pref.reminders_enabled = enabled

        pref.save(
            update_fields=[
                "reminder_days",
                "reminders_enabled",
                "updated_at",
            ]
        )

        return Response(payload(pref, request.user))


class RequestVerification(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [
        ReminderRequestUserThrottle,
        ReminderRequestThrottle,
    ]

    def post(self, request):
        pref = get_preference(request.user)

        serializer = serializers.Serializer(
            data=request.data
        )
        # Read and validate the requested email.
        email_serializer = ReminderEmailSerializer(
            data=request.data
        )
        email_serializer.is_valid(raise_exception=True)

        selected_email = email_serializer.validated_data[
            "email"
        ].strip().lower()

        account_email = email_of(request.user)

        # The original account email may already
        # have been verified at registration.
        if (
            selected_email == account_email
            and account_email_is_verified(request.user)
        ):
            pref.reminder_email = selected_email
            pref.email_verified = True
            pref.reminders_enabled = False
            pref.verified_at = timezone.now()

            pref.verification_token_hash = ""
            pref.verification_expires_at = None

            pref.save()

            return Response({
                "detail": (
                    "Your verified account email "
                    "is now linked for reminders."
                ),
                "requires_code": False,
                **payload(pref, request.user),
            })

        # A new destination must be verified,
        # even if the previous email was verified.
        if selected_email != pref.reminder_email:
            pref.reminder_email = selected_email
            pref.email_verified = False
            pref.reminders_enabled = False
            pref.verified_at = None
            pref.verification_token_hash = ""
            pref.verification_expires_at = None
            pref.save()

        elif pref.email_verified:
            return Response({
                "detail": "This email is already verified.",
                "requires_code": False,
                **payload(pref, request.user),
            })

        # Request a 6-digit code through Brevo.
        # This uses the reusable service in opportunities.
        try:
            send_verification_code(
                user=request.user,
                email=selected_email,
                purpose="reminder",
            )

        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:
            return Response(
                {
                    "detail": (
                        "Could not send the verification email. "
                        "Please try again later."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "detail": (
                    "We sent a six-digit verification code "
                    "to your selected email."
                ),
                "requires_code": True,
                **payload(pref, request.user),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class ReminderEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ReminderCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(regex=r"^\d{6}$")

class VerifyEmail(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [
        ReminderVerifyUserThrottle,
        ReminderVerifyThrottle,
    ]
    def post(self, request):
        serializer = ReminderCodeSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        selected_email = serializer.validated_data[
            "email"
        ].strip().lower()

        code = serializer.validated_data["code"]

        pref = get_preference(request.user)

        # Never verify an address other than the
        # one currently selected for reminders.
        if (
            not pref.reminder_email
            or pref.reminder_email.lower() != selected_email
        ):
            return Response(
                {
                    "detail": (
                        "This email is not your currently "
                        "selected reminder address."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pref.email_verified:
            return Response(
                {"detail": "This email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verify_email_code(
                user=request.user,
                email=selected_email,
                code=code,
                purpose="reminder",
            )

        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pref.email_verified = True
        pref.verified_at = timezone.now()

        # Verification doesn't automatically opt
        # the user in to reminder emails.
        pref.reminders_enabled = False

        pref.verification_token_hash = ""
        pref.verification_expires_at = None

        pref.save()

        return Response({
            "detail": (
                "Email verified! You can now "
                "enable deadline reminders."
            ),
            **payload(pref, request.user),
        })


class Disconnect(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pref = get_preference(request.user)

        pref.reminder_email = ""
        pref.email_verified = False
        pref.reminders_enabled = False
        pref.verified_at = None
        pref.verification_token_hash = ""
        pref.verification_expires_at = None

        pref.save()

        return Response({
            "detail": "Email reminders disconnected.",
            **payload(pref, request.user),
        })
