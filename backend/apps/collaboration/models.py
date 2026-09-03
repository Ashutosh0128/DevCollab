from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class CollaborationRequest(BaseModel):
    """
    Model representing a developer's request to join a public collaboration project.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='collaboration_requests',
        help_text="Target project"
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_collaboration_requests',
        help_text="User requesting to join"
    )
    message = models.TextField(
        max_length=500,
        blank=True,
        default='',
        help_text="Optional note explaining experience or contribution interest"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'requester'],
                condition=models.Q(status='pending'),
                name='unique_pending_collaboration_request'
            )
        ]

    def __str__(self):
        return f"Request by {self.requester.username} for {self.project.title} ({self.status})"


class ProjectMembership(models.Model):
    """
    Model representing accepted developer members of a project (excluding the owner).
    """
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='memberships',
        help_text="Project joined"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships',
        help_text="Project member user"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-joined_at']
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'user'],
                name='unique_project_membership'
            )
        ]

    def __str__(self):
        return f"{self.user.username} in {self.project.title}"
