from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.projects.models import Project, Task
from apps.collaboration.models import ProjectMembership

User = get_user_model()


class ProjectAnalyticsTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="analytics_owner",
            email="owner@analytics.com",
            password="SecurePassword123!",
            first_name="Project",
            last_name="Owner"
        )
        self.member = User.objects.create_user(
            username="analytics_member",
            email="member@analytics.com",
            password="SecurePassword123!",
            first_name="Project",
            last_name="Member"
        )
        self.non_member = User.objects.create_user(
            username="analytics_stranger",
            email="stranger@analytics.com",
            password="SecurePassword123!",
            first_name="Project",
            last_name="Stranger"
        )

        # Public Project with Tasks
        self.public_project = Project.objects.create(
            owner=self.owner,
            title="Public Analytics Project",
            description="Testing project analytics feature",
            visibility="public",
            status="in_progress"
        )
        ProjectMembership.objects.create(project=self.public_project, user=self.member)

        # Private Project
        self.private_project = Project.objects.create(
            owner=self.owner,
            title="Stealth Analytics Project",
            description="Private project analytics testing",
            visibility="private",
            status="planning"
        )

    def test_01_authenticated_project_member_can_access_analytics(self):
        self.client.force_authenticate(user=self.member)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["project"]["id"], self.public_project.id)

    def test_02_unauthenticated_user_cannot_access_analytics(self):
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_03_unauthorized_non_member_cannot_access_private_project_analytics(self):
        self.client.force_authenticate(user=self.non_member)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.private_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_04_correct_total_task_count(self):
        Task.objects.create(project=self.public_project, title="Task 1", status="todo")
        Task.objects.create(project=self.public_project, title="Task 2", status="in_progress")
        Task.objects.create(project=self.public_project, title="Task 3", status="completed")

        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["progress"]["total_tasks"], 3)

    def test_05_correct_completed_task_count(self):
        Task.objects.create(project=self.public_project, title="Task 1", status="completed")
        Task.objects.create(project=self.public_project, title="Task 2", status="completed")
        Task.objects.create(project=self.public_project, title="Task 3", status="todo")

        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["progress"]["completed_tasks"], 2)
        self.assertEqual(response.data["progress"]["incomplete_tasks"], 1)

    def test_06_correct_progress_percentage(self):
        # 3 out of 4 completed = 75%
        Task.objects.create(project=self.public_project, title="Task 1", status="completed")
        Task.objects.create(project=self.public_project, title="Task 2", status="completed")
        Task.objects.create(project=self.public_project, title="Task 3", status="completed")
        Task.objects.create(project=self.public_project, title="Task 4", status="todo")

        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["progress"]["percentage"], 75)

    def test_07_correct_task_status_distribution(self):
        Task.objects.create(project=self.public_project, title="Task 1", status="todo")
        Task.objects.create(project=self.public_project, title="Task 2", status="todo")
        Task.objects.create(project=self.public_project, title="Task 3", status="in_progress")
        Task.objects.create(project=self.public_project, title="Task 4", status="completed")

        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["tasks_by_status"]["todo"], 2)
        self.assertEqual(response.data["tasks_by_status"]["in_progress"], 1)
        self.assertEqual(response.data["tasks_by_status"]["completed"], 1)

    def test_08_correct_contributor_statistics(self):
        # Assign 2 tasks to member (1 completed, 1 in_progress) -> 50%
        Task.objects.create(project=self.public_project, title="T1", status="completed", assignee=self.member)
        Task.objects.create(project=self.public_project, title="T2", status="in_progress", assignee=self.member)

        # Assign 1 task to owner (1 completed) -> 100%
        Task.objects.create(project=self.public_project, title="T3", status="completed", assignee=self.owner)

        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        contributors = {c["username"]: c for c in response.data["contributors"]}
        self.assertIn("analytics_member", contributors)
        self.assertEqual(contributors["analytics_member"]["tasks_assigned"], 2)
        self.assertEqual(contributors["analytics_member"]["tasks_completed"], 1)
        self.assertEqual(contributors["analytics_member"]["completion_percentage"], 50)

        self.assertIn("analytics_owner", contributors)
        self.assertEqual(contributors["analytics_owner"]["tasks_assigned"], 1)
        self.assertEqual(contributors["analytics_owner"]["tasks_completed"], 1)
        self.assertEqual(contributors["analytics_owner"]["completion_percentage"], 100)

    def test_09_empty_project_analytics_work_correctly(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["progress"]["total_tasks"], 0)
        self.assertEqual(response.data["progress"]["completed_tasks"], 0)
        self.assertEqual(response.data["progress"]["percentage"], 0)
        self.assertEqual(response.data["overdue_tasks"], 0)

    def test_10_api_response_structure_is_correct(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('project-analytics-overview', kwargs={'project_id': self.public_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn("project", data)
        self.assertIn("progress", data)
        self.assertIn("tasks_by_status", data)
        self.assertIn("overdue_tasks", data)
        self.assertIn("contributors", data)

        self.assertIn("id", data["project"])
        self.assertIn("title", data["project"])
        self.assertIn("total_tasks", data["progress"])
        self.assertIn("completed_tasks", data["progress"])
        self.assertIn("incomplete_tasks", data["progress"])
        self.assertIn("percentage", data["progress"])

        self.assertIn("todo", data["tasks_by_status"])
        self.assertIn("in_progress", data["tasks_by_status"])
        self.assertIn("completed", data["tasks_by_status"])
