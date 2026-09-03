from django.urls import path
from .views import (
    CreateRequestView,
    SentRequestsView,
    ProjectIncomingRequestsView,
    AcceptRequestView,
    RejectRequestView,
    ProjectMembersView,
    LeaveProjectView,
    RemoveMemberView,
)

urlpatterns = [
    # Request endpoints
    path('collaboration/requests/', CreateRequestView.as_view(), name='collaboration-request-create'),
    path('collaboration/requests/sent/', SentRequestsView.as_view(), name='collaboration-request-sent'),
    path('collaboration/requests/<int:pk>/accept/', AcceptRequestView.as_view(), name='collaboration-request-accept'),
    path('collaboration/requests/<int:pk>/reject/', RejectRequestView.as_view(), name='collaboration-request-reject'),

    # Project Collaboration endpoints
    path('collaboration/projects/<int:project_id>/requests/', ProjectIncomingRequestsView.as_view(), name='collaboration-project-requests'),
    path('collaboration/projects/<int:project_id>/members/', ProjectMembersView.as_view(), name='collaboration-project-members'),
    path('collaboration/projects/<int:project_id>/members/me/', LeaveProjectView.as_view(), name='collaboration-project-leave'),
    path('collaboration/projects/<int:project_id>/members/<int:user_id>/', RemoveMemberView.as_view(), name='collaboration-project-remove-member'),
]
