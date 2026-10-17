
import requests
from django.conf import settings


def send_brevo_email(to_email, subject, html_content):
    api_key = settings.BREVO_API_KEY

    if not api_key:
        raise ValueError("BREVO_API_KEY is missing")

    payload = {
        "sender": {
            "name": "Opportune",
            "email": settings.DEFAULT_FROM_EMAIL,
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content,
    }

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "accept": "application/json",
        },
        json=payload,
        timeout=30,
    )

    response.raise_for_status()
    return response.json()
