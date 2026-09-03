from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


class NotificationActorSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'job_title', 'avatar')


class NotificationSerializer(serializers.ModelSerializer):
    actor = NotificationActorSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id',
            'actor',
            'notification_type',
            'message',
            'is_read',
            'created_at',
        )
        read_only_fields = ('id', 'actor', 'notification_type', 'message', 'created_at')
