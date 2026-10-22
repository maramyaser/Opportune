
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class TokenRotationSecurityTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        User = get_user_model()

        self.user = User.objects.create_user(
            username="rotation_test_user",
            email="rotation-test@example.com",
            password="StrongTestPassword!857",
        )

    def test_rotation_and_logout(self):
        # Create an initial refresh token.
        original_refresh = str(
            RefreshToken.for_user(self.user)
        )

        # First refresh should succeed and rotate the token.
        first_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": original_refresh},
            format="json",
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertIn("access", first_response.data)
        self.assertIn("refresh", first_response.data)

        rotated_refresh = first_response.data["refresh"]

        self.assertNotEqual(
            original_refresh,
            rotated_refresh,
        )

        # The original refresh token must now be blacklisted.
        old_token_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": original_refresh},
            format="json",
        )

        self.assertEqual(old_token_response.status_code, 401)

        # The new refresh token must still work.
        second_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": rotated_refresh},
            format="json",
        )

        self.assertEqual(second_response.status_code, 200)
        self.assertIn("refresh", second_response.data)

        latest_refresh = second_response.data["refresh"]

        # Logging out blacklists the latest refresh token.
        logout_response = self.client.post(
            "/api/auth/logout/",
            {"refresh": latest_refresh},
            format="json",
        )

        self.assertEqual(logout_response.status_code, 200)

        # The logged-out refresh token cannot be reused.
        revoked_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": latest_refresh},
            format="json",
        )

        self.assertEqual(revoked_response.status_code, 401)
