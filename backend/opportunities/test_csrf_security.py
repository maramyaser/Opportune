
from django.test import Client, TestCase


class CookieCSRFSecurityTests(TestCase):

    def test_cookie_auth_endpoints_require_csrf(self):
        client = Client(enforce_csrf_checks=True)

        # Obtain a legitimate CSRF token.
        response = client.get("/api/auth/cookie/csrf/")
        self.assertEqual(response.status_code, 200)

        csrf_token = response.json()["csrfToken"]

        # These endpoints must reject requests
        # without the CSRF token.
        endpoints = [
            "/api/auth/cookie/login/",
            "/api/auth/cookie/refresh/",
            "/api/auth/cookie/logout/",
        ]

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = client.post(
                    endpoint,
                    data="{}",
                    content_type="application/json",
                )

                self.assertEqual(
                    response.status_code,
                    403,
                    f"{endpoint} did not reject missing CSRF",
                )

        # A valid CSRF token should allow the
        # logout request to pass CSRF validation.
        response = client.post(
            "/api/auth/cookie/logout/",
            data="{}",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 200)

    
    def test_untrusted_origin_is_rejected(self):
        client = Client(enforce_csrf_checks=True)

        # Obtain a legitimate CSRF token.
        response = client.get(
            "/api/auth/cookie/csrf/",
            secure=True,
        )

        self.assertEqual(response.status_code, 200)
        csrf_token = response.json()["csrfToken"]

        # Simulate a request originating from
        # an unauthorized external website.
        response = client.post(
            "/api/auth/cookie/logout/",
            data="{}",
            content_type="application/json",
            secure=True,
            HTTP_ORIGIN="https://attacker.example",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        # Django must reject the untrusted origin,
        # even when a valid CSRF token is supplied.
        self.assertEqual(response.status_code, 403)

