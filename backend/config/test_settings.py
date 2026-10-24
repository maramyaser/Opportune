
"""
Opportune: Safe local test settings.

Overrides the production database configuration
so tests never use Neon PostgreSQL.
"""

from .settings import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "local_test.sqlite3",
        "TEST": {
            "NAME": ":memory:",
        },
    }
}
