from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    UserProfileUpdateView,
    UserSkillsView,
    UserSkillDetailView,
    ChangePasswordView,
)

urlpatterns = [
    # Auth & Current User endpoints (/api/auth/)
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),

    # Skills endpoints (/api/auth/skills/)
    path('auth/skills/', UserSkillsView.as_view(), name='user-skills-list'),
    path('auth/skills/<int:pk>/', UserSkillDetailView.as_view(), name='user-skill-detail'),

    # User profile endpoints (/api/users/)
    path('users/profile/', UserProfileUpdateView.as_view(), name='user-profile-update'),
]
