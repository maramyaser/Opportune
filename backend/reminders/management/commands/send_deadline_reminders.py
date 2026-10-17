import html, os
from datetime import datetime
from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from reminders.models import EmailReminderPreference, ReminderDelivery
from opportunities.services.brevo_email import send_brevo_email
TERMINAL = {"submitted","accepted","rejected","expired"}
class Command(BaseCommand):
    help = "Send Opportune deadline reminders using Resend."
    def handle(self, *args, **kwargs):
        label = getattr(settings, "OPPORTUNITY_MODEL", os.environ.get("OPPORTUNITY_MODEL", "opportunities.Opportunity"))
        Model = apps.get_model(label)
        owner = next((name for name in ("user","owner","created_by") if any(f.name == name and f.is_relation for f in Model._meta.get_fields())), None)
        if not owner: raise RuntimeError(f"{label} needs an owner relation named user, owner, or created_by; adjust this command.")
        today, sent, failed = timezone.localdate(), 0, 0
        for pref in EmailReminderPreference.objects.filter(reminders_enabled=True, email_verified=True).select_related("user"):
            email = (getattr(pref.user, "email", "") or "").strip()
            if not email: continue
            for item in Model.objects.filter(**{owner:pref.user, "deadline__isnull":False}).iterator():
                if str(getattr(item,"status","")).lower() in TERMINAL: continue
                deadline = item.deadline
                if isinstance(deadline, datetime):
                    if timezone.is_aware(deadline): deadline = timezone.localtime(deadline)
                    deadline = deadline.date()
                if not deadline: continue
                days = (deadline - today).days
                if days not in (pref.reminder_days or [7,3,1]): continue
                if ReminderDelivery.objects.filter(user=pref.user, opportunity_id=item.pk, days_before=days, deadline_date=deadline).exists(): continue
                title = html.escape(str(getattr(item,"title","Opportunity")))
                org = html.escape(str(getattr(item,"organization","") or ""))
                url = getattr(item,"application_url","") or getattr(item,"source_url","") or ""
                link = f'<p><a href="{html.escape(url,quote=True)}">View opportunity</a></p>' if url.startswith(("https://","http://")) else ""
                try:
                    email_id = send_brevo_email(email, f"Opportune reminder: {title} deadline in {days} day(s)", f"<h2>Your opportunity is getting closer ✨</h2><p><b>{title}</b></p><p>{org}</p><p>Deadline: <b>{deadline:%d %b %Y}</b></p><p>This opportunity is due in {days} day(s).</p>{link}")
                    ReminderDelivery.objects.create(user=pref.user, opportunity_id=item.pk, days_before=days, deadline_date=deadline, resend_email_id=email_id)
                    sent += 1
                except Exception as exc:
                    failed += 1
                    self.stderr.write(f"Opportunity {item.pk}: {exc}")
        self.stdout.write(self.style.SUCCESS(f"Reminders complete. Sent {sent}; failed {failed}."))
