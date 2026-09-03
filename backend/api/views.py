from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from datetime import datetime, timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Basic API health check endpoint.
    Verifies that the API service is active and checks database connection.
    """
    db_status = "ok"
    db_engine = connection.vendor
    
    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return Response({
        "status": "ok",
        "service": "DevCollab API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "vendor": db_engine,
            "status": db_status,
        }
    })
