from rest_framework import permissions


class IsOwnerOrReadOnlyPublic(permissions.BasePermission):
    """
    Custom permission for Project entities:
    - Public projects are readable by anyone (authenticated or anonymous).
    - Private projects are readable ONLY by their owner or accepted members.
    - Modifying/deleting a project requires being the authenticated owner.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            if obj.visibility == 'public':
                return True
            if not (request.user and request.user.is_authenticated):
                return False
            return (obj.owner_id == request.user.id) or obj.memberships.filter(user_id=request.user.id).exists()

        return request.user and request.user.is_authenticated and obj.owner_id == request.user.id
