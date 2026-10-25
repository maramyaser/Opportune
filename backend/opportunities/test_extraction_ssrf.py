
import importlib
import socket
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from .views import extract_page_text


# Find the module containing the extraction function.
extractor = importlib.import_module(
    extract_page_text.__module__
)


class OpportunitySSRFTests(SimpleTestCase):

    def test_private_ip_is_blocked(self):
        """A private IP must never be fetched."""

        private_dns = [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("127.0.0.1", 443),
            )
        ]

        with (
            patch.object(
                extractor.socket,
                "getaddrinfo",
                return_value=private_dns,
            ),
            patch.object(
                extractor.urllib3,
                "HTTPSConnectionPool",
            ) as mock_pool,
        ):
            with self.assertRaises(
                extractor.PageExtractionError
            ):
                extract_page_text(
                    "https://example.com/opportunity"
                )

            # Network connection must never start.
            mock_pool.assert_not_called()

    def test_connection_uses_validated_ip(self):
        """The HTTP client must use the checked IP."""

        public_ip = "93.184.215.14"

        public_dns = [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                (public_ip, 443),
            )
        ]

        response = MagicMock()
        response.status = 200
        response.headers = {
            "Content-Type": "text/html"
        }
        response.stream.return_value = [
            b"<html><head><title>Internship</title>"
            b"</head><body>Software engineering "
            b"internship opportunity</body></html>"
        ]

        with (
            patch.object(
                extractor.socket,
                "getaddrinfo",
                return_value=public_dns,
            ),
            patch.object(
                extractor.urllib3,
                "HTTPSConnectionPool",
            ) as mock_pool,
        ):
            mock_pool.return_value.urlopen.return_value = (
                response
            )

            result = extract_page_text(
                "https://example.com/opportunity"
            )

            # Connection must use the validated IP.
            self.assertEqual(
                mock_pool.call_args.kwargs["host"],
                public_ip,
            )

            # HTTPS verification must use the
            # original hostname.
            self.assertEqual(
                mock_pool.call_args.kwargs[
                    "server_hostname"
                ],
                "example.com",
            )

            self.assertEqual(
                mock_pool.call_args.kwargs[
                    "assert_hostname"
                ],
                "example.com",
            )

            self.assertIn(
                "Software engineering internship",
                result["text"],
            )


    def test_http_redirect_is_blocked(self):
        """The extractor must not follow HTTP redirects."""

        public_dns = [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("93.184.215.14", 443),
            )
        ]

        response = MagicMock()
        response.status = 302
        response.headers = {
            "Location": "https://127.0.0.1/admin"
        }

        with (
            patch.object(
                extractor.socket,
                "getaddrinfo",
                return_value=public_dns,
            ),
            patch.object(
                extractor.urllib3,
                "HTTPSConnectionPool",
            ) as mock_pool,
        ):
            mock_pool.return_value.urlopen.return_value = (
                response
            )

            with self.assertRaises(
                extractor.PageExtractionError
            ):
                extract_page_text(
                    "https://example.com/opportunity"
                )

            # Redirect following must be disabled.
            self.assertFalse(
                mock_pool.return_value.urlopen.call_args
                .kwargs["redirect"]
            )

            response.close.assert_called_once()

    def test_oversized_webpage_is_blocked(self):
        """Webpages exceeding 1 MB must be rejected."""

        public_dns = [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("93.184.215.14", 443),
            )
        ]

        response = MagicMock()
        response.status = 200
        response.headers = {
            "Content-Type": "text/html"
        }

        # Simulate a webpage exceeding the allowed size.
        response.stream.return_value = [
            b"A" * (extractor.MAX_PAGE_SIZE + 1)
        ]

        with (
            patch.object(
                extractor.socket,
                "getaddrinfo",
                return_value=public_dns,
            ),
            patch.object(
                extractor.urllib3,
                "HTTPSConnectionPool",
            ) as mock_pool,
        ):
            mock_pool.return_value.urlopen.return_value = (
                response
            )

            with self.assertRaisesRegex(
                extractor.PageExtractionError,
                "too large",
            ):
                extract_page_text(
                    "https://example.com/opportunity"
                )

            response.close.assert_called_once()
    
    def test_blocked_website_shows_helpful_message(self):
        """HTTP 403 should suggest using Paste Text."""

        public_dns = [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("93.184.215.14", 443),
            )
        ]

        response = MagicMock()
        response.status = 403
        response.headers = {
            "Content-Type": "text/html"
        }

        with (
            patch.object(
                extractor.socket,
                "getaddrinfo",
                return_value=public_dns,
            ),
            patch.object(
                extractor.urllib3,
                "HTTPSConnectionPool",
            ) as mock_pool,
        ):
            mock_pool.return_value.urlopen.return_value = (
                response
            )

            with self.assertRaisesRegex(
                extractor.PageExtractionError,
                "Paste Text",
            ):
                extract_page_text(
                    "https://example.com/opportunity"
                )

            response.close.assert_called_once()

