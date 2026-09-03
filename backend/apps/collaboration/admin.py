from django.contrib import admin
from .models import CollaborationRequest, ProjectMembership


@admin.register(CollaborationRequest)
class CollaborationRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'requester', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('project__title', 'requester__username', 'requester__email', 'message')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'user', 'joined_at')
    list_filter = ('joined_at',)
    search_fields = ('project__title', 'user__username', 'user__email')
    readonly_fields = ('joined_at',)
