from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.collaboration.models import CollaborationRequest, ProjectMembership

User = get_user_model()


class CollaborationTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="proj_owner",
            email="owner@example.com",
            password="SecurePassword123!",
            first_name="Project",
            last_name="Owner"
        )
        self.user_b = User.objects.create_user(
            username="dev_b",
            email="dev_b@example.com",
            password="SecurePassword123!",
            first_name="Dev",
            last_name="B"
        )
        self.user_c = User.objects.create_user(
            username="dev_c",
            email="dev_c@example.com",
            password="SecurePassword123!",
            first_name="Dev",
            last_name="C"
        )

        self.public_project = Project.objects.create(
            owner=self.owner,
            title="Public Open Source App",
            description="Collaborative public project.",
            visibility="public"
        )

        self.private_project = Project.objects.create(
            owner=self.owner,
            title="Private Stealth Project",
            description="Secret internal project.",
            visibility="private"
        )

        self.create_request_url = reverse('collaboration-request-create')

    def test_authenticated_user_can_create_request(self):
        self.client.force_authenticate(user=self.user_b)
        payload = {"project": self.public_project.id, "message": "I'd love to help with frontend!"}
        response = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['requester']['username'], 'dev_b')

    def test_anonymous_user_cannot_create_request(self):
        payload = {"project": self.public_project.id, "message": "Anon request"}
        response = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_request_own_project(self):
        self.client.force_authenticate(user=self.owner)
        payload = {"project": self.public_project.id, "message": "Requesting my own project"}
        response = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_request_private_project(self):
        self.client.force_authenticate(user=self.user_b)
        payload = {"project": self.private_project.id, "message": "Requesting private project"}
        response = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_create_duplicate_pending_request(self):
        self.client.force_authenticate(user=self.user_b)
        payload = {"project": self.public_project.id, "message": "First request"}
        res1 = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Duplicate pending attempt
        res2 = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejected_request_can_be_submitted_again(self):
        req = CollaborationRequest.objects.create(
            project=self.public_project,
            requester=self.user_b,
            message="Old request",
            status="rejected"
        )
        self.client.force_authenticate(user=self.user_b)
        payload = {"project": self.public_project.id, "message": "New attempt after rejection"}
        response = self.client.post(self.create_request_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

    def test_owner_can_view_incoming_requests_and_non_owner_forbidden(self):
        CollaborationRequest.objects.create(project=self.public_project, requester=self.user_b, message="Hi")
        incoming_url = reverse('collaboration-project-requests', kwargs={'project_id': self.public_project.id})

        # Non-owner fails
        self.client.force_authenticate(user=self.user_c)
        bad_res = self.client.get(incoming_url)
        self.assertEqual(bad_res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner succeeds
        self.client.force_authenticate(user=self.owner)
        ok_res = self.client.get(incoming_url)
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(ok_res.data), 1)

    def test_owner_accepts_request_creates_membership(self):
        req = CollaborationRequest.objects.create(project=self.public_project, requester=self.user_b, message="Hi")
        accept_url = reverse('collaboration-request-accept', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(accept_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'accepted')

        # Verify membership creation
        self.assertTrue(ProjectMembership.objects.filter(project=self.public_project, user=self.user_b).exists())

    def test_cannot_accept_already_accepted_or_rejected_request(self):
        req = CollaborationRequest.objects.create(project=self.public_project, requester=self.user_b, status="accepted")
        accept_url = reverse('collaboration-request-accept', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(accept_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_rejects_request_does_not_create_membership(self):
        req = CollaborationRequest.objects.create(project=self.public_project, requester=self.user_b, message="Hi")
        reject_url = reverse('collaboration-request-reject', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(reject_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')

        # Verify no membership created
        self.assertFalse(ProjectMembership.objects.filter(project=self.public_project, user=self.user_b).exists())

    def test_member_can_leave_project(self):
        ProjectMembership.objects.create(project=self.public_project, user=self.user_b)
        leave_url = reverse('collaboration-project-leave', kwargs={'project_id': self.public_project.id})

        self.client.force_authenticate(user=self.user_b)
        response = self.client.delete(leave_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ProjectMembership.objects.filter(project=self.public_project, user=self.user_b).exists())

    def test_owner_can_remove_member_and_non_owner_forbidden(self):
        ProjectMembership.objects.create(project=self.public_project, user=self.user_b)
        remove_url = reverse('collaboration-project-remove-member', kwargs={
            'project_id': self.public_project.id,
            'user_id': self.user_b.id
        })

        # Non-owner fails
        self.client.force_authenticate(user=self.user_c)
        bad_res = self.client.delete(remove_url)
        self.assertEqual(bad_res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner succeeds
        self.client.force_authenticate(user=self.owner)
        ok_res = self.client.delete(remove_url)
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        self.assertFalse(ProjectMembership.objects.filter(project=self.public_project, user=self.user_b).exists())

    def test_owner_cannot_remove_self(self):
        remove_url = reverse('collaboration-project-remove-member', kwargs={
            'project_id': self.public_project.id,
            'user_id': self.owner.id
        })
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_private_project_members_restricted(self):
        ProjectMembership.objects.create(project=self.private_project, user=self.user_b)
        members_url = reverse('collaboration-project-members', kwargs={'project_id': self.private_project.id})

        # Anonymous fails
        self.assertEqual(self.client.get(members_url).status_code, status.HTTP_401_UNAUTHORIZED)

        # Non-member authenticated user fails
        self.client.force_authenticate(user=self.user_c)
        self.assertEqual(self.client.get(members_url).status_code, status.HTTP_403_FORBIDDEN)

        # Member succeeds
        self.client.force_authenticate(user=self.user_b)
        res_member = self.client.get(members_url)
        self.assertEqual(res_member.status_code, status.HTTP_200_OK)

        # Owner succeeds
        self.client.force_authenticate(user=self.owner)
        res_owner = self.client.get(members_url)
        self.assertEqual(res_owner.status_code, status.HTTP_200_OK)
