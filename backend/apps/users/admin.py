from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Skill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'username', 'email', 'full_name', 'job_title', 'experience_level', 'availability', 'is_staff')
    list_filter = ('experience_level', 'availability', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'job_title')
    filter_horizontal = ('skills', 'groups', 'user_permissions')

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Developer Profile & Social Links', {
            'fields': (
                'avatar',
                'bio',
                'location',
                'job_title',
                'experience_level',
                'preferred_role',
                'availability',
                'github_url',
                'linkedin_url',
                'portfolio_url',
                'skills',
            )
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Developer Profile Info', {
            'fields': ('email', 'first_name', 'last_name', 'job_title', 'experience_level'),
        }),
    )
