from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')
        self.logout_url = reverse('auth-logout')
        self.change_password_url = reverse('auth-change-password')

        self.user_data = {
            "username": "siddhi",
            "email": "siddhi@example.com",
            "password": "SecurePassword123!",
            "first_name": "Siddhi",
            "last_name": "Thale",
        }
        self.user = User.objects.create_user(**self.user_data)

    def test_register_success(self):
        new_user_data = {
            "username": "ashutosh",
            "email": "ashutosh@example.com",
            "password": "StrongPassword987!",
            "first_name": "Ashutosh",
            "last_name": "Dev",
        }
        response = self.client.post(self.register_url, new_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], "ashutosh@example.com")

    def test_register_duplicate_email(self):
        duplicate_data = {
            "username": "siddhi_new",
            "email": "siddhi@example.com",
            "password": "SecurePassword123!",
        }
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_duplicate_username(self):
        duplicate_data = {
            "username": "siddhi",
            "email": "new_email@example.com",
            "password": "SecurePassword123!",
        }
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_weak_password(self):
        weak_data = {
            "username": "weakuser",
            "email": "weak@example.com",
            "password": "123",
        }
        response = self.client.post(self.register_url, weak_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_login_valid_credentials_email(self):
        payload = {
            "email": "siddhi@example.com",
            "password": "SecurePassword123!",
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_login_valid_credentials_username(self):
        payload = {
            "email": "siddhi",
            "password": "SecurePassword123!",
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_login_invalid_credentials(self):
        payload = {
            "email": "siddhi@example.com",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_current_user_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['email'], self.user.email)

    def test_get_current_user_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_success(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "old_password": "SecurePassword123!",
            "new_password": "BrandNewPassword999!",
        }
        response = self.client.post(self.change_password_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNewPassword999!"))

    def test_change_password_invalid_old(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "old_password": "IncorrectOldPassword!",
            "new_password": "BrandNewPassword999!",
        }
        response = self.client.post(self.change_password_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_password', response.data)
