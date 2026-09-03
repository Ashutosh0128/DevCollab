from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.users.models import Skill

User = get_user_model()


class UserProfileTests(APITestCase):

    def setUp(self):
        self.profile_url = reverse('user-profile-update')
        self.user = User.objects.create_user(
            username="siddhi_profile",
            email="siddhi_profile@example.com",
            password="SecurePassword123!",
            first_name="Siddhi",
            last_name="Thale",
        )

    def test_update_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "job_title": "Senior Full Stack Engineer",
            "experience_level": "senior",
            "bio": "Building AI developer collaboration tools.",
            "location": "Mumbai, India",
            "github_url": "https://github.com/Ashutosh0128",
            "skills": ["Python", "Django", "React", "TypeScript"]
        }
        response = self.client.patch(self.profile_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['job_title'], "Senior Full Stack Engineer")
        self.assertEqual(response.data['experience_level'], "senior")
        self.assertEqual(len(response.data['skills']), 4)
        
        # Verify normalized Skill models were created
        self.assertTrue(Skill.objects.filter(name="Python").exists())
        self.assertTrue(Skill.objects.filter(name="Django").exists())

    def test_update_profile_unauthenticated(self):
        payload = {"job_title": "Hacker"}
        response = self.client.patch(self.profile_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_urls_validation(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "github_url": "invalid-url-without-http",
        }
        response = self.client.patch(self.profile_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('github_url', response.data)
