from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
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

        # Restrict base queryset: public projects, or projects where current user is owner or accepted member
        if user and user.is_authenticated:
            queryset = queryset.filter(Q(visibility='public') | Q(owner=user) | Q(memberships__user=user))
        else:
            queryset = queryset.filter(visibility='public')

        if self.action == 'list':
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


class ProjectMatchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="AI/deterministic developer-project match evaluation")},
        description="Evaluate current authenticated user's match alignment with a project."
    )
    def get(self, request, pk):
        from django.shortcuts import get_object_or_404
        from .services.matching import calculate_deterministic_match
        from .services.ai_matching import generate_ai_match_explanation

        # Private project access restriction
        project = get_object_or_404(Project.objects.prefetch_related('skills').select_related('owner'), pk=pk)
        if project.visibility == 'private':
            is_owner = (project.owner_id == request.user.id)
            is_member = project.memberships.filter(user_id=request.user.id).exists()
            if not (is_owner or is_member):
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        deterministic_data = calculate_deterministic_match(request.user, project)
        ai_data = generate_ai_match_explanation(request.user, project, deterministic_data)

        response_data = {
            "project_id": project.id,
            "project_title": project.title,
            "match_score": deterministic_data["match_score"],
            "matched_skills": deterministic_data["matched_skills"],
            "missing_skills": deterministic_data["missing_skills"],
            "total_required_skills": deterministic_data["total_required_skills"],
            "explanation": ai_data["explanation"],
            "recommendations": ai_data["recommendations"],
            "skill_gap_advice": ai_data["skill_gap_advice"],
            "is_ai_generated": ai_data["is_ai_generated"],
        }
        return Response(response_data, status=status.HTTP_200_OK)


class ProjectRecommendedDevelopersView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="List of developers ranked by match score for project owner")},
        description="Retrieve ranked list of developer recommendations for a project (Owner only)."
    )
    def get(self, request, project_id):
        from django.shortcuts import get_object_or_404
        from django.contrib.auth import get_user_model
        from apps.users.serializers import UserSerializer
        from .services.matching import calculate_deterministic_match
        from .services.ai_matching import generate_ai_match_explanation

        User = get_user_model()
        project = get_object_or_404(Project.objects.prefetch_related('skills').select_related('owner'), pk=project_id)

        if project.owner_id != request.user.id:
            if project.visibility == 'private':
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"detail": "Only the project owner can view recommended developers."}, status=status.HTTP_403_FORBIDDEN)

        # Evaluate candidate developers (excluding project owner)
        candidates = User.objects.exclude(id=project.owner_id).prefetch_related('skills').all()
        evaluations = []

        for candidate in candidates:
            det = calculate_deterministic_match(candidate, project)
            evaluations.append({
                "developer": UserSerializer(candidate).data,
                "match_score": det["match_score"],
                "matched_skills": det["matched_skills"],
                "missing_skills": det["missing_skills"],
            })

        # Sort candidates descending by match_score
        evaluations.sort(key=lambda x: x["match_score"], reverse=True)
        top_candidates = evaluations[:10]

        # Attach AI explanation for top 3 candidates
        for idx, item in enumerate(top_candidates):
            if idx < 3:
                cand_user = candidates.get(id=item["developer"]["id"])
                ai_data = generate_ai_match_explanation(cand_user, project, item)
                item["explanation"] = ai_data["explanation"]
                item["recommendations"] = ai_data["recommendations"]
                item["is_ai_generated"] = ai_data["is_ai_generated"]
            else:
                item["explanation"] = f"Candidate matches {len(item['matched_skills'])} of required project skills."
                item["recommendations"] = []
                item["is_ai_generated"] = False

        return Response(top_candidates, status=status.HTTP_200_OK)


class RecommendedProjectsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ProjectSerializer(many=True)},
        description="Retrieve public projects recommended for current user ranked by skill match score."
    )
    def get(self, request):
        from .services.matching import calculate_deterministic_match

        # Accessible projects (public, or private where user is member/owner)
        queryset = Project.objects.select_related('owner').prefetch_related('skills').filter(
            Q(visibility='public') | Q(owner=request.user) | Q(memberships__user=request.user)
        ).distinct()

        ranked_projects = []
        for project in queryset:
            det = calculate_deterministic_match(request.user, project)
            proj_data = ProjectSerializer(project, context={'request': request}).data
            proj_data['match_score'] = det['match_score']
            proj_data['matched_skills'] = det['matched_skills']
            proj_data['missing_skills'] = det['missing_skills']
            ranked_projects.append(proj_data)

        ranked_projects.sort(key=lambda x: x['match_score'], reverse=True)
        return Response(ranked_projects[:20], status=status.HTTP_200_OK)


class ProjectAnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="Detailed project progress, task statistics, and contributor analytics")},
        description="Retrieve comprehensive analytics overview for a project including progress %, status breakdown, overdue count, and developer contribution stats."
    )
    def get(self, request, project_id):
        from django.shortcuts import get_object_or_404
        from django.utils import timezone
        from .models import Project, Task

        project = get_object_or_404(
            Project.objects.select_related('owner').prefetch_related('memberships__user'),
            pk=project_id
        )

        # Access control: Private projects restricted to owner and accepted members
        if project.visibility == 'private':
            is_owner = (project.owner_id == request.user.id)
            is_member = project.memberships.filter(user_id=request.user.id).exists()
            if not (is_owner or is_member):
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        tasks = project.tasks.all()
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='completed').count()
        incomplete_tasks = total_tasks - completed_tasks
        percentage = int(round((completed_tasks / total_tasks) * 100)) if total_tasks > 0 else 0

        tasks_by_status = {
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'completed': completed_tasks,
        }

        now = timezone.now()
        overdue_tasks = tasks.filter(due_date__lt=now).exclude(status='completed').count()

        # Gather contributors (Owner + Accepted Members + Assignees)
        contributors_map = {}

        # Owner
        owner_user = project.owner
        contributors_map[owner_user.id] = {
            "user_id": owner_user.id,
            "name": owner_user.full_name or owner_user.username,
            "username": owner_user.username,
            "avatar": getattr(owner_user, 'avatar', '') or '',
            "job_title": getattr(owner_user, 'job_title', '') or '',
            "role": "Owner",
            "tasks_assigned": 0,
            "tasks_completed": 0,
            "completion_percentage": 0,
        }

        # Accepted Members
        for m in project.memberships.all():
            mem_user = m.user
            if mem_user.id not in contributors_map:
                contributors_map[mem_user.id] = {
                    "user_id": mem_user.id,
                    "name": mem_user.full_name or mem_user.username,
                    "username": mem_user.username,
                    "avatar": getattr(mem_user, 'avatar', '') or '',
                    "job_title": getattr(mem_user, 'job_title', '') or '',
                    "role": "Member",
                    "tasks_assigned": 0,
                    "tasks_completed": 0,
                    "completion_percentage": 0,
                }

        # Task Assignees
        for t in tasks.select_related('assignee'):
            if t.assignee and t.assignee_id not in contributors_map:
                a_user = t.assignee
                contributors_map[a_user.id] = {
                    "user_id": a_user.id,
                    "name": a_user.full_name or a_user.username,
                    "username": a_user.username,
                    "avatar": getattr(a_user, 'avatar', '') or '',
                    "job_title": getattr(a_user, 'job_title', '') or '',
                    "role": "Contributor",
                    "tasks_assigned": 0,
                    "tasks_completed": 0,
                    "completion_percentage": 0,
                }

        # Aggregate task stats per contributor
        for t in tasks:
            if t.assignee_id and t.assignee_id in contributors_map:
                contributors_map[t.assignee_id]["tasks_assigned"] += 1
                if t.status == 'completed':
                    contributors_map[t.assignee_id]["tasks_completed"] += 1

        contributors_list = list(contributors_map.values())
        for c in contributors_list:
            if c["tasks_assigned"] > 0:
                c["completion_percentage"] = int(round((c["tasks_completed"] / c["tasks_assigned"]) * 100))
            else:
                c["completion_percentage"] = 0

        # Sort contributors descending by tasks_completed then tasks_assigned
        contributors_list.sort(key=lambda x: (x["tasks_completed"], x["tasks_assigned"]), reverse=True)

        analytics_data = {
            "project": {
                "id": project.id,
                "title": project.title,
                "visibility": project.visibility,
                "status": project.status,
            },
            "progress": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "incomplete_tasks": incomplete_tasks,
                "percentage": percentage,
            },
            "tasks_by_status": tasks_by_status,
            "overdue_tasks": overdue_tasks,
            "contributors": contributors_list,
        }

        return Response(analytics_data, status=status.HTTP_200_OK)

