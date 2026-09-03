from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from .models import CollaborationRequest, ProjectMembership

User = get_user_model()


class CollaborationUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'job_title', 'avatar')


class CollaborationRequestSerializer(serializers.ModelSerializer):
    requester = CollaborationUserSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = CollaborationRequest
        fields = (
            'id',
            'project',
            'project_title',
            'requester',
            'message',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'requester', 'status', 'created_at', 'updated_at')


class CreateCollaborationRequestSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = CollaborationRequest
        fields = ('project', 'message')

    def validate(self, attrs):
        request_user = self.context['request'].user
        project = attrs['project']

        # Rule 2: Cannot request own project
        if project.owner == request_user:
            raise serializers.ValidationError({"detail": "You cannot submit a collaboration request for your own project."})

        # Rule 3: Only PUBLIC projects can receive requests
        if project.visibility != 'public':
            raise serializers.ValidationError({"detail": "Only public projects can receive collaboration requests."})

        # Rule 4: User is already a member
        if ProjectMembership.objects.filter(project=project, user=request_user).exists():
            raise serializers.ValidationError({"detail": "You are already a member of this project."})

        # Rule 5: User already has an active pending request
        if CollaborationRequest.objects.filter(project=project, requester=request_user, status='pending').exists():
            raise serializers.ValidationError({"detail": "You already have a pending collaboration request for this project."})

        return attrs


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user = CollaborationUserSerializer(read_only=True)

    class Meta:
        model = ProjectMembership
        fields = ('id', 'user', 'joined_at')
        read_only_fields = ('id', 'joined_at')
