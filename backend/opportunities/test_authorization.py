
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Opportunity


class OpportunityAuthorizationTests(APITestCase):

    def setUp(self):
        User = get_user_model()

        # Create two separate users.
        self.user_a = User.objects.create_user(
            username="security_user_a",
            email="security_a@example.com",
            password="TestPassword123!",
        )

        self.user_b = User.objects.create_user(
            username="security_user_b",
            email="security_b@example.com",
            password="TestPassword123!",
        )

        # User A owns this opportunity.
        self.opportunity = Opportunity.objects.create(
            user=self.user_a,
            title="Private Scholarship",
            organization="Security Test University",
            opportunity_type="scholarship",
        )

        self.detail_url = (
            f"/api/opportunities/{self.opportunity.id}/"
        )

    def test_user_cannot_access_another_users_opportunity(self):
        # Authenticate as User B.
        self.client.force_authenticate(user=self.user_b)

        # User B attempts to VIEW User A's opportunity.
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, 404)

        # User B attempts to UPDATE User A's opportunity.
        response = self.client.patch(
            self.detail_url,
            {"title": "Hacked Scholarship"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

        # User B attempts to DELETE User A's opportunity.
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, 404)

        # Verify the original opportunity is unchanged.
        self.opportunity.refresh_from_db()

        self.assertEqual(
            self.opportunity.title,
            "Private Scholarship",
        )

        # Verify User B cannot see it in their list.
        response = self.client.get("/api/opportunities/")
        self.assertEqual(response.status_code, 200)

        self.assertNotIn(
            self.opportunity.id,
            [
                item["id"]
                for item in (
                    response.data["results"]
                    if isinstance(response.data, dict)
                    else response.data
                )
            ],
        )

    def test_owner_can_access_their_opportunity(self):
        # Authenticate as User A.
        self.client.force_authenticate(user=self.user_a)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["title"],
            "Private Scholarship",
        )


    def test_user_cannot_assign_opportunity_to_another_user(self):
        # User B is authenticated.
        self.client.force_authenticate(user=self.user_b)

        # User B attempts to create an opportunity
        # using User A's account ID.
        response = self.client.post(
            "/api/opportunities/",
            {
                "title": "Ownership Security Test",
                "organization": "Test University",
                "opportunity_type": "scholarship",
                "user": self.user_a.id,
            },
            format="json",
        )

        # Creating the opportunity should succeed,
        # but ownership must be assigned to User B.
        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        created_opportunity = Opportunity.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            created_opportunity.user_id,
            self.user_b.id,
        )

        self.assertNotEqual(
            created_opportunity.user_id,
            self.user_a.id,
        )
