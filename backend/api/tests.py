from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):

    def test_canonical_health_check_endpoint_healthy(self):
        url = reverse('health-check-canonical')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["service"], "DevCollab API")
        self.assertIn("database", response.data)
        self.assertEqual(response.data["database"]["status"], "ok")

    def test_v1_health_check_endpoint_backward_compatibility(self):
        url = reverse('health-check-v1')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")

    @patch("django.db.connection.ensure_connection")
    def test_health_check_endpoint_db_unreachable_returns_503(self, mock_ensure_connection):
        mock_ensure_connection.side_effect = Exception("Database connection timeout")
        url = reverse('health-check-canonical')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["database"]["status"], "unreachable")
        # Ensure raw exception string is not exposed
        self.assertNotIn("Database connection timeout", str(response.data))
