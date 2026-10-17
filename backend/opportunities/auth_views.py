
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .auth_serializers import RegisterSerializer
from django.contrib.auth import get_user_model

from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .auth_serializers import RegisterSerializer
from .services.email_verification import verify_email_code


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class VerifyEmailSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    code = serializers.RegexField(regex=r"^\d{6}$")


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

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
