
from django.utils import timezone
from rest_framework import serializers

from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "content",
            "link",
            "reminder_at",
            "reminder_sent_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "reminder_sent_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        title = attrs.get(
            "title",
            getattr(self.instance, "title", ""),
        )

        content = attrs.get(
            "content",
            getattr(self.instance, "content", ""),
        )

        link = attrs.get(
            "link",
            getattr(self.instance, "link", ""),
        )

        if not any([
            (title or "").strip(),
            (content or "").strip(),
            (link or "").strip(),
        ]):
            raise serializers.ValidationError({
                "detail": (
                    "Write something or add a link "
                    "before saving your note."
                )
            })

        if "reminder_at" in attrs:
            reminder_at = attrs["reminder_at"]

            if (
                reminder_at is not None
                and reminder_at <= timezone.now()
            ):
                raise serializers.ValidationError({
                    "reminder_at": (
                        "Choose a future date and time."
                    )
                })

        return attrs

    def update(self, instance, validated_data):
        if "reminder_at" in validated_data:
            new_reminder = validated_data["reminder_at"]

            if new_reminder != instance.reminder_at:
                instance.reminder_sent_at = None

        return super().update(instance, validated_data)
