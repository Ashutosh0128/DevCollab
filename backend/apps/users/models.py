from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify


class Skill(models.Model):
    """
    Normalized Skill model for developer technical skills (e.g., Python, React, PostgreSQL).
    """
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class User(AbstractUser):
    """
    Custom User model for DevCollab platform supporting developer profiles,
    social links, experience, and normalized technical skills.
    """
    EXPERIENCE_CHOICES = [
        ('entry', 'Entry Level (0-2 yrs)'),
        ('mid', 'Mid Level (2-5 yrs)'),
        ('senior', 'Senior (5-8 yrs)'),
        ('lead', 'Lead / Staff (8+ yrs)'),
        ('principal', 'Principal / Architect'),
    ]

    AVAILABILITY_CHOICES = [
        ('available', 'Available for Projects'),
        ('busy', 'Busy / Limited Availability'),
        ('not_available', 'Not Available'),
    ]

    # Email & Identity
    email = models.EmailField(unique=True, help_text="Required. Primary email address for login.")
    username = models.CharField(max_length=150, unique=True, help_text="Required. Unique username handle.")

    # Profile Media & Bio
    avatar = models.URLField(max_length=500, blank=True, default='', help_text="URL to avatar image.")
    bio = models.TextField(blank=True, default='', help_text="Short developer bio/description.")
    location = models.CharField(max_length=100, blank=True, default='', help_text="City, Country or Remote.")

    # Developer Specifics
    job_title = models.CharField(max_length=100, blank=True, default='', help_text="e.g. Full Stack Engineer, Frontend Developer.")
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, blank=True, default='mid')
    preferred_role = models.CharField(max_length=100, blank=True, default='', help_text="e.g. Backend Developer, UI/UX Designer.")
    availability = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='available')

    # Social & Portfolio Links
    github_url = models.URLField(max_length=255, blank=True, default='')
    linkedin_url = models.URLField(max_length=255, blank=True, default='')
    portfolio_url = models.URLField(max_length=255, blank=True, default='')

    # Normalized Skills Relationship
    skills = models.ManyToManyField(Skill, related_name='users', blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username
