from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from datetime import datetime, timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Canonical health check endpoint for Docker container and load balancer health probes.
    Returns HTTP 200 OK when service and database are operational.
    Returns HTTP 503 Service Unavailable if database is unreachable.
    """
    try:
        connection.ensure_connection()
        return Response({
            "status": "ok",
            "service": "DevCollab API",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": {
                "vendor": connection.vendor,
                "status": "ok",
            }
        }, status=status.HTTP_200_OK)
    except Exception:
        return Response({
            "status": "error",
            "service": "DevCollab API",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": {
                "status": "unreachable",
            }
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

