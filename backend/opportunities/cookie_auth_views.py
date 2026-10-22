
from django.conf import settings
from django.http import JsonResponse
from django.middleware.csrf import get_token, rotate_token
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import (
    csrf_protect,
    ensure_csrf_cookie,
)
from django.views.decorators.http import require_GET

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import (
    api_settings as jwt_settings,
)
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_views import LoginView
from .security_throttles import LoginIPThrottle


# -------------------------------------------
# Helpers
# -------------------------------------------

def set_refresh_cookie(response, refresh_token):
    """
    Store the refresh token in a secure, HttpOnly cookie.
    """

    max_age = int(
        jwt_settings.REFRESH_TOKEN_LIFETIME.total_seconds()
    )

    response.set_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.AUTH_REFRESH_COOKIE_SECURE,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response):
    """
    Delete the browser's refresh token cookie.
    """

    response.delete_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


# -------------------------------------------
# GET /api/auth/cookie/csrf/
# -------------------------------------------

@require_GET
@never_cache
@ensure_csrf_cookie
def cookie_csrf(request):
    """
    Bootstrap CSRF protection for the React frontend.

    Django sets an HttpOnly CSRF cookie and returns
    a masked CSRF token that React can send in a header.
    """

    return JsonResponse({
        "csrfToken": get_token(request),
    })


# -------------------------------------------
# POST /api/auth/cookie/login/
# -------------------------------------------

@method_decorator(csrf_protect, name="dispatch")
class CookieLoginView(LoginView):
    """
    Reuse existing username/email authentication.

    Return an access token in JSON.
    Store the refresh token in an HttpOnly cookie.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code != status.HTTP_200_OK:
            return response

        refresh_token = response.data.pop(
            "refresh",
            None,
        )

        if not refresh_token:
            return Response(
                {
                    "detail": (
                        "Login could not establish a session."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Rotate the CSRF secret after successful login.
        rotate_token(request)

        # Frontend uses this token for future cookie
        # refresh and logout requests.
        response.data["csrfToken"] = get_token(request)

        set_refresh_cookie(
            response,
            refresh_token,
        )

        return response


# -------------------------------------------
# POST /api/auth/cookie/refresh/
# -------------------------------------------

@method_decorator(csrf_protect, name="dispatch")
class CookieRefreshView(APIView):
    """
    Read refresh token from HttpOnly cookie.
    Rotate refresh token and return a new access token.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginIPThrottle]

    def post(self, request):
        refresh_token = request.COOKIES.get(
            settings.AUTH_REFRESH_COOKIE_NAME
        )

        if not refresh_token:
            return Response(
                {"detail": "No active refresh session."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
            data={"refresh": refresh_token}
        )

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as exc:
            # Let DRF handle its authentication and
            # validation exceptions normally.
            from rest_framework.exceptions import APIException

            if isinstance(exc, APIException):
                raise

            raise

        data = serializer.validated_data

        response = Response(
            {"access": data["access"]},
            status=status.HTTP_200_OK,
        )

        # Step 4.12 rotation returns a replacement refresh
        # token. Never expose it in the JSON response.
        new_refresh_token = data.get("refresh")

        if new_refresh_token:
            set_refresh_cookie(
                response,
                new_refresh_token,
            )

        return response


# -------------------------------------------
# POST /api/auth/cookie/logout/
# -------------------------------------------

@method_decorator(csrf_protect, name="dispatch")
class CookieLogoutView(APIView):
    """
    Revoke refresh token on the backend.
    Clear the refresh cookie in the browser.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginIPThrottle]

    def post(self, request):
        refresh_token = request.COOKIES.get(
            settings.AUTH_REFRESH_COOKIE_NAME
        )

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                # Expired, already blacklisted or invalid.
                # Still clear the local cookie.
                pass

        response = Response(
            {"detail": "Signed out."},
            status=status.HTTP_200_OK,
        )

        clear_refresh_cookie(response)

        return response
