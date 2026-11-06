
import html
from urllib.parse import urlsplit

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from notes.models import Note
from reminders.models import EmailReminderPreference
from opportunities.services.brevo_email import send_brevo_email


def build_note_email(note):
    title = note.title or "Your saved note"

    subject_title = " ".join(title.split())[:120]

    subject = (
        f"Opportune note reminder: {subject_title}"
    )

    safe_title = html.escape(title)

    safe_content = html.escape(
        note.content or ""
    ).replace("\n", "<br>")

    if not safe_content:
        safe_content = "You saved this reminder in Opportune."

    link_html = ""

    if note.link:
        parsed = urlsplit(note.link)

        if (
            parsed.scheme in {"http", "https"}
            and parsed.netloc
        ):
            safe_link = html.escape(
                note.link,
                quote=True,
            )

            link_html = f"""
                <p style="margin-top:20px;">
                    <a href="{safe_link}"
                       style="color:#278c8d;">
                        Open your saved link
                    </a>
                </p>
            """

    html_content = f"""
    <div style="
        font-family:Arial,sans-serif;
        max-width:560px;
        margin:auto;
        padding:24px;
        color:#245d5d;
    ">
        <h2 style="color:#359fa0;">
            Opportune
        </h2>

        <p>
            Here's the note you asked us
            to remind you about.
        </p>

        <div style="
            background:#fff0c5;
            border-radius:16px;
            padding:22px;
        ">
            <h3 style="margin-top:0;">
                {safe_title}
            </h3>

            <div style="
                line-height:1.7;
                overflow-wrap:anywhere;
            ">
                {safe_content}
            </div>

            {link_html}
        </div>

        <p style="
            margin-top:22px;
            color:#587171;
        ">
            Saved with Opportune.
            Keep making progress!
        </p>
    </div>
    """

    return subject, html_content


class Command(BaseCommand):
    help = "Send due personal note reminders through Brevo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview reminders without sending emails.",
        )

        parser.add_argument(
            "--user-id",
            type=int,
            help="Only process this user's notes.",
        )

        parser.add_argument(
            "--limit",
            type=int,
            default=100,
            help="Maximum notes to process per run.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        user_id = options["user_id"]
        limit = options["limit"]

        if limit < 1 or limit > 500:
            raise CommandError(
                "--limit must be between 1 and 500."
            )

        now = timezone.now()

        due_notes = Note.objects.filter(
            reminder_at__isnull=False,
            reminder_at__lte=now,
            reminder_sent_at__isnull=True,
            user__email_reminder_preference__email_verified=True,
            user__email_reminder_preference__reminders_enabled=True,
        ).exclude(
            user__email_reminder_preference__reminder_email=""
        ).order_by(
            "reminder_at",
            "pk",
        )

        if user_id is not None:
            due_notes = due_notes.filter(
                user_id=user_id
            )

        note_ids = list(
            due_notes.values_list("pk", flat=True)[:limit]
        )

        sent = 0
        pending = 0
        skipped = 0
        failed = 0

        for note_id in note_ids:
            try:
                # PostgreSQL row locking prevents two
                # simultaneous workers from sending the
                # same reminder concurrently.
                with transaction.atomic():
                    try:
                        note = (
                            Note.objects
                            .select_for_update()
                            .get(pk=note_id)
                        )
                    except Note.DoesNotExist:
                        skipped += 1
                        continue

                    if (
                        note.reminder_at is None
                        or note.reminder_sent_at is not None
                        or note.reminder_at > timezone.now()
                    ):
                        skipped += 1
                        continue

                    pref = (
                        EmailReminderPreference.objects
                        .filter(
                            user_id=note.user_id,
                            email_verified=True,
                            reminders_enabled=True,
                        )
                        .exclude(reminder_email="")
                        .first()
                    )

                    if pref is None:
                        skipped += 1
                        continue

                    email = pref.reminder_email.strip()
                    subject, html_content = build_note_email(
                        note
                    )

                    if dry_run:
                        self.stdout.write(
                            f"[DRY RUN] Note {note.pk} | "
                            f"User {note.user_id} | "
                            f"Due {note.reminder_at.isoformat()}"
                        )
                        pending += 1
                        continue

                    response = send_brevo_email(
                        to_email=email,
                        subject=subject,
                        html_content=html_content,
                    )

                    if not response.get("messageId"):
                        raise ValueError(
                            "Brevo did not return a messageId."
                        )

                    note.reminder_sent_at = timezone.now()

                    note.save(
                        update_fields=["reminder_sent_at"]
                    )

                    sent += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Sent note {note.pk} "
                            f"for user {note.user_id}"
                        )
                    )

            except Exception as exc:
                failed += 1

                self.stderr.write(
                    self.style.ERROR(
                        f"Note {note_id}: "
                        f"{type(exc).__name__}: {exc}"
                    )
                )

        self.stdout.write(
            f"Note reminders complete. "
            f"Sent: {sent}, "
            f"Pending: {pending}, "
            f"Skipped: {skipped}, "
            f"Failed: {failed}."
        )

        if failed:
            raise CommandError(
                f"{failed} note reminder(s) failed."
            )
