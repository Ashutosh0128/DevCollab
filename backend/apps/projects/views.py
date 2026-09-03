from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied, NotAuthenticated
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import Project
from .permissions import IsOwnerOrReadOnlyPublic
from .serializers import (
    ProjectSerializer,
    ProjectCreateUpdateSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrReadOnlyPublic]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.select_related('owner').prefetch_related('skills').all()

        mine = self.request.query_params.get('mine', '').lower() in ('true', '1', 'yes')

        if mine:
            if not user or not user.is_authenticated:
                raise NotAuthenticated("Authentication is required to view your personal projects.")
            return queryset.filter(owner=user).distinct()

        if self.action == 'list':
            if user and user.is_authenticated:
                queryset = queryset.filter(Q(visibility='public') | Q(owner=user))
            else:
                queryset = queryset.filter(visibility='public')

            # Filters
            search = self.request.query_params.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(short_description__icontains=search) |
                    Q(description__icontains=search)
                )

            status_param = self.request.query_params.get('status', '').strip()
            if status_param:
                queryset = queryset.filter(status=status_param)

            skill_param = self.request.query_params.get('skill', '').strip()
            if skill_param:
                queryset = queryset.filter(skills__name__iexact=skill_param)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter('search', str, description='Search title and description'),
            OpenApiParameter('status', str, description='Filter by status (planning, in_progress, completed, on_hold)'),
            OpenApiParameter('skill', str, description='Filter by skill name'),
            OpenApiParameter('mine', bool, description='List only my own projects (requires auth)'),
            OpenApiParameter('page', int, description='Page number'),
        ],
        responses={200: ProjectSerializer(many=True)},
        description="Retrieve list of public projects for discovery or my own projects when mine=true."
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        request=ProjectCreateUpdateSerializer,
        responses={201: ProjectSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Create a new collaboration project. Owner automatically assigned to current user."
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(owner=request.user)
        output_serializer = ProjectSerializer(project)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        responses={200: ProjectSerializer, 403: OpenApiResponse(description="Private project access denied"), 404: OpenApiResponse(description="Not found")},
        description="Retrieve project details by ID."
    )
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ProjectSerializer(instance)
        return Response(serializer.data)

    @extend_schema(
        request=ProjectCreateUpdateSerializer,
        responses={200: ProjectSerializer, 403: OpenApiResponse(description="Owner permission required"), 400: OpenApiResponse(description="Validation error")},
        description="Update project details (owner only)."
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        output_serializer = ProjectSerializer(project)
        return Response(output_serializer.data)

    @extend_schema(
        responses={204: OpenApiResponse(description="Project deleted successfully"), 403: OpenApiResponse(description="Owner permission required")},
        description="Delete project (owner only)."
    )
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
