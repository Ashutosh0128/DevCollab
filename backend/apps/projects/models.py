from django.db import models
from django.conf import settings
from apps.core.models import BaseModel
from apps.users.models import Skill


class Project(BaseModel):
    """
    Project model representing collaboration projects created by developers.
    """
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    ]

    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text="Project creator / owner"
    )
    title = models.CharField(max_length=200, help_text="Project title")
    short_description = models.CharField(max_length=300, blank=True, default='', help_text="Brief tagline or summary")
    description = models.TextField(help_text="Detailed project requirements, goal, and architecture")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')

    cover_image = models.URLField(max_length=500, blank=True, default='', help_text="Optional cover image URL")
    github_url = models.URLField(max_length=255, blank=True, default='')
    demo_url = models.URLField(max_length=255, blank=True, default='')

    skills = models.ManyToManyField(Skill, related_name='projects', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (by {self.owner.username})"


class Task(BaseModel):
    """
    Model representing project tasks assigned to developers.
    """
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text="Project this task belongs to"
    )
    title = models.CharField(max_length=200, help_text="Task title")
    description = models.TextField(blank=True, default='', help_text="Detailed task description")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        help_text="Developer assigned to this task"
    )
    due_date = models.DateTimeField(null=True, blank=True, help_text="Optional task due date")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when task was marked completed")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status}) - {self.project.title}"

