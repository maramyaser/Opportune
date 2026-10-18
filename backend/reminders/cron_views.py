
import hmac
import io
import logging
import os

from django.core.management import call_command
from django.db import connection
from django.http import JsonResponse

from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


logger = logging.getLogger(__name__)

# Constant PostgreSQL advisory-lock identifier.
REMINDER_LOCK_ID = 81736245001


class ReminderHealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return JsonResponse({"status": "ok"})


class RunScheduledRemindersView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected_secret = os.environ.get(
            "CRON_SECRET", ""
        )

        supplied_secret = request.headers.get(
            "X-Cron-Secret", ""
        )

        if (
            not expected_secret
            or not hmac.compare_digest(
                supplied_secret,
                expected_secret,
            )
        ):
            return JsonResponse(
                {"detail": "Forbidden."},
                status=403,
            )

        # The deployed application uses PostgreSQL.
        if connection.vendor != "postgresql":
            return JsonResponse(
                {"detail": "PostgreSQL is required."},
                status=503,
            )

        acquired = False

        try:
            # Prevent overlapping scheduled executions.
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT pg_try_advisory_lock(%s)",
                    [REMINDER_LOCK_ID],
                )
                acquired = cursor.fetchone()[0]

            if not acquired:
                return JsonResponse(
                    {
                        "status": "already_running",
                        "message": (
                            "Another reminder check is running."
                        ),
                    },
                    status=200,
                )

            output = io.StringIO()

            call_command(
                "send_deadline_reminders",
                stdout=output,
            )

            logger.info(
                "Scheduled reminder check completed: %s",
                output.getvalue()[-1000:],
            )

            return JsonResponse({
                "status": "completed",
                "message": "Reminder check completed.",
            })

        except Exception:
            logger.exception(
                "Scheduled reminder check failed."
            )

            return JsonResponse(
                {
                    "status": "failed",
                    "detail": "Reminder check failed.",
                },
                status=500,
            )

        finally:
            if acquired:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_unlock(%s)",
                        [REMINDER_LOCK_ID],
                    )
