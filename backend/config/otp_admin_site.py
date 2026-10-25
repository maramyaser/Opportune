
from django_otp.admin import OTPAdminSite


class OpportuneOTPAdminSite(OTPAdminSite):
    site_header = "Opportune Administration"
    site_title = "Opportune Admin"
    index_title = "Administration Dashboard"
