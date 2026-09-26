from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from api.views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check endpoints
    path('api/health/', health_check, name='health-check-canonical'),
    path('api/v1/health/', health_check, name='health-check-v1'),

    # API endpoints
    path('api/v1/', include('api.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.projects.urls')),
    path('api/', include('apps.collaboration.urls')),
    path('api/', include('apps.notifications.urls')),

    # OpenAPI Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
