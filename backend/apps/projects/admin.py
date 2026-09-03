from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner', 'status', 'visibility', 'created_at', 'updated_at')
    list_filter = ('status', 'visibility', 'created_at', 'updated_at')
    search_fields = ('title', 'short_description', 'description', 'owner__username', 'owner__email')
    filter_horizontal = ('skills',)
    readonly_fields = ('created_at', 'updated_at')
