from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ProjectMatchView,
    ProjectRecommendedDevelopersView,
    RecommendedProjectsView,
    ProjectAnalyticsOverviewView,
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('projects/recommended/', RecommendedProjectsView.as_view(), name='projects-recommended'),
    path('projects/<int:pk>/match/', ProjectMatchView.as_view(), name='project-match'),
    path('projects/<int:project_id>/recommended-developers/', ProjectRecommendedDevelopersView.as_view(), name='project-recommended-developers'),
    path('projects/<int:project_id>/analytics/overview/', ProjectAnalyticsOverviewView.as_view(), name='project-analytics-overview'),
    path('v1/projects/<int:project_id>/analytics/overview/', ProjectAnalyticsOverviewView.as_view(), name='project-analytics-overview-v1'),
    path('', include(router.urls)),
]
