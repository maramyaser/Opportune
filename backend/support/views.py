
import logging
import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage
from django.core.validators import validate_email

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView


logger = logging.getLogger(__name__)


class ContactMessageThrottle(AnonRateThrottle):
    rate = "5/hour"


class ContactMessageView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ContactMessageThrottle]

    def post(self, request):
        name = str(request.data.get("name", "")).strip()
        email = str(request.data.get("email", "")).strip()
        subject = str(request.data.get("subject", "")).strip()
        message = str(request.data.get("message", "")).strip()

        if not all([name, email, subject, message]):
            return Response(
                {"detail": "Please complete all fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            len(name) > 100
            or len(email) > 254
            or len(subject) > 150
            or len(message) > 5000
        ):
            return Response(
                {"detail": "One or more fields are too long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"detail": "Please enter a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receiver_email = os.getenv(
            "CONTACT_RECEIVER_EMAIL", ""
        ).strip()

        if not receiver_email:
            return Response(
                {"detail": "Support email is not configured yet."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            validate_email(receiver_email)
        except ValidationError:
            logger.error("Invalid support recipient configuration")
            return Response(
                {"detail": "Support email is not configured correctly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        email_body = (
            "New Opportune support message\n\n"
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message}"
        )

        try:
            support_email = EmailMessage(
                subject=f"Opportune Support: {subject}",
                body=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[receiver_email],
                reply_to=[email],
            )

            sent_count = support_email.send(
                fail_silently=False
            )

            if sent_count != 1:
                raise RuntimeError(
                    "Support email was not accepted by the email backend."
                )

        except Exception:
            logger.exception("Support email delivery failed")

            return Response(
                {
                    "detail": (
                        "We couldn't send your message. "
                        "Please try again later."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"detail": "Your message has been sent successfully."},
            status=status.HTTP_200_OK,
        )
