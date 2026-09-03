from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.users.models import Skill
from apps.projects.models import Project

User = get_user_model()


class ProjectAPITests(APITestCase):

    def setUp(self):
        self.list_url = reverse('project-list')

        self.owner = User.objects.create_user(
            username="owner_user",
            email="owner@example.com",
            password="SecurePassword123!",
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="SecurePassword123!",
        )

        self.skill_python = Skill.objects.create(name="Python")
        self.skill_django = Skill.objects.create(name="Django")
        self.skill_react = Skill.objects.create(name="React")

        self.public_project = Project.objects.create(
            owner=self.owner,
            title="DevCollab Platform",
            short_description="Developer collaboration tool",
            description="Detailed description of DevCollab platform.",
            status="in_progress",
            visibility="public",
            github_url="https://github.com/example/devcollab"
        )
        self.public_project.skills.add(self.skill_python, self.skill_django)

        self.private_project = Project.objects.create(
            owner=self.owner,
            title="Secret Stealth App",
            short_description="Private internal app",
            description="Stealth project description.",
            status="planning",
            visibility="private"
        )

    def test_anonymous_user_cannot_create_project(self):
        payload = {
            "title": "Anon Project",
            "description": "Anon description",
            "status": "planning",
            "visibility": "public"
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_creates_project_owner_automatically_assigned(self):
        self.client.force_authenticate(user=self.owner)
        payload = {
            "title": "Awesome Open Source Project",
            "short_description": "Building cool tools",
            "description": "Comprehensive description of open source project.",
            "status": "planning",
            "visibility": "public",
            "github_url": "https://github.com/example/awesome",
            "skills": [self.skill_python.id, self.skill_react.id]
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['owner']['id'], self.owner.id)
        self.assertEqual(response.data['title'], "Awesome Open Source Project")
        self.assertEqual(len(response.data['skills']), 2)

    def test_create_project_invalid_validations(self):
        self.client.force_authenticate(user=self.owner)

        # Blank title
        res1 = self.client.post(self.list_url, {"title": "   ", "description": "Valid desc"}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', res1.data)

        # Invalid URL
        res2 = self.client.post(self.list_url, {"title": "Valid", "description": "Valid", "github_url": "invalid-url"}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('github_url', res2.data)

        # Invalid skill ID
        res3 = self.client.post(self.list_url, {"title": "Valid", "description": "Valid", "skills": [99999]}, format='json')
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_project_discovery_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain public_project, but NOT private_project
        results = response.data['results']
        project_ids = [p['id'] for p in results]
        self.assertIn(self.public_project.id, project_ids)
        self.assertNotIn(self.private_project.id, project_ids)

    def test_private_project_visible_to_owner_only(self):
        detail_url = reverse('project-detail', kwargs={'pk': self.private_project.pk})

        # Owner can view
        self.client.force_authenticate(user=self.owner)
        owner_res = self.client.get(detail_url)
        self.assertEqual(owner_res.status_code, status.HTTP_200_OK)

        # Other user cannot view (403 Forbidden or 404)
        self.client.force_authenticate(user=self.other_user)
        other_res = self.client.get(detail_url)
        self.assertEqual(other_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_mine_filter_requires_auth_and_returns_owner_projects_only(self):
        # Anonymous fails mine=true
        anon_res = self.client.get(f"{self.list_url}?mine=true")
        self.assertEqual(anon_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Owner receives both public and private projects
        self.client.force_authenticate(user=self.owner)
        owner_res = self.client.get(f"{self.list_url}?mine=true")
        self.assertEqual(owner_res.status_code, status.HTTP_200_OK)
        owner_pids = [p['id'] for p in owner_res.data['results']]
        self.assertIn(self.public_project.id, owner_pids)
        self.assertIn(self.private_project.id, owner_pids)

    def test_search_and_skill_filtering(self):
        # Search by keyword
        search_res = self.client.get(f"{self.list_url}?search=DevCollab")
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_res.data['results']), 1)
        self.assertEqual(search_res.data['results'][0]['id'], self.public_project.id)

        # Filter by skill name (case-insensitive)
        skill_res = self.client.get(f"{self.list_url}?skill=python")
        self.assertEqual(skill_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(skill_res.data['results']), 1)

    def test_owner_can_update_project_and_other_user_forbidden(self):
        detail_url = reverse('project-detail', kwargs={'pk': self.public_project.pk})

        # Other user update fails
        self.client.force_authenticate(user=self.other_user)
        bad_res = self.client.patch(detail_url, {"title": "Hacked Title"}, format='json')
        self.assertEqual(bad_res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner update succeeds
        self.client.force_authenticate(user=self.owner)
        ok_res = self.client.patch(detail_url, {"title": "DevCollab 2.0", "status": "completed"}, format='json')
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        self.assertEqual(ok_res.data['title'], "DevCollab 2.0")
        self.assertEqual(ok_res.data['status'], "completed")

    def test_owner_can_delete_project_and_other_user_forbidden(self):
        detail_url = reverse('project-detail', kwargs={'pk': self.public_project.pk})

        # Other user delete fails
        self.client.force_authenticate(user=self.other_user)
        bad_res = self.client.delete(detail_url)
        self.assertEqual(bad_res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner delete succeeds
        self.client.force_authenticate(user=self.owner)
        ok_res = self.client.delete(detail_url)
        self.assertEqual(ok_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=self.public_project.pk).exists())
