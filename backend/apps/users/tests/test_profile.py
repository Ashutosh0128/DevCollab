from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.users.models import Skill

User = get_user_model()


class UserProfileTests(APITestCase):

    def setUp(self):
        self.profile_url = reverse('user-profile-update')
        self.me_url = reverse('auth-me')
        self.skills_list_url = reverse('user-skills-list')

        self.user = User.objects.create_user(
            username="siddhi_profile",
            email="siddhi_profile@example.com",
            password="SecurePassword123!",
            first_name="Siddhi",
            last_name="Thale",
        )
        self.other_user = User.objects.create_user(
            username="other_dev",
            email="other@example.com",
            password="SecurePassword123!",
        )

    def test_update_profile_me_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "job_title": "Senior Full Stack Engineer",
            "experience_level": "senior",
            "bio": "Building AI developer collaboration tools.",
            "location": "Mumbai, India",
            "github_url": "https://github.com/Ashutosh0128",
            "skills": ["Python", "Django", "React"]
        }
        response = self.client.patch(self.me_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['job_title'], "Senior Full Stack Engineer")
        self.assertEqual(response.data['experience_level'], "senior")
        self.assertEqual(len(response.data['skills']), 3)

    def test_update_profile_unauthenticated(self):
        payload = {"job_title": "Hacker"}
        response = self.client.patch(self.me_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_urls_validation(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "github_url": "invalid-url-without-http",
        }
        response = self.client.patch(self.me_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('github_url', response.data)

    def test_skills_api_case_insensitive_add_and_list(self):
        self.client.force_authenticate(user=self.user)
        
        # Pre-create "Python" skill
        Skill.objects.create(name="Python")

        # Add "python" via API (case-insensitive match)
        response = self.client.post(self.skills_list_url, {"name": "python"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Python")

        # Verify only 1 global Skill exists
        self.assertEqual(Skill.objects.filter(name__iexact="python").count(), 1)

        # Retrieve user skills
        get_response = self.client.get(self.skills_list_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_response.data), 1)

    def test_delete_skill_detaches_only_from_user(self):
        skill = Skill.objects.create(name="PostgreSQL")
        self.user.skills.add(skill)
        self.other_user.skills.add(skill)

        self.client.force_authenticate(user=self.user)
        detail_url = reverse('user-skill-detail', kwargs={'pk': skill.pk})
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.user.skills.filter(pk=skill.pk).exists())
        
        # Verify global Skill and other_user relationship persist
        self.assertTrue(Skill.objects.filter(pk=skill.pk).exists())
        self.assertTrue(self.other_user.skills.filter(pk=skill.pk).exists())
