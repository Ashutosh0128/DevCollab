from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class Notification(BaseModel):
    """
    Model representing database-backed activity notifications.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('COLLABORATION_REQUEST', 'Collaboration Request'),
        ('COLLABORATION_ACCEPTED', 'Collaboration Accepted'),
        ('COLLABORATION_REJECTED', 'Collaboration Rejected'),
        ('MEMBER_REMOVED', 'Member Removed'),
        ('MEMBER_LEFT', 'Member Left'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="User receiving the notification"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acted_notifications',
        help_text="User who performed the action"
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPE_CHOICES
    )
    message = models.TextField(help_text="Generated notification text")
    is_read = models.BooleanField(default=False, help_text="Read status")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(
                fields=['recipient', 'is_read', '-created_at'],
                name='notif_recip_read_created_idx'
            )
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"Notif to {self.recipient.username} from {actor_name}: {self.notification_type}"
