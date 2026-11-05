
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from .models import Note


User = get_user_model()


class NoteAPITests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="noteuser",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            username="othernoteuser",
            password="TestPassword123!",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_note(self):
        response = self.client.post(
            "/api/notes/",
            {
                "title": "My first note",
                "content": "Remember to apply!",
                "link": "",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Note.objects.count(), 1)

        note = Note.objects.first()
        self.assertEqual(note.user, self.user)

    def test_empty_note_rejected(self):
        response = self.client.post(
            "/api/notes/",
            {
                "title": "",
                "content": "",
                "link": "",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_users_cannot_access_other_notes(self):
        note = Note.objects.create(
            user=self.other_user,
            title="Private note",
        )

        response = self.client.get(
            f"/api/notes/{note.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_users_cannot_edit_other_notes(self):
        note = Note.objects.create(
            user=self.other_user,
            title="Private note",
        )

        response = self.client.patch(
            f"/api/notes/{note.id}/",
            {"title": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_future_reminder_allowed(self):
        future = timezone.now() + timedelta(days=1)

        response = self.client.post(
            "/api/notes/",
            {
                "content": "Follow up tomorrow",
                "reminder_at": future.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_past_reminder_rejected(self):
        past = timezone.now() - timedelta(days=1)

        response = self.client.post(
            "/api/notes/",
            {
                "content": "Reminder",
                "reminder_at": past.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_unauthenticated_user_rejected(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/notes/")

        self.assertEqual(response.status_code, 401)
