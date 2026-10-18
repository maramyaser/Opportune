
import re
import secrets

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import (
    make_password,
    check_password,
)
from django.db import transaction
from django.utils import timezone

from opportunities.models import EmailVerificationCode
from opportunities.services.brevo_email import send_brevo_email


CODE_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60
MAX_CODES_PER_HOUR = 5

VALID_PURPOSES = {"account", "reminder"}


def normalize_email(email):
    return str(email).strip().lower()


def send_verification_code(user, email, purpose="account"):
    """
    Generate and send a secure six-digit verification code.

    - Stores only a password hash.
    - Limits repeated email requests.
    - Invalidates older codes.
    - Uses a database lock to serialize requests.
    """

    if purpose not in VALID_PURPOSES:
        raise ValueError("Invalid verification purpose.")

    email = normalize_email(email)

    if not email:
        raise ValueError("An email address is required.")

    User = get_user_model()

    with transaction.atomic():

        # Lock the user row. This serializes code requests
        # for the same user on PostgreSQL.
        locked_user = User.objects.select_for_update().get(
            pk=user.pk
        )

        if purpose == "account":
            account_email = normalize_email(
                locked_user.email
            )

            if email != account_email:
                raise ValueError(
                    "The email does not match your account."
                )

        now = timezone.now()

        codes = EmailVerificationCode.objects.filter(
            user=locked_user,
            email__iexact=email,
            purpose=purpose,
        )

        latest = codes.order_by(
            "-created_at",
            "-pk",
        ).first()

        # Prevent repeatedly requesting codes.
        if latest:
            seconds_since_last = (
                now - latest.created_at
            ).total_seconds()

            if seconds_since_last < RESEND_COOLDOWN_SECONDS:
                raise ValueError(
                    "Please wait 60 seconds before "
                    "requesting another code."
                )

        # Limit the number of emails per hour.
        hour_ago = now - timedelta(hours=1)

        recent_count = codes.filter(
            created_at__gte=hour_ago
        ).count()

        if recent_count >= MAX_CODES_PER_HOUR:
            raise ValueError(
                "Too many verification requests. "
                "Please try again later."
            )

        code = f"{secrets.randbelow(1_000_000):06d}"

        # Invalidate all older codes for this email
        # and verification purpose.
        codes.filter(
            is_used=False
        ).update(is_used=True)

        verification = EmailVerificationCode.objects.create(
            user=locked_user,
            email=email,
            purpose=purpose,
            code_hash=make_password(code),
            expires_at=now + timedelta(
                minutes=CODE_EXPIRY_MINUTES
            ),
        )

        html_content = f"""
        <div style="
            font-family:Arial,sans-serif;
            max-width:480px;
            margin:auto;
            padding:24px;
        ">
            <h2 style="color:#359FA0;">
                Opportune ✦
            </h2>

            <h3>Verify your email address</h3>

            <p>
                Enter this code to verify your email:
            </p>

            <div style="
                background:#FFF0C5;
                padding:20px;
                border-radius:12px;
                text-align:center;
                font-size:32px;
                font-weight:bold;
                letter-spacing:8px;
            ">
                {code}
            </div>

            <p>
                This code expires in
                {CODE_EXPIRY_MINUTES} minutes.
            </p>

            <p>
                If you didn't request this code,
                you can safely ignore this email.
            </p>
        </div>
        """

        # If Brevo rejects the request, the transaction
        # rolls back, preserving the previous code state.
        send_brevo_email(
            to_email=email,
            subject="Your Opportune verification code",
            html_content=html_content,
        )

    return {
        "message": "Verification code sent successfully.",
        "expires_in": CODE_EXPIRY_MINUTES * 60,
    }


def verify_email_code(
    user,
    email,
    code,
    purpose="account",
):
    """
    Verify only the newest code for the selected
    email and purpose.
    """

    if purpose not in VALID_PURPOSES:
        raise ValueError("Invalid verification purpose.")

    email = normalize_email(email)
    code = str(code).strip()

    if not re.fullmatch(r"[0-9]{6}", code):
        raise ValueError(
            "Please enter a valid six-digit code."
        )

    User = get_user_model()

    with transaction.atomic():

        locked_user = User.objects.select_for_update().get(
            pk=user.pk
        )

        if purpose == "account":
            if email != normalize_email(
                locked_user.email
            ):
                raise ValueError(
                    "The verification email does "
                    "not match your account."
                )

        # Always fetch the newest record, including
        # used records, to prevent old-code fallback.
        verification = (
            EmailVerificationCode.objects.filter(
                user=locked_user,
                email__iexact=email,
                purpose=purpose,
            )
            .order_by("-created_at", "-pk")
            .first()
        )

        if verification is None:
            raise ValueError(
                "No verification code found. "
                "Please request a new one."
            )

        if verification.is_used:
            raise ValueError(
                "This code is no longer valid. "
                "Please request a new one."
            )

        if verification.is_expired():
            raise ValueError(
                "Verification code has expired."
            )

        if verification.attempts >= MAX_ATTEMPTS:
            raise ValueError(
                "Too many incorrect attempts. "
                "Please request a new code."
            )

        if not check_password(
            code,
            verification.code_hash,
        ):
            verification.attempts += 1

            fields = ["attempts"]

            # Permanently invalidate a code after
            # five incorrect guesses.
            if verification.attempts >= MAX_ATTEMPTS:
                verification.is_used = True
                fields.append("is_used")

            verification.save(update_fields=fields)

            raise ValueError(
                "Incorrect verification code."
            )

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        if purpose == "account":
            locked_user.is_active = True
            locked_user.save(update_fields=["is_active"])

            user.is_active = True

    return {
        "message": "Email verified successfully."
    }
