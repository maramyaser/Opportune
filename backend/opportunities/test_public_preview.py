
from unittest.mock import patch

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        },
        "security": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "public-preview-test-cache",
        },
    }
)

class PublicPreviewTests(APITestCase):
    URL = "/api/opportunities/preview/"

    def setUp(self):
        cache.clear()

    @patch(
        "opportunities.views.extract_opportunity_details"
    )
    @patch("opportunities.views.extract_page_text")
    def test_anonymous_user_can_extract(
        self,
        mock_page,
        mock_ai,
    ):
        mock_page.return_value = {
            "text": "Scholarship opportunity",
            "source_url": "https://example.com/grant",
            "page_title": "Example Grant",
        }

        mock_ai.return_value = {
            "title": "Example Grant",
            "organization": "Example Foundation",
            "deadline": None,
            "eligibility": "University students",
            "required_documents": ["CV"],
        }

        response = self.client.post(
            self.URL,
            {"url": "https://example.com/grant"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["title"],
            "Example Grant",
        )

    def test_http_url_is_rejected(self):
        response = self.client.post(
            self.URL,
            {"url": "http://example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_missing_url_is_rejected(self):
        response = self.client.post(
            self.URL,
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    @patch(
        "opportunities.views.extract_opportunity_details"
    )
    @patch("opportunities.views.extract_page_text")
    def test_anonymous_rate_limit(
        self,
        mock_page,
        mock_ai,
    ):
        mock_page.return_value = {
            "text": "Scholarship opportunity",
            "source_url": "https://example.com/grant",
            "page_title": "Example Grant",
        }

        mock_ai.return_value = {
            "title": "Example Grant",
            "organization": "Example Foundation",
            "deadline": None,
            "eligibility": "",
            "required_documents": [],
        }

        statuses = []

        for _ in range(4):
            response = self.client.post(
                self.URL,
                {"url": "https://example.com/grant"},
                format="json",
            )
            statuses.append(response.status_code)

        self.assertEqual(
            statuses,
            [200, 200, 200, 429],
        )

@patch("opportunities.views.extract_opportunity_details")
@patch("opportunities.views.extract_page_text")
def test_global_preview_limit(self, mock_page, mock_ai):
    mock_page.return_value = {
        "text": "Scholarship opportunity",
        "source_url": "https://example.com/grant",
        "page_title": "Example Grant",
    }

    mock_ai.return_value = {
        "title": "Example Grant",
        "organization": "Example Foundation",
        "deadline": None,
        "eligibility": "",
        "required_documents": [],
    }

    for i in range(100):
        response = self.client.post(
            self.URL,
            {"url": "https://example.com/grant"},
            format="json",
            REMOTE_ADDR=f"198.51.100.{(i % 250) + 1}",
        )

        self.assertEqual(response.status_code, 200)

    response = self.client.post(
        self.URL,
        {"url": "https://example.com/grant"},
        format="json",
        REMOTE_ADDR="203.0.113.200",
    )

    self.assertEqual(response.status_code, 429)