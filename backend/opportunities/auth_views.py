
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth import get_user_model

from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .auth_serializers import RegisterSerializer
from .services.email_verification import verify_email_code
from rest_framework.throttling import AnonRateThrottle
from .services.email_verification import send_verification_code
from .auth_serializers import (
    RegisterSerializer,
    UsernameOrEmailTokenSerializer,
)

from .security_throttles import (
    LoginIPThrottle,
    LoginIdentifierThrottle,
    RegistrationThrottle,
    EmailVerificationThrottle,
    ResendVerificationThrottle,
)


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [RegistrationThrottle]


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = UsernameOrEmailTokenSerializer
    throttle_classes = [LoginIPThrottle, LoginIdentifierThrottle]


class VerifyEmailSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    code = serializers.RegexField(regex=r"^\d{6}$")



class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [EmailVerificationThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        email = serializer.validated_data["email"].strip().lower()
        code = serializer.validated_data["code"]

        try:
            user = User.objects.get(
                username=username,
                email__iexact=email,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid verification details."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = verify_email_code(
                user=user,
                email=email,
                code=code,
                purpose="account",
            )

        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(result, status=status.HTTP_200_OK)

class VerificationResendThrottle(AnonRateThrottle):
    rate = "5/hour"


class ResendVerificationCodeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [VerificationResendThrottle]
    throttle_classes = [ResendVerificationThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(
            data={
                "username": request.data.get("username"),
                "email": request.data.get("email"),
                "code": "000000",
            }
        )
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        email = serializer.validated_data["email"].strip().lower()

        # Don't reveal whether an account exists.
        generic_response = {
            "message": (
                "If this account needs verification, "
                "a new code will be sent when allowed."
            )
        }

        user = User.objects.filter(
            username=username,
            email__iexact=email,
            is_active=False,
        ).first()

        if user is None:
            return Response(
                generic_response,
                status=status.HTTP_200_OK,
            )

        try:
            send_verification_code(
                user=user,
                email=user.email,
                purpose="account",
            )
        except ValueError:
            # Includes the existing 60-second resend cooldown.
            pass

        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )
