
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import caches

from rest_framework.test import APITestCase
from .views import (
    ReminderRequestUserThrottle,
    ReminderVerifyUserThrottle,
)
from .views import RequestVerification, VerifyEmail
from opportunities.security_throttles import (
    ReminderRequestThrottle,
    ReminderVerifyThrottle,
)


class ReminderThrottleTests(APITestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="reminder_throttle_test",
            email="throttle-test@example.com",
            password="SecurePassword123!",
        )

        self.client.force_authenticate(user=self.user)

        # Reset test throttle counters.
        caches["default"].clear()
        caches["security"].clear()

    def test_both_throttle_classes_are_configured(self):
        self.assertEqual(
             RequestVerification.throttle_classes,
             [
               ReminderRequestUserThrottle,
               ReminderRequestThrottle,
             ],
        )

        self.assertEqual(
             VerifyEmail.throttle_classes,
            [
              ReminderVerifyUserThrottle,
              ReminderVerifyThrottle,
            ],
        )

    @patch("reminders.views.send_verification_code")
    def test_sixth_verification_request_is_blocked(
        self,
        mock_send,
    ):
        statuses = []

        for _ in range(6):
            response = self.client.post(
                "/api/reminders/request-verification/",
                {
                    "email": "throttle-test@example.com",
                },
                format="json",
            )

            statuses.append(response.status_code)

        # First 5 requests are accepted.
        self.assertEqual(statuses[:5], [202] * 5)

        # Sixth request is blocked.
        self.assertEqual(statuses[5], 429)

        # Only five email sends were attempted.
        self.assertEqual(mock_send.call_count, 5)



    @patch(
        "reminders.views.verify_email_code",
        side_effect=ValueError("Invalid verification code"),
    )
    def test_verification_attempt_limit(self, mock_verify):
        from .models import EmailReminderPreference

        # Set up an unverified reminder email.
        EmailReminderPreference.objects.create(
            user=self.user,
            reminder_email="throttle-test@example.com",
            email_verified=False,
            reminders_enabled=False,
        )

        statuses = []

        # Use different IPs to isolate the per-user
        # throttle from the separate IP limit.
        for attempt in range(21):
            response = self.client.post(
                "/api/reminders/verify/",
                {
                    "email": "throttle-test@example.com",
                    "code": "000000",
                },
                format="json",
                REMOTE_ADDR=f"192.0.2.{attempt + 1}",
            )

            statuses.append(response.status_code)

        # First 20 incorrect attempts reach the view.
        self.assertEqual(statuses[:20], [400] * 20)

        # Attempt 21 must be throttled.
        self.assertEqual(statuses[20], 429)

        # The verification service must only be
        # called for the first 20 attempts.
        self.assertEqual(mock_verify.call_count, 20)
