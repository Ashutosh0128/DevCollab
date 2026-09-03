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
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    has_pending_request = serializers.SerializerMethodField()

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
            'member_count',
            'is_member',
            'has_pending_request',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_member_count(self, obj):
        if hasattr(obj, 'annotated_member_count'):
            return obj.annotated_member_count + 1
        return obj.memberships.count() + 1

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if obj.owner_id == request.user.id:
            return True
        return obj.memberships.filter(user_id=request.user.id).exists()

    def get_has_pending_request(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if obj.owner_id == request.user.id:
            return False
        from apps.collaboration.models import CollaborationRequest
        return CollaborationRequest.objects.filter(project_id=obj.id, requester_id=request.user.id, status='pending').exists()


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
