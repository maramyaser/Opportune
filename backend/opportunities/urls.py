
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import OpportunityViewSet
from .auth_views import RegisterView, LoginView
from .views import OpportunityExtractView

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
] + router.urls


""" Your API now has these authentication endpoints:
Method	Endpoint	Purpose
POST	/api/auth/register/	Create an account
POST	/api/auth/token/	Obtain access and refresh tokens
POST	/api/auth/token/refresh/	Renew an access token """