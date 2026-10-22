
import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


class CookieAuthenticationTests(TestCase):

    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)

        User = get_user_model()
        self.user = User.objects.create_user(
            username="cookie_test_user",
            email="cookie-test@example.com",
            password="StrongTestPassword!857",
        )

        self.login_url = "/api/auth/cookie/login/"
        self.refresh_url = "/api/auth/cookie/refresh/"
        self.logout_url = "/api/auth/cookie/logout/"

        self.credentials = {
            "username": "cookie_test_user",
            "password": "StrongTestPassword!857",
        }

    def post_json(self, url, data=None, csrf_token=None):
        headers = {
            "HTTP_ORIGIN": "https://opportune.site",
        }

        if csrf_token:
            headers["HTTP_X_CSRFTOKEN"] = csrf_token

        return self.client.post(
            url,
            data=json.dumps(data or {}),
            content_type="application/json",
            **headers,
        )

    def get_csrf_token(self):
        response = self.client.get(
            "/api/auth/cookie/csrf/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("csrftoken", self.client.cookies)

        return response.json()["csrfToken"]

    def test_login_requires_csrf(self):
        response = self.post_json(
            self.login_url,
            self.credentials,
        )

        self.assertEqual(response.status_code, 403)

    def test_login_refresh_and_logout(self):
        csrf_token = self.get_csrf_token()

        login_response = self.post_json(
            self.login_url,
            self.credentials,
            csrf_token,
        )

        self.assertEqual(login_response.status_code, 200)

        login_data = login_response.json()

        self.assertIn("access", login_data)
        self.assertNotIn("refresh", login_data)

        cookie = login_response.cookies["opportune_refresh"]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Lax")

        old_refresh = cookie.value

        # Successful login rotates the CSRF secret.
        csrf_token = login_data["csrfToken"]

        # Refresh requires a CSRF token.
        rejected_refresh = self.post_json(
            self.refresh_url,
        )
        self.assertEqual(rejected_refresh.status_code, 403)

        refresh_response = self.post_json(
            self.refresh_url,
            csrf_token=csrf_token,
        )

        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.json())
        self.assertNotIn("refresh", refresh_response.json())

        new_refresh = (
            refresh_response.cookies["opportune_refresh"].value
        )

        self.assertNotEqual(old_refresh, new_refresh)

        # Old refresh token is blacklisted.
        with self.assertRaises(TokenError):
            RefreshToken(old_refresh)

        logout_response = self.post_json(
            self.logout_url,
            csrf_token=csrf_token,
        )

        self.assertEqual(logout_response.status_code, 200)

        # The cookie is deleted.
        self.assertEqual(
            logout_response.cookies["opportune_refresh"]["max-age"],
            0,
        )

        # Latest refresh token is also revoked.
        with self.assertRaises(TokenError):
            RefreshToken(new_refresh)
