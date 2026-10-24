
import html

from django.core.mail.backends.base import BaseEmailBackend

from opportunities.services.brevo_email import send_brevo_email


class BrevoEmailBackend(BaseEmailBackend):
    """
    Send Django emails through Opportune's existing
    Brevo transactional email API.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        sent_count = 0

        for message in email_messages:
            try:
                if message.attachments:
                    raise NotImplementedError(
                        "Email attachments are not supported "
                        "by this Brevo adapter."
                    )

                # Convert plain text into safe HTML.
                html_content = (
                    '<div style="white-space:pre-wrap">'
                    + html.escape(message.body)
                    + '</div>'
                )

                # Use HTML content if supplied.
                for alternative in message.alternatives:
                    if alternative.mimetype == "text/html":
                        html_content = alternative.content
                        break

                for recipient in message.recipients():
                    send_brevo_email(
                        to_email=recipient,
                        subject=message.subject,
                        html_content=html_content,
                    )
                    sent_count += 1

            except Exception:
                if not self.fail_silently:
                    raise

        return sent_count
