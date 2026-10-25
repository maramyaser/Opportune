
import os

from django.contrib.admin.apps import AdminConfig


class OpportuneAdminConfig(AdminConfig):
    require_otp = os.getenv(
        "ADMIN_OTP_REQUIRED", "False"
    ).strip().lower() in {"true", "1", "yes"}

    default_site = (
        "config.otp_admin_site.OpportuneOTPAdminSite"
        if require_otp
        else "django.contrib.admin.sites.AdminSite"
    )
