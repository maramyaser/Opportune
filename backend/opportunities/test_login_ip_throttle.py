
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from .security_throttles import LoginIPThrottle


class LoginIPThrottleTests(SimpleTestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.throttle = LoginIPThrottle()

    def test_proxy_suffix_cannot_change_throttle_identity(self):
        first = self.factory.post(
            "/api/auth/cookie/login/",
            REMOTE_ADDR="10.0.0.7",
            HTTP_X_FORWARDED_FOR="198.51.100.10, 10.0.0.1",
        )

        second = self.factory.post(
            "/api/auth/cookie/login/",
            REMOTE_ADDR="10.0.0.7",
            HTTP_X_FORWARDED_FOR="198.51.100.10, 10.0.0.99",
        )

        self.assertEqual(
            self.throttle.get_cache_key(first, None),
            self.throttle.get_cache_key(second, None),
        )

    def test_different_client_ips_have_different_keys(self):
        first = self.factory.post(
            "/api/auth/cookie/login/",
            HTTP_X_FORWARDED_FOR="198.51.100.10",
        )

        second = self.factory.post(
            "/api/auth/cookie/login/",
            HTTP_X_FORWARDED_FOR="203.0.113.20",
        )

        self.assertNotEqual(
            self.throttle.get_cache_key(first, None),
            self.throttle.get_cache_key(second, None),
        )

    def test_remote_addr_fallback(self):
        request = self.factory.post(
            "/api/auth/cookie/login/",
            REMOTE_ADDR="192.0.2.50",
        )

        self.assertEqual(
            self.throttle.get_ident(request),
            "192.0.2.50",
        )
