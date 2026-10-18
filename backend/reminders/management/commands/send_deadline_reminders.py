
import html

from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from reminders.models import (
    EmailReminderPreference,
    ReminderDelivery,
)
from opportunities.services.brevo_email import send_brevo_email


TERMINAL_STATUSES = {
    "submitted",
    "accepted",
    "rejected",
    "expired",
}

DEFAULT_DAYS = [7, 3, 1]
ALLOWED_DAYS = {7, 3, 1}


class Command(BaseCommand):
    help = "Send Opportune deadline reminders through Brevo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview reminders without sending emails.",
        )

        parser.add_argument(
            "--user-id",
            type=int,
            help="Process only one user's reminders.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        user_id = options["user_id"]

        Opportunity = apps.get_model(
            getattr(
                settings,
                "OPPORTUNITY_MODEL",
                "opportunities.Opportunity",
            )
        )

        now = timezone.now()
        today = timezone.localdate(now)

        preferences = EmailReminderPreference.objects.filter(
            reminders_enabled=True,
            email_verified=True,
        ).select_related("user")

        if user_id is not None:
            preferences = preferences.filter(user_id=user_id)

        sent = 0
        pending = 0
        skipped = 0
        failed = 0

        for pref in preferences:
            email = (pref.reminder_email or "").strip()

            if not email:
                skipped += 1
                continue

            configured_days = (
                pref.reminder_days
                if pref.reminder_days is not None
                else DEFAULT_DAYS
            )

            days = sorted({
                day
                for day in configured_days
                if type(day) is int and day in ALLOWED_DAYS
            })

            if not days:
                continue

            opportunities = Opportunity.objects.filter(
                user=pref.user,
                deadline__gt=now,
            ).exclude(
                status__in=TERMINAL_STATUSES,
            )

            for item in opportunities.iterator():
                deadline_date = timezone.localtime(
                    item.deadline
                ).date()

                days_remaining = (
                    deadline_date - today
                ).days

                # Ignore deadlines that are too far away.
                if (
                    days_remaining < 0
                    or days_remaining > max(days)
                ):
                    continue

                # Select the currently applicable reminder stage.
                # Example:
                # 6 days remaining => 7-day reminder stage
                # 2 days remaining => 3-day reminder stage
                # 0 days remaining => 1-day reminder stage
                eligible_stages = [
                    day
                    for day in days
                    if day >= days_remaining
                ]

                if not eligible_stages:
                    continue

                stage = min(eligible_stages)

                # We only send each stage once.
                already_sent = ReminderDelivery.objects.filter(
                    user=pref.user,
                    opportunity_id=item.pk,
                    days_before=stage,
                    deadline_date=deadline_date,
                ).exists()

                if already_sent:
                    skipped += 1
                    continue

                if days_remaining == 0:
                    timing = "today"
                    subject_timing = "deadline is today"
                elif days_remaining == 1:
                    timing = "in 1 day"
                    subject_timing = "deadline in 1 day"
                else:
                    timing = f"in {days_remaining} days"
                    subject_timing = (
                        f"deadline in {days_remaining} days"
                    )

                safe_title = html.escape(item.title)
                safe_organization = html.escape(
                    item.organization or ""
                )

                url = (
                    item.application_url
                    or item.source_url
                    or ""
                )

                link_html = ""

                if url.startswith(("https://", "http://")):
                    safe_url = html.escape(url, quote=True)

                    link_html = (
                        f'<p><a href="{safe_url}">'
                        "View opportunity"
                        "</a></p>"
                    )

                subject = (
                    f"Opportune reminder: "
                    f"{item.title} — {subject_timing}"
                )

                html_content = f"""
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 540px;
                    margin: auto;
                    padding: 24px;
                ">
                    <h2 style="color:#359FA0;">
                        Opportune ✦
                    </h2>

                    <p>Your opportunity is getting closer!</p>

                    <div style="
                        background:#FFF0C5;
                        border-radius:14px;
                        padding:20px;
                    ">
                        <h3>{safe_title}</h3>
                        <p>{safe_organization}</p>
                        <p>
                            Deadline:
                            <strong>
                                {deadline_date:%d %b %Y}
                            </strong>
                        </p>
                        <p>
                            Your deadline is
                            <strong>{timing}</strong>.
                        </p>
                    </div>

                    {link_html}

                    <p>
                        You've got this!
                        Keep chasing your next big thing.
                    </p>
                </div>
                """

                if dry_run:
                    self.stdout.write(
                        "[DRY RUN] "
                        f"User {pref.user_id} | "
                        f"Opportunity {item.pk} | "
                        f"{days_remaining} days remaining | "
                        f"Stage {stage}"
                    )
                    pending += 1
                    continue

                try:
                    response = send_brevo_email(
                        to_email=email,
                        subject=subject,
                        html_content=html_content,
                    )

                    message_id = response.get("messageId")

                    if not message_id:
                        raise ValueError(
                            "Brevo did not return a messageId."
                        )

                    ReminderDelivery.objects.create(
                        user=pref.user,
                        opportunity_id=item.pk,
                        days_before=stage,
                        deadline_date=deadline_date,
                        resend_email_id=message_id,
                    )

                    sent += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Sent opportunity {item.pk} "
                            f"to user {pref.user_id}, "
                            f"stage {stage}"
                        )
                    )

                except Exception as exc:
                    failed += 1

                    self.stderr.write(
                        self.style.ERROR(
                            f"Opportunity {item.pk}: {exc}"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Reminders complete. Sent: {sent}, "
                f"Pending: {pending}, "
                f"Skipped: {skipped}, "
                f"Failed: {failed}."
            )
        )

        if failed:
            raise CommandError(
                f"{failed} reminder(s) failed."
            )
