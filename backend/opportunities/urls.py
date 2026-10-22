
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)
from .cookie_auth_views import (
    cookie_csrf,
    CookieLoginView,
    CookieRefreshView,
    CookieLogoutView,
)

from .views import OpportunityViewSet
from .auth_views import RegisterView, LoginView
from .views import OpportunityExtractView
from opportunities.auth_views import VerifyEmailView
from opportunities.auth_views import ResendVerificationCodeView

from opportunities.password_reset_views import (
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

router = DefaultRouter()
router.register(
    "opportunities",
    OpportunityViewSet,
    basename="opportunity",
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", LoginView.as_view(), name="token_obtain_pair"),
    path(
        "auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "opportunities/extract/",
         OpportunityExtractView.as_view(),
         name="opportunity-extract",
    ),
    path(
        "auth/verify-email/",
         VerifyEmailView.as_view(),
        name="verify-email",
    ),
    path(
        "auth/resend-verification/",
        ResendVerificationCodeView.as_view(),
        name="resend-verification",
    ),
    
    path(
       "auth/password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "auth/password-reset/confirm/",
         PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path(
         "auth/logout/",
        TokenBlacklistView.as_view(),
         name="token_logout",
    ),
    
# -----------------------------------
# Step 4.13 - Secure Cookie Auth
# -----------------------------------

path(
    "auth/cookie/csrf/",
    cookie_csrf,
    name="cookie-csrf",
),

path(
    "auth/cookie/login/",
    CookieLoginView.as_view(),
    name="cookie-login",
),

path(
    "auth/cookie/refresh/",
    CookieRefreshView.as_view(),
    name="cookie-refresh",
),

path(
    "auth/cookie/logout/",
    CookieLogoutView.as_view(),
    name="cookie-logout",
),


] + router.urls


""" Your API now has these authentication endpoints:
Method	Endpoint	Purpose
POST	/api/auth/register/	Create an account
POST	/api/auth/token/	Obtain access and refresh tokens
POST	/api/auth/token/refresh/	Renew an access token """