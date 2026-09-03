from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.projects.models import Project
from apps.notifications.services import (
    notify_collaboration_request,
    notify_collaboration_accepted,
    notify_collaboration_rejected,
    notify_member_removed,
    notify_member_left,
)
from .models import CollaborationRequest, ProjectMembership
from .serializers import (
    CollaborationRequestSerializer,
    CreateCollaborationRequestSerializer,
    ProjectMembershipSerializer,
)


class CreateRequestView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CreateCollaborationRequestSerializer,
        responses={201: CollaborationRequestSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Submit a new collaboration request for a public project."
    )
    def post(self, request):
        serializer = CreateCollaborationRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            collab_request = serializer.save(requester=request.user)
            notify_collaboration_request(collab_request)
        return Response(CollaborationRequestSerializer(collab_request).data, status=status.HTTP_201_CREATED)


class SentRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: CollaborationRequestSerializer(many=True)},
        description="Retrieve list of collaboration requests submitted by the authenticated user."
    )
    def get(self, request):
        requests = CollaborationRequest.objects.filter(requester=request.user).select_related('project', 'requester')
        return Response(CollaborationRequestSerializer(requests, many=True).data, status=status.HTTP_200_OK)


class ProjectIncomingRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: CollaborationRequestSerializer(many=True), 403: OpenApiResponse(description="Owner access required")},
        description="Retrieve list of incoming collaboration requests for a project (Owner only)."
    )
    def get(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        if project.owner != request.user:
            return Response({"detail": "Only the project owner can view incoming collaboration requests."}, status=status.HTTP_403_FORBIDDEN)

        requests = CollaborationRequest.objects.filter(project=project).select_related('project', 'requester')
        return Response(CollaborationRequestSerializer(requests, many=True).data, status=status.HTTP_200_OK)


class AcceptRequestView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: CollaborationRequestSerializer, 400: OpenApiResponse(description="Invalid state transition"), 403: OpenApiResponse(description="Owner access required")},
        description="Accept a pending collaboration request and create project membership (Owner only)."
    )
    def post(self, request, pk):
        collab_request = get_object_or_404(CollaborationRequest.objects.select_related('project', 'requester'), pk=pk)

        if collab_request.project.owner != request.user:
            return Response({"detail": "Only the project owner can accept requests."}, status=status.HTTP_403_FORBIDDEN)

        if collab_request.status != 'pending':
            return Response({"detail": f"Cannot accept request with status '{collab_request.status}'. Only pending requests can be accepted."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            collab_request.status = 'accepted'
            collab_request.save()
            ProjectMembership.objects.get_or_create(project=collab_request.project, user=collab_request.requester)
            notify_collaboration_accepted(collab_request)

        return Response(CollaborationRequestSerializer(collab_request).data, status=status.HTTP_200_OK)


class RejectRequestView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: CollaborationRequestSerializer, 400: OpenApiResponse(description="Invalid state transition"), 403: OpenApiResponse(description="Owner access required")},
        description="Reject a pending collaboration request (Owner only)."
    )
    def post(self, request, pk):
        collab_request = get_object_or_404(CollaborationRequest.objects.select_related('project', 'requester'), pk=pk)

        if collab_request.project.owner != request.user:
            return Response({"detail": "Only the project owner can reject requests."}, status=status.HTTP_403_FORBIDDEN)

        if collab_request.status != 'pending':
            return Response({"detail": f"Cannot reject request with status '{collab_request.status}'. Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            collab_request.status = 'rejected'
            collab_request.save()
            notify_collaboration_rejected(collab_request)

        return Response(CollaborationRequestSerializer(collab_request).data, status=status.HTTP_200_OK)


class ProjectMembersView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: ProjectMembershipSerializer(many=True), 403: OpenApiResponse(description="Private project member access restricted")},
        description="Retrieve project accepted members list (Public or Private member/owner guarded)."
    )
    def get(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)

        # Private project protection
        if project.visibility == 'private':
            if not (request.user and request.user.is_authenticated):
                return Response({"detail": "Authentication required to view members of a private project."}, status=status.HTTP_401_UNAUTHORIZED)
            
            is_owner = (project.owner == request.user)
            is_member = project.memberships.filter(user=request.user).exists()
            if not (is_owner or is_member):
                return Response({"detail": "You do not have permission to view members of this private project."}, status=status.HTTP_403_FORBIDDEN)

        members = project.memberships.select_related('user').all()
        return Response(ProjectMembershipSerializer(members, many=True).data, status=status.HTTP_200_OK)


class LeaveProjectView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="Successfully left project"), 404: OpenApiResponse(description="Membership not found")},
        description="Leave a project membership (Authenticated member only)."
    )
    def delete(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        membership = ProjectMembership.objects.filter(project=project, user=request.user).first()
        if not membership:
            return Response({"detail": "You are not a member of this project."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            membership.delete()
            notify_member_left(project, request.user)

        return Response({"detail": "Successfully left the project."}, status=status.HTTP_200_OK)


class RemoveMemberView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="Member removed successfully"), 400: OpenApiResponse(description="Owner cannot remove self"), 403: OpenApiResponse(description="Owner access required")},
        description="Remove a member from a project (Owner only)."
    )
    def delete(self, request, project_id, user_id):
        project = get_object_or_404(Project, pk=project_id)

        if project.owner != request.user:
            return Response({"detail": "Only the project owner can remove members."}, status=status.HTTP_403_FORBIDDEN)

        if user_id == project.owner.id:
            return Response({"detail": "The project owner cannot be removed via member management."}, status=status.HTTP_400_BAD_REQUEST)

        membership = ProjectMembership.objects.filter(project=project, user_id=user_id).first()
        if not membership:
            return Response({"detail": "User is not a member of this project."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            removed_user = membership.user
            membership.delete()
            notify_member_removed(project, removed_user, request.user)

        return Response({"detail": "Member removed successfully."}, status=status.HTTP_200_OK)
