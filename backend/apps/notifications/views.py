from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import Notification
from .serializers import NotificationSerializer


class StandardNotificationPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardNotificationPagination

    @extend_schema(
        parameters=[
            OpenApiParameter('unread', bool, description='Filter unread notifications only'),
            OpenApiParameter('page', int, description='Page number'),
        ],
        responses={200: NotificationSerializer(many=True)},
        description="Retrieve list of notifications for the authenticated user."
    )
    def get(self, request):
        queryset = Notification.objects.filter(recipient=request.user).select_related('actor', 'recipient')
        
        unread = request.query_params.get('unread', '').lower() in ('true', '1', 'yes')
        if unread:
            queryset = queryset.filter(is_read=False)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="Count of unread notifications")},
        description="Retrieve unread notification count for the authenticated user."
    )
    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"count": count}, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: NotificationSerializer, 404: OpenApiResponse(description="Notification not found")},
        description="Mark a single notification as read (Recipient only)."
    )
    def patch(self, request, pk):
        notif = get_object_or_404(Notification.objects.select_related('actor', 'recipient'), pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="All notifications marked as read")},
        description="Mark all notifications for the authenticated user as read."
    )
    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OpenApiResponse(description="Notification deleted"), 404: OpenApiResponse(description="Notification not found")},
        description="Delete a notification (Recipient only)."
    )
    def delete(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.delete()
        return Response({"detail": "Notification deleted."}, status=status.HTTP_200_OK)
