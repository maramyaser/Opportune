
from rest_framework.routers import DefaultRouter
from .views import OpportunityViewSet

router = DefaultRouter()
router.register("opportunities", OpportunityViewSet, basename="opportunity")

urlpatterns = router.urls
