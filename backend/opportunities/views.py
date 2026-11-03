
import logging
import time

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Opportunity
from .serializers import OpportunitySerializer
from .services.page_extractor import (
    extract_page_text,
    PageExtractionError,
)
from .services.ai_extractor import extract_opportunity_details


logger = logging.getLogger(__name__)


# ========================================
# OPPORTUNITY CRUD
# ========================================

class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only access their own opportunities.
        return Opportunity.objects.filter(
            user=self.request.user
        ).order_by("deadline", "-created_at")

    def perform_create(self, serializer):
        # Associate new opportunities with the logged-in user.
        serializer.save(user=self.request.user)


# ========================================
# AI OPPORTUNITY EXTRACTION
# ========================================

class OpportunityExtractView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        url = request.data.get("url", "")
        pasted_text = request.data.get("text", "")

        if not isinstance(url, str) or not isinstance(pasted_text, str):
             return Response( {"detail": "URL and text must be strings."},
                               status=400,
        )

        url = url.strip()
        pasted_text = pasted_text.strip()

        if not url and not pasted_text:
             return Response(  {"detail": "Provide an opportunity URL or pasted text."},
                     status=400,
             )

        if url and pasted_text:
              return Response(
                 {
                      "detail": "Please provide either a URL or pasted text, not both.",
                       "code": "multiple_inputs",
                   },
                   status=400,
          )

        total_start = time.perf_counter()

        try:
            # ----------------------------------------
            # STEP 1: FETCH OPPORTUNITY CONTENT
            # ----------------------------------------
            fetch_start = time.perf_counter()

            if url:
                page = extract_page_text(url)

                source_text = page["text"]
                source_url = page["source_url"]
            else:
                source_text = pasted_text[:20000]
                source_url = ""

            fetch_duration = (
                time.perf_counter() - fetch_start
            )

            # ----------------------------------------
            # STEP 2: EXTRACT DETAILS WITH GEMINI
            # ----------------------------------------
            ai_start = time.perf_counter()

            result = extract_opportunity_details(
                page_text=source_text,
                source_url=source_url,
            )

            ai_duration = (
                time.perf_counter() - ai_start
            )

            # Use the website title if AI leaves it empty.
            if url:
                result["title"] = (
                    result["title"] or page["page_title"]
                )

            # ----------------------------------------
            # STEP 3: MEASURE TOTAL BACKEND TIME
            # ----------------------------------------
            total_duration = (
                time.perf_counter() - total_start
            )

            logger.debug(
                "[EXTRACTION PERFORMANCE] "
                "Fetch: %.2fs | AI: %.2fs | Total: %.2fs",
                fetch_duration,
                ai_duration,
                total_duration,
            )

            # ----------------------------------------
            # STEP 4: RETURN EXTRACTED INFORMATION
            # ----------------------------------------
            return Response(
                result,
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------
        # WEBSITE EXTRACTION ERROR
        # ----------------------------------------
        except PageExtractionError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "code": "page_extraction_failed",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------
        # INVALID EXTRACTION DATA
        # ----------------------------------------
        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "code": "invalid_extraction",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------
        # AI SERVICE ERROR
        # ----------------------------------------
        except RuntimeError:
            logger.warning(
                "AI extraction request failed."
            )

            return Response(
                {
                    "detail": (
                        "AI extraction failed. "
                        "Please try again."
                    ),
                    "code": "ai_extraction_failed",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
