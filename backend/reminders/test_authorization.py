
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import EmailReminderPreference


class ReminderAuthorizationTests(APITestCase):

    def test_users_cannot_access_or_change_other_users_reminders(self):
        User = get_user_model()

        # Create two independent accounts.
        user_a = User.objects.create_user(
            username="reminder_security_a",
            email="security-a@example.com",
            password="StrongPassword123!",
        )

        user_b = User.objects.create_user(
            username="reminder_security_b",
            email="security-b@example.com",
            password="StrongPassword123!",
        )

        # User A's private reminder settings.
        pref_a = EmailReminderPreference.objects.create(
            user=user_a,
            reminder_email="private-a@example.com",
            email_verified=True,
            reminders_enabled=True,
            reminder_days=[7, 3, 1],
        )

        # User B's private reminder settings.
        pref_b = EmailReminderPreference.objects.create(
            user=user_b,
            reminder_email="private-b@example.com",
            email_verified=True,
            reminders_enabled=False,
            reminder_days=[7],
        )

        # Authenticate as User B.
        self.client.force_authenticate(user=user_b)

        # User B should only receive their own settings.
        response = self.client.get(
            "/api/reminders/preferences/"
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["reminder_email"],
            "private-b@example.com",
        )

        self.assertNotEqual(
            response.data["reminder_email"],
            pref_a.reminder_email,
        )

        # User B tries to modify User A's settings
        # by supplying User A's ID and email.
        response = self.client.patch(
            "/api/reminders/preferences/",
            {
                "user": user_a.id,
                "reminder_email": "private-a@example.com",
                "email_verified": False,
                "reminder_days": [1],
                "reminders_enabled": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )

        # Refresh both records from the database.
        pref_a.refresh_from_db()
        pref_b.refresh_from_db()

        # User A's settings must remain unchanged.
        self.assertEqual(
            pref_a.reminder_email,
            "private-a@example.com",
        )

        self.assertTrue(pref_a.email_verified)
        self.assertTrue(pref_a.reminders_enabled)
        self.assertEqual(pref_a.reminder_days, [7, 3, 1])

        # User B may change their own reminder days.
        self.assertEqual(pref_b.reminder_days, [1])

        # But cannot change email through this endpoint.
        self.assertEqual(
            pref_b.reminder_email,
            "private-b@example.com",
        )

        self.assertTrue(pref_b.email_verified)
