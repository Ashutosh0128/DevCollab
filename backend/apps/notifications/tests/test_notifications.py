from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.collaboration.models import CollaborationRequest, ProjectMembership
from apps.notifications.models import Notification

User = get_user_model()


class NotificationTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner_user",
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

        self.project = Project.objects.create(
            owner=self.owner,
            title="Public DevCollab App",
            description="Collaborative project",
            visibility="public"
        )

        self.list_url = reverse('notification-list')
        self.count_url = reverse('notification-unread-count')
        self.mark_all_url = reverse('notification-mark-all-read')

    def test_authenticated_user_can_retrieve_own_notifications(self):
        Notification.objects.create(recipient=self.user_b, actor=self.owner, notification_type='COLLABORATION_ACCEPTED', message="Test 1")
        self.client.force_authenticate(user=self.user_b)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['message'], "Test 1")

    def test_anonymous_user_cannot_retrieve_notifications(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_see_another_users_notifications(self):
        Notification.objects.create(recipient=self.owner, actor=self.user_b, notification_type='COLLABORATION_REQUEST', message="Secret for owner")
        self.client.force_authenticate(user=self.user_b)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_pagination_and_unread_filtering(self):
        # Create 12 notifications for user_b (5 read, 7 unread)
        for i in range(5):
            Notification.objects.create(recipient=self.user_b, actor=self.owner, notification_type='COLLABORATION_ACCEPTED', message=f"Read {i}", is_read=True)
        for i in range(7):
            Notification.objects.create(recipient=self.user_b, actor=self.owner, notification_type='COLLABORATION_ACCEPTED', message=f"Unread {i}", is_read=False)

        self.client.force_authenticate(user=self.user_b)
        
        # Test pagination (page_size = 10)
        res_all = self.client.get(self.list_url)
        self.assertEqual(res_all.data['count'], 12)
        self.assertEqual(len(res_all.data['results']), 10)

        # Test unread filter
        res_unread = self.client.get(f"{self.list_url}?unread=true")
        self.assertEqual(res_unread.data['count'], 7)

    def test_unread_count_endpoint(self):
        Notification.objects.create(recipient=self.user_b, notification_type='COLLABORATION_ACCEPTED', message="Msg 1", is_read=False)
        Notification.objects.create(recipient=self.user_b, notification_type='COLLABORATION_ACCEPTED', message="Msg 2", is_read=True)
        
        self.client.force_authenticate(user=self.user_b)
        response = self.client.get(self.count_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_mark_single_notification_read(self):
        notif = Notification.objects.create(recipient=self.user_b, notification_type='COLLABORATION_ACCEPTED', message="Msg", is_read=False)
        read_url = reverse('notification-mark-read', kwargs={'pk': notif.pk})

        self.client.force_authenticate(user=self.user_b)
        response = self.client.patch(read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])
        
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_user_cannot_mark_another_users_notification_read(self):
        notif = Notification.objects.create(recipient=self.owner, notification_type='COLLABORATION_REQUEST', message="Msg", is_read=False)
        read_url = reverse('notification-mark-read', kwargs={'pk': notif.pk})

        self.client.force_authenticate(user=self.user_b)
        response = self.client.patch(read_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read_affects_only_current_user(self):
        n1 = Notification.objects.create(recipient=self.user_b, notification_type='COLLABORATION_ACCEPTED', message="B 1", is_read=False)
        n2 = Notification.objects.create(recipient=self.owner, notification_type='COLLABORATION_REQUEST', message="Owner 1", is_read=False)

        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(self.mark_all_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        n1.refresh_from_db()
        n2.refresh_from_db()
        self.assertTrue(n1.is_read)
        self.assertFalse(n2.is_read)

    def test_delete_own_notification_and_forbidden_for_others(self):
        n_b = Notification.objects.create(recipient=self.user_b, notification_type='COLLABORATION_ACCEPTED', message="B")
        n_owner = Notification.objects.create(recipient=self.owner, notification_type='COLLABORATION_REQUEST', message="Owner")

        del_b_url = reverse('notification-detail', kwargs={'pk': n_b.pk})
        del_owner_url = reverse('notification-detail', kwargs={'pk': n_owner.pk})

        self.client.force_authenticate(user=self.user_b)

        # Attempt deleting owner's notification -> 404
        res_bad = self.client.delete(del_owner_url)
        self.assertEqual(res_bad.status_code, status.HTTP_404_NOT_FOUND)

        # Delete own notification -> 200
        res_ok = self.client.delete(del_b_url)
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertFalse(Notification.objects.filter(pk=n_b.pk).exists())

    def test_public_api_cannot_create_notifications(self):
        self.client.force_authenticate(user=self.user_b)
        payload = {"recipient": self.owner.id, "message": "Malicious notification"}
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # --- Collaboration Events Tests ---

    def test_event_collaboration_request_creates_owner_notification(self):
        self.client.force_authenticate(user=self.user_b)
        req_url = reverse('collaboration-request-create')
        res = self.client.post(req_url, {"project": self.project.id, "message": "Hi"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        notif = Notification.objects.filter(recipient=self.owner).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'COLLABORATION_REQUEST')
        self.assertIn('Dev B', notif.message)
        self.assertIn('Public DevCollab App', notif.message)

    def test_event_accept_creates_requester_notification(self):
        req = CollaborationRequest.objects.create(project=self.project, requester=self.user_b, message="Hi")
        accept_url = reverse('collaboration-request-accept', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.owner)
        res = self.client.post(accept_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        notif = Notification.objects.filter(recipient=self.user_b).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'COLLABORATION_ACCEPTED')
        self.assertIn('accepted', notif.message)

    def test_event_reject_creates_requester_notification(self):
        req = CollaborationRequest.objects.create(project=self.project, requester=self.user_b, message="Hi")
        reject_url = reverse('collaboration-request-reject', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.owner)
        res = self.client.post(reject_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        notif = Notification.objects.filter(recipient=self.user_b).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'COLLABORATION_REJECTED')
        self.assertIn('rejected', notif.message)

    def test_event_remove_member_creates_removed_member_notification(self):
        ProjectMembership.objects.create(project=self.project, user=self.user_b)
        remove_url = reverse('collaboration-project-remove-member', kwargs={'project_id': self.project.id, 'user_id': self.user_b.id})

        self.client.force_authenticate(user=self.owner)
        res = self.client.delete(remove_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        notif = Notification.objects.filter(recipient=self.user_b).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'MEMBER_REMOVED')
        self.assertIn('removed', notif.message)

    def test_event_member_left_creates_owner_notification(self):
        ProjectMembership.objects.create(project=self.project, user=self.user_b)
        leave_url = reverse('collaboration-project-leave', kwargs={'project_id': self.project.id})

        self.client.force_authenticate(user=self.user_b)
        res = self.client.delete(leave_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        notif = Notification.objects.filter(recipient=self.owner).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'MEMBER_LEFT')
        self.assertIn('left your project', notif.message)
