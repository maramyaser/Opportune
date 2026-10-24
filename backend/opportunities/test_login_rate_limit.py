
from unittest.mock import patch

from django.core.cache.backends.locmem import LocMemCache
from rest_framework.test import APITestCase
from .security_throttles import LoginIdentifierThrottle
from .security_throttles import LoginIPThrottle


class LoginRateLimitTests(APITestCase):

    def test_login_blocks_eleventh_attempt_from_same_ip(self):
        # Isolate the test from the production
        # security cache and other test counters.
        test_cache = LocMemCache(
            "opportune-login-ip-test",
            {},
        )

        statuses = []

        with patch.object(LoginIPThrottle, "cache", test_cache):
            for _ in range(11):
                response = self.client.post(
                    "/api/auth/cookie/login/",
                    {
                        "username": "nonexistent_security_test_user",
                        "password": "IncorrectPassword123!",
                    },
                    format="json",
                    REMOTE_ADDR="192.0.2.10",
                    HTTP_X_FORWARDED_FOR="198.51.100.10",
                )

                statuses.append(response.status_code)

        # The first ten requests must not be throttled.
        self.assertTrue(
            all(code != 429 for code in statuses[:10]),
            statuses,
        )

        # The eleventh request must be blocked.
        self.assertEqual(
            statuses[10],
            429,
            statuses,
        )
    
    def test_login_blocks_21st_attempt_for_same_identifier(self):
        # Independent caches for this test.
        ip_cache = LocMemCache(
            "opportune-ip-identifier-test",
            {},
        )

        identifier_cache = LocMemCache(
            "opportune-identifier-test",
            {},
        )

        statuses = []

        with (
            patch.object(LoginIPThrottle, "cache", ip_cache),
            patch.object(
                LoginIdentifierThrottle,
                "cache",
                identifier_cache,
            ),
        ):
            for attempt in range(21):
                # Alternate identifier case to check
                # case-insensitive account throttling.
                username = (
                    "NONEXISTENT_SECURITY_TEST_USER"
                    if attempt % 2 == 0
                    else "nonexistent_security_test_user"
                )

                # Simulate a different client IP
                # for every login attempt.
                ip = f"198.51.100.{attempt + 1}"

                response = self.client.post(
                    "/api/auth/cookie/login/",
                    {
                        "username": username,
                        "password": "IncorrectPassword123!",
                    },
                    format="json",
                    REMOTE_ADDR=ip,
                    HTTP_X_FORWARDED_FOR=ip,
                )

                statuses.append(response.status_code)

        # First 20 attempts should reach authentication.
        self.assertTrue(
            all(code != 429 for code in statuses[:20]),
            statuses,
        )

        # Attempt 21 must be blocked.
        self.assertEqual(
            statuses[20],
            429,
            statuses,
        )

