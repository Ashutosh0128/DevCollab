from rest_framework import permissions


class IsProjectOwner(permissions.BasePermission):
    """
    Permission class ensuring only the project owner can manage collaboration requests and members.
    """

    def has_object_permission(self, request, view, obj):
        # obj can be Project, CollaborationRequest, or ProjectMembership
        if hasattr(obj, 'owner'):
            return request.user and request.user.is_authenticated and obj.owner == request.user
        elif hasattr(obj, 'project'):
            return request.user and request.user.is_authenticated and obj.project.owner == request.user
        return False


class IsProjectMemberOrOwner(permissions.BasePermission):
    """
    Permission class controlling visibility of project members:
    - Public project members can be viewed by anyone.
    - Private project members can ONLY be viewed by project owner or existing project members.
    """

    def has_object_permission(self, request, view, obj):
        # obj is Project
        if obj.visibility == 'public':
            return True

        if not (request.user and request.user.is_authenticated):
            return False

        if obj.owner == request.user:
            return True

        return obj.memberships.filter(user=request.user).exists()
