
from django.contrib import admin
from django.urls import include, path
from opportunities.views import PublicOpportunityPreviewView

urlpatterns = [
        path(
        "api/opportunities/preview/",
        PublicOpportunityPreviewView.as_view(),
        name="public-opportunity-preview",
    ),
    path('admin/', admin.site.urls),
    path("api/", include("opportunities.urls")),
    path("api/support/", include("support.urls")),
    path("api/reminders/", include("reminders.urls")),
    path("api/", include("notes.urls")),
    

]
