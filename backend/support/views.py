
import html
import os

import resend

from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView


class ContactMessageThrottle(AnonRateThrottle):
    rate = "5/hour"


class ContactMessageView(APIView):
    permission_classes = [AllowAny]
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

        api_key = os.getenv("RESEND_API_KEY")
        from_email = os.getenv("RESEND_FROM_EMAIL")
        receiver_email = os.getenv("CONTACT_RECEIVER_EMAIL")

        if not all([api_key, from_email, receiver_email]):
            return Response(
                {"detail": "Email delivery is not configured yet."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        safe_name = html.escape(name)
        safe_email = html.escape(email)
        safe_subject = html.escape(subject)
        safe_message = html.escape(message).replace("\n", "<br>")

        try:
            resend.api_key = api_key

            resend.Emails.send({
                "from": from_email,
                "to": [receiver_email],
                "reply_to": email,
                "subject": f"Opportune Support: {subject}",
                "html": f"""
                    <h2>New Opportune support message</h2>
                    <p><strong>Name:</strong> {safe_name}</p>
                    <p><strong>Email:</strong> {safe_email}</p>
                    <p><strong>Subject:</strong> {safe_subject}</p>
                    <p><strong>Message:</strong><br>{safe_message}</p>
                """,
                "text": (
                    f"Name: {name}\n"
                    f"Email: {email}\n"
                    f"Subject: {subject}\n\n"
                    f"Message:\n{message}"
                ),
            })

        except Exception:
            # Log the actual error privately in server logs if needed.
            return Response(
                {"detail": "We couldn't send your message. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"detail": "Your message has been sent successfully."},
            status=status.HTTP_200_OK,
        )
