from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import Skill
from apps.users.serializers import SkillSerializer
from .models import Project

User = get_user_model()


class ProjectOwnerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'job_title', 'avatar')


class ProjectSerializer(serializers.ModelSerializer):
    owner = ProjectOwnerSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = (
            'id',
            'title',
            'short_description',
            'description',
            'status',
            'visibility',
            'cover_image',
            'github_url',
            'demo_url',
            'owner',
            'skills',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    skills = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        required=False
    )

    class Meta:
        model = Project
        fields = (
            'title',
            'short_description',
            'description',
            'status',
            'visibility',
            'cover_image',
            'github_url',
            'demo_url',
            'skills',
        )

    def validate_title(self, value):
        clean_val = value.strip()
        if not clean_val:
            raise serializers.ValidationError("Project title cannot be blank.")
        return clean_val

    def validate_description(self, value):
        clean_val = value.strip()
        if not clean_val:
            raise serializers.ValidationError("Project description cannot be blank.")
        return clean_val

    def validate_github_url(self, value):
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Enter a valid URL starting with http:// or https://")
        return value

    def validate_demo_url(self, value):
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Enter a valid URL starting with http:// or https://")
        return value
