from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Skill
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    SkillSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=RegisterSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiResponse(description="Validation error")
        },
        description="Register a new user account and obtain initial JWT token pair."
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = serializer.get_tokens(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "tokens": tokens
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(description="Successful authentication with token pair"),
            400: OpenApiResponse(description="Invalid credentials")
        },
        description="Authenticate user with email or username and obtain JWT tokens."
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
        responses={
            200: OpenApiResponse(description="Successfully logged out"),
            400: OpenApiResponse(description="Invalid token")
        },
        description="Blacklist refresh token to securely terminate user session."
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserSerializer},
        description="Retrieve currently authenticated user's profile."
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=UserProfileUpdateSerializer,
        responses={200: UserSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Update currently authenticated user's developer profile."
    )
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=UserProfileUpdateSerializer,
        responses={200: UserSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Update profile details and skills for currently authenticated user."
    )
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSkillsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: SkillSerializer(many=True)},
        description="Retrieve technical skills associated with the authenticated user."
    )
    def get(self, request):
        serializer = SkillSerializer(request.user.skills.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {"name": {"type": "string"}}}},
        responses={201: SkillSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Add a skill by name to the authenticated user's profile (case-insensitive lookup)."
    )
    def post(self, request):
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"name": ["Skill name is required."]}, status=status.HTTP_400_BAD_REQUEST)

        # Case-insensitive lookup to reuse existing Skill
        skill = Skill.objects.filter(name__iexact=name).first()
        if not skill:
            skill = Skill.objects.create(name=name)

        request.user.skills.add(skill)
        return Response(SkillSerializer(skill).data, status=status.HTTP_201_CREATED)


class UserSkillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="Skill detached from user profile"), 404: OpenApiResponse(description="Skill not found")},
        description="Remove a skill from the authenticated user's profile without deleting the global Skill record."
    )
    def delete(self, request, pk):
        try:
            skill = request.user.skills.get(pk=pk)
            request.user.skills.remove(skill)
            return Response({"detail": "Skill removed from profile."}, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response({"detail": "Skill not associated with this user profile."}, status=status.HTTP_404_NOT_FOUND)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ChangePasswordSerializer,
        responses={200: OpenApiResponse(description="Password changed successfully"), 400: OpenApiResponse(description="Validation error")},
        description="Change user password after validating current password."
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
