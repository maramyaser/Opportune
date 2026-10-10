
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Opportunity
from .serializers import OpportunitySerializer


class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(
            user=self.request.user
        ).order_by("deadline", "-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


""" This gives you the standard API operations:
- GET — list your opportunities.
- POST — save a new opportunity.
- GET /id/ — view one opportunity.
- PATCH /id/ — update selected fields.
- PUT /id/ — replace an opportunity.
- DELETE /id/ — delete an opportunity.
Authentication is required. Users cannot retrieve, 
modify, or delete another user's opportunities through these endpoints. """