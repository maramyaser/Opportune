
import secrets
from datetime import timedelta

from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction
from django.utils import timezone

from opportunities.models import EmailVerificationCode
from opportunities.services.brevo_email import send_brevo_email


CODE_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60


def send_verification_code(user, email, purpose="account"):
    """
    Generate and email a 6-digit verification code.
    Stores only the hashed code in the database.
    """

    email = email.strip().lower()

    if purpose not in {"account", "reminder"}:
        raise ValueError("Invalid verification purpose.")

    now = timezone.now()

    recent_code = (
        EmailVerificationCode.objects.filter(
            user=user,
            email__iexact=email,
            purpose=purpose,
        )
        .order_by("-created_at")
        .first()
    )

    if recent_code and (
        now - recent_code.created_at
    ).total_seconds() < RESEND_COOLDOWN_SECONDS:
        raise ValueError(
            "Please wait 60 seconds before requesting another code."
        )

    code = f"{secrets.randbelow(1_000_000):06d}"

    verification = EmailVerificationCode.objects.create(
        user=user,
        email=email,
        purpose=purpose,
        code_hash=make_password(code),
        expires_at=now + timedelta(minutes=CODE_EXPIRY_MINUTES),
    )

    html_content = f"""
    <div style="font-family:Arial,sans-serif;
                max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#359FA0;">Opportune ✦</h2>

        <h3>Verify your email address</h3>

        <p>Use the following code to verify your email:</p>

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

        <p>This code expires in {CODE_EXPIRY_MINUTES} minutes.</p>

        <p>If you didn't request this code, you can ignore this email.</p>
    </div>
    """

    try:
        send_brevo_email(
            to_email=email,
            subject="Your Opportune verification code",
            html_content=html_content,
        )
    except Exception:
        verification.delete()
        raise

    return {
        "message": "Verification code sent successfully.",
        "expires_in": CODE_EXPIRY_MINUTES * 60,
    }


def verify_email_code(user, email, code, purpose="account"):
    """
    Verify the latest unused code for this user and email.
    """

    email = email.strip().lower()

    verification = (
        EmailVerificationCode.objects.filter(
            user=user,
            email__iexact=email,
            purpose=purpose,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if verification is None:
        raise ValueError("No active verification code found.")

    if verification.is_expired():
        raise ValueError("Verification code has expired.")

    if verification.attempts >= MAX_ATTEMPTS:
        raise ValueError("Too many incorrect attempts. Request a new code.")

    if not check_password(str(code), verification.code_hash):
        verification.attempts += 1
        verification.save(update_fields=["attempts"])
        raise ValueError("Incorrect verification code.")

    with transaction.atomic():
        verification.is_used = True
        verification.save(update_fields=["is_used"])

        if purpose == "account":
            user.is_active = True
            user.save(update_fields=["is_active"])

    return {"message": "Email verified successfully."}
