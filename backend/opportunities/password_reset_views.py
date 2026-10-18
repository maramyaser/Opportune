
import html
import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from opportunities.services.brevo_email import send_brevo_email
from opportunities.security_throttles import (
    PasswordResetIPThrottle,
    PasswordResetEmailThrottle,
    PasswordResetConfirmThrottle,
)


logger = logging.getLogger(__name__)
User = get_user_model()

GENERIC_MESSAGE = (
    "If an eligible account exists with that email, "
    "we'll send a password reset link."
)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=150)
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [
        PasswordResetIPThrottle,
        PasswordResetEmailThrottle,
    ]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data[
            "email"
        ].strip().lower()

        # Avoid ambiguous accounts with duplicate emails.
        matches = list(
            User.objects.filter(
                email__iexact=email,
                is_active=True,
            )[:2]
        )

        if len(matches) == 1:
            user = matches[0]

            if user.has_usable_password():
                uid = urlsafe_base64_encode(
                    force_bytes(user.pk)
                )

                token = default_token_generator.make_token(
                    user
                )

                # URL fragment keeps the token out of
                # ordinary HTTP request paths and logs.
                params = urlencode({
                    "uid": uid,
                    "token": token,
                })

                reset_url = (
                    f"{settings.FRONTEND_URL}"
                    f"/reset-password#{params}"
                )

                safe_url = html.escape(
                    reset_url,
                    quote=True,
                )

                html_content = f"""
                <div style="
                    font-family:Arial,sans-serif;
                    max-width:500px;
                    margin:auto;
                    padding:24px;
                ">
                    <h2 style="color:#359FA0;">
                        Opportune ✦
                    </h2>

                    <h3>Reset your password</h3>

                    <p>
                        We received a request to reset
                        your Opportune password.
                    </p>

                    <p>
                        Click the button below to choose
                        a new password.
                    </p>

                    <p style="margin:28px 0;">
                        <a href="{safe_url}" style="
                            background:#359FA0;
                            color:white;
                            padding:14px 22px;
                            border-radius:10px;
                            text-decoration:none;
                            font-weight:bold;
                        ">
                            Reset my password
                        </a>
                    </p>

                    <p>
                        This link expires in 30 minutes.
                    </p>

                    <p>
                        If you didn't request this,
                        you can ignore this email.
                    </p>
                </div>
                """

                try:
                    send_brevo_email(
                        to_email=user.email,
                        subject="Reset your Opportune password",
                        html_content=html_content,
                    )
                except Exception:
                    # Log the error without exposing
                    # account existence to the requester.
                    logger.exception(
                        "Password reset email delivery failed."
                    )

        return Response(
            {"detail": GENERIC_MESSAGE},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PasswordResetConfirmThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data[
            "new_password"
        ]

        invalid_message = (
            "Invalid or expired password reset link."
        )

        try:
            user_id = urlsafe_base64_decode(uid).decode()
        except (TypeError, ValueError, UnicodeDecodeError):
            return Response(
                {"detail": invalid_message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = (
                    User.objects
                    .select_for_update()
                    .get(pk=user_id, is_active=True)
                )

                if (
                    not user.has_usable_password()
                    or not default_token_generator.check_token(
                        user, token
                    )
                ):
                    return Response(
                        {"detail": invalid_message},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                try:
                    validate_password(
                        new_password,
                        user=user,
                    )
                except DjangoValidationError as exc:
                    return Response(
                        {"new_password": exc.messages},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                user.set_password(new_password)
                user.save(update_fields=["password"])

        except (User.DoesNotExist, ValueError, OverflowError):
            return Response(
                {"detail": invalid_message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Password reset successfully. "
                    "You can now sign in."
                )
            },
            status=status.HTTP_200_OK,
        )
