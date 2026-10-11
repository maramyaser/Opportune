
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from .models import Opportunity
from .serializers import OpportunitySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.page_extractor import (
    extract_page_text,
    PageExtractionError,
)
from .services.ai_extractor import extract_opportunity_details


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

class OpportunityExtractView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        url = request.data.get("url")
        pasted_text = request.data.get("text", "")

        if not url and not pasted_text:
            return Response(
                {"detail": "Provide an opportunity URL or pasted text."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if url:
                page = extract_page_text(url)
                source_text = page["text"]
                source_url = page["source_url"]
            else:
                source_text = pasted_text[:20000]
                source_url = ""

            result = extract_opportunity_details(
                page_text=source_text,
                source_url=source_url,
            )

            if url:
                result["title"] = (
                    result["title"] or page["page_title"]
                )

            return Response(result, status=status.HTTP_200_OK)

        except PageExtractionError as exc:
            return Response(
                {"detail": str(exc), "code": "page_extraction_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc), "code": "invalid_extraction"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except RuntimeError:
            return Response(
                {
                    "detail": "AI extraction failed. Please try again.",
                    "code": "ai_extraction_failed",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )