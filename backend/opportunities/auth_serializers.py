
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .services.email_verification import send_verification_code
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        email = value.strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return email

    def create(self, validated_data):
        password = validated_data.pop("password")

        with transaction.atomic():
            user = User.objects.create_user(
                **validated_data,
                password=password,
            )

            # Keep account inactive until email verification.
            user.is_active = False
            user.save(update_fields=["is_active"])

            send_verification_code(
                user=user,
                email=user.email,
                purpose="account",
            )

        return user

class UsernameOrEmailTokenSerializer(TokenObtainPairSerializer):
    """
    Accept a username or registered email in the
    existing 'username' login field.
    """

    def validate(self, attrs):
        identifier = attrs.get(self.username_field, "").strip()

        # If the identifier matches a username, use it directly.
        # Otherwise, check for a registered email address.
        if not User.objects.filter(
            **{self.username_field: identifier}
        ).exists():
            matches = list(
                User.objects.filter(
                    email__iexact=identifier
                ).values_list(self.username_field, flat=True)[:2]
            )

            if len(matches) != 1:
                raise AuthenticationFailed(
                    "Invalid login credentials."
                )

            identifier = matches[0]

        credentials = {
            **attrs,
            self.username_field: identifier,
        }

        # SimpleJWT still checks the password and
        # rejects inactive accounts.
        return super().validate(credentials)
