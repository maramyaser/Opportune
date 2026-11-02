
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import PrivacyPolicyAcceptance


User = get_user_model()


class PrivacyRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auth/register/"
        self.payload = {
            "username": "privacy_test_user",
            "email": "privacy-test@example.com",
            "password": "SecureTestPass2026!",
        }

    def test_registration_without_acceptance_is_rejected(self):
        response = self.client.post(
            self.url,
            self.payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            User.objects.filter(
                username="privacy_test_user"
            ).exists()
        )

    def test_registration_with_false_acceptance_is_rejected(self):
        response = self.client.post(
            self.url,
            {
                **self.payload,
                "privacy_policy_accepted": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            User.objects.filter(
                username="privacy_test_user"
            ).exists()
        )

    @patch("opportunities.auth_serializers.send_verification_code")
    def test_registration_with_acceptance_is_recorded(
        self,
        mock_send_email,
    ):
        response = self.client.post(
            self.url,
            {
                **self.payload,
                "privacy_policy_accepted": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        user = User.objects.get(
            username="privacy_test_user"
        )

        self.assertFalse(user.is_active)

        acceptance = PrivacyPolicyAcceptance.objects.get(
            user=user
        )

        self.assertEqual(
            acceptance.policy_version,
            "2026-11-02",
        )
        self.assertIsNotNone(acceptance.accepted_at)

        mock_send_email.assert_called_once()
