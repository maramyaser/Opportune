
from rest_framework import serializers
from .models import Opportunity


class OpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = [
            "id",
            "title",
            "organization",
            "opportunity_type",
            "source_url",
            "application_url",
            "description",
            "eligibility",
            "location",
            "benefits",
            "required_documents",
            "deadline",
            "status",
            "notes",
            "extraction_confidence",
            "extraction_warnings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "extraction_confidence",
            "extraction_warnings",
            "created_at",
            "updated_at",
        ]



""" The serializer controls which fields the API accepts and returns. 
The user field is intentionally excluded so clients cannot assign an opportunity to another user. """