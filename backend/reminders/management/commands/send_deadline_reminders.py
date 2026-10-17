
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
            help="Only process reminders for one user.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        user_id = options["user_id"]

        opportunity_model = getattr(
            settings,
            "OPPORTUNITY_MODEL",
            "opportunities.Opportunity",
        )

        Opportunity = apps.get_model(opportunity_model)

        today = timezone.localdate()

        preferences = EmailReminderPreference.objects.filter(
            reminders_enabled=True,
            email_verified=True,
        ).select_related("user")

        if user_id is not None:
            preferences = preferences.filter(
                user_id=user_id
            )

        sent = 0
        skipped = 0
        failed = 0
        pending = 0

        for pref in preferences:
            email = (pref.reminder_email or "").strip()

            if not email:
                skipped += 1
                continue

            reminder_days = (
                pref.reminder_days
                if pref.reminder_days is not None
                else DEFAULT_DAYS
            )

            if not reminder_days:
                continue

            opportunities = Opportunity.objects.filter(
                user=pref.user,
                deadline__isnull=False,
            )

            for opportunity in opportunities.iterator():
                if opportunity.status in TERMINAL_STATUSES:
                    continue

                deadline = opportunity.deadline

                if timezone.is_aware(deadline):
                    deadline = timezone.localtime(deadline)

                deadline_date = deadline.date()

                days_before = (
                    deadline_date - today
                ).days

                if days_before not in reminder_days:
                    continue

                already_sent = ReminderDelivery.objects.filter(
                    user=pref.user,
                    opportunity_id=opportunity.pk,
                    days_before=days_before,
                    deadline_date=deadline_date,
                ).exists()

                if already_sent:
                    skipped += 1
                    continue

                title = html.escape(opportunity.title)

                organization = html.escape(
                    opportunity.organization or ""
                )

                application_url = (
                    opportunity.application_url
                    or opportunity.source_url
                    or ""
                )

                link_html = ""

                if application_url.startswith(
                    ("https://", "http://")
                ):
                    safe_url = html.escape(
                        application_url,
                        quote=True,
                    )

                    link_html = (
                        f'<p><a href="{safe_url}">'
                        "View opportunity"
                        "</a></p>"
                    )

                subject = (
                    f"Opportune reminder: "
                    f"{opportunity.title} "
                    f"deadline in {days_before} day(s)"
                )

                html_content = f"""
                <div style="
                    font-family:Arial,sans-serif;
                    max-width:540px;
                    margin:auto;
                    padding:24px;
                ">
                    <h2 style="color:#359FA0;">
                        Opportune ✦
                    </h2>

                    <h3>
                        Your opportunity is getting closer!
                    </h3>

                    <div style="
                        background:#FFF0C5;
                        padding:20px;
                        border-radius:14px;
                    ">
                        <h3>{title}</h3>

                        <p>{organization}</p>

                        <p>
                            Deadline:
                            <strong>
                                {deadline_date:%d %b %Y}
                            </strong>
                        </p>

                        <p>
                            <strong>
                                {days_before} day(s) left!
                            </strong>
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
                        f"Opportunity {opportunity.pk} | "
                        f"{days_before} day(s) before"
                    )
                    pending += 1
                    continue

                try:
                    result = send_brevo_email(
                        to_email=email,
                        subject=subject,
                        html_content=html_content,
                    )

                    message_id = result.get("messageId")

                    if not message_id:
                        raise ValueError(
                            "Brevo did not return a messageId."
                        )

                    ReminderDelivery.objects.create(
                        user=pref.user,
                        opportunity_id=opportunity.pk,
                        days_before=days_before,
                        deadline_date=deadline_date,
                        resend_email_id=message_id,
                    )

                    sent += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Sent reminder for "
                            f"opportunity {opportunity.pk}"
                        )
                    )

                except Exception as exc:
                    failed += 1

                    self.stderr.write(
                        self.style.ERROR(
                            f"Opportunity "
                            f"{opportunity.pk}: {exc}"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                "Reminders complete. "
                f"Sent: {sent}, "
                f"Pending: {pending}, "
                f"Skipped: {skipped}, "
                f"Failed: {failed}."
            )
        )
