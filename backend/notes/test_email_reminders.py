
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from notes.models import Note
from reminders.models import EmailReminderPreference


User = get_user_model()


class NoteEmailReminderTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notes_email_tester",
            email="account@example.com",
            password="TestPassword123!",
        )

        self.pref = EmailReminderPreference.objects.create(
            user=self.user,
            reminder_email="verified@example.com",
            email_verified=True,
            reminders_enabled=True,
        )

        self.note = Note.objects.create(
            user=self.user,
            title="Important reminder",
            content="Remember to submit my application.",
            link="https://example.com/application",
            reminder_at=timezone.now() - timedelta(minutes=1),
        )

    @patch(
        "notes.management.commands."
        "send_note_reminders.send_brevo_email"
    )
    def test_due_note_sent_only_once(self, mock_send):
        mock_send.return_value = {
            "messageId": "test-message-id"
        }

        for _ in range(2):
            call_command(
                "send_note_reminders",
                stdout=StringIO(),
                stderr=StringIO(),
            )

        self.note.refresh_from_db()

        self.assertIsNotNone(
            self.note.reminder_sent_at
        )

        self.assertEqual(mock_send.call_count, 1)

        self.assertEqual(
            mock_send.call_args.kwargs["to_email"],
            "verified@example.com",
        )

        self.assertIn(
            "Remember to submit my application.",
            mock_send.call_args.kwargs["html_content"],
        )

    @patch(
        "notes.management.commands."
        "send_note_reminders.send_brevo_email"
    )
    def test_unverified_email_not_used(self, mock_send):
        self.pref.email_verified = False
        self.pref.save()

        call_command(
            "send_note_reminders",
            stdout=StringIO(),
        )

        self.note.refresh_from_db()

        mock_send.assert_not_called()
        self.assertIsNone(
            self.note.reminder_sent_at
        )

    @patch(
        "notes.management.commands."
        "send_note_reminders.send_brevo_email"
    )
    def test_dry_run_never_sends(self, mock_send):
        call_command(
            "send_note_reminders",
            dry_run=True,
            stdout=StringIO(),
        )

        self.note.refresh_from_db()

        mock_send.assert_not_called()
        self.assertIsNone(
            self.note.reminder_sent_at
        )

    def test_cannot_schedule_without_verified_email(self):
        self.pref.reminders_enabled = False
        self.pref.save()

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.post(
            "/api/notes/",
            {
                "title": "New reminder",
                "reminder_at": (
                    timezone.now() + timedelta(days=1)
                ).isoformat(),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )
