from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Skill

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ('id', 'name', 'slug')
        read_only_fields = ('id', 'slug')


class UserSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'bio',
            'location',
            'github_url',
            'linkedin_url',
            'portfolio_url',
            'job_title',
            'experience_level',
            'preferred_role',
            'availability',
            'skills',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    tokens = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'tokens')

    def validate_email(self, value):
        norm_email = value.lower().strip()
        if User.objects.filter(email=norm_email).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return norm_email

    def validate_username(self, value):
        norm_username = value.strip()
        if User.objects.filter(username__iexact=norm_username).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return norm_username

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email_or_username = attrs.get('email', '').strip()
        password = attrs.get('password', '')

        user = None
        # Allow logging in with email or username
        if '@' in email_or_username:
            try:
                user_obj = User.objects.get(email__iexact=email_or_username)
                user = authenticate(username=user_obj.email, password=password)
            except User.DoesNotExist:
                user = None
        else:
            try:
                user_obj = User.objects.get(username__iexact=email_or_username)
                user = authenticate(username=user_obj.email, password=password)
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError({"detail": "Invalid email/username or password."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        refresh = RefreshToken.for_user(user)

        return {
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    skills = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        write_only=True,
        help_text="List of skill names e.g. ['Python', 'React', 'PostgreSQL']"
    )

    class Meta:
        model = User
        fields = (
            'first_name',
            'last_name',
            'avatar',
            'bio',
            'location',
            'github_url',
            'linkedin_url',
            'portfolio_url',
            'job_title',
            'experience_level',
            'preferred_role',
            'availability',
            'skills',
        )

    def validate_github_url(self, value):
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Enter a valid URL starting with http:// or https://")
        return value

    def validate_linkedin_url(self, value):
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Enter a valid URL starting with http:// or https://")
        return value

    def validate_portfolio_url(self, value):
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Enter a valid URL starting with http:// or https://")
        return value

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills_data is not None:
            skill_objs = []
            for name in skills_data:
                clean_name = name.strip()
                if clean_name:
                    skill_obj, _ = Skill.objects.get_or_create(
                        name__iexact=clean_name,
                        defaults={'name': clean_name}
                    )
                    skill_objs.append(skill_obj)
            instance.skills.set(skill_objs)

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
