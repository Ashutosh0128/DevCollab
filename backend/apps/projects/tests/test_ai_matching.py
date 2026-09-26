import os
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.users.models import Skill
from apps.projects.models import Project
from apps.projects.services.matching import calculate_deterministic_match
from apps.projects.services.ai_matching import generate_ai_match_explanation

User = get_user_model()


class AIMatchingTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner_dev",
            email="owner@example.com",
            password="SecurePassword123!",
            first_name="Project",
            last_name="Owner"
        )
        self.cand_full = User.objects.create_user(
            username="cand_full",
            email="full@example.com",
            password="SecurePassword123!",
            first_name="Full",
            last_name="Match"
        )
        self.cand_partial = User.objects.create_user(
            username="cand_partial",
            email="partial@example.com",
            password="SecurePassword123!",
            first_name="Partial",
            last_name="Match"
        )
        self.cand_none = User.objects.create_user(
            username="cand_none",
            email="none@example.com",
            password="SecurePassword123!",
            first_name="Zero",
            last_name="Match"
        )

        self.skill_python = Skill.objects.create(name="Python")
        self.skill_django = Skill.objects.create(name="Django")
        self.skill_react = Skill.objects.create(name="React")
        self.skill_postgres = Skill.objects.create(name="PostgreSQL")

        self.cand_full.skills.add(self.skill_python, self.skill_django, self.skill_react)
        self.cand_partial.skills.add(self.skill_python)

        self.project = Project.objects.create(
            owner=self.owner,
            title="AI DevCollab Matching Engine",
            short_description="Building smart matching for developers",
            description="Detailed matching engine description.",
            status="in_progress",
            visibility="public"
        )
        self.project.skills.add(self.skill_python, self.skill_django)

        self.private_project = Project.objects.create(
            owner=self.owner,
            title="Stealth Private Project",
            short_description="Private internal tool",
            visibility="private"
        )

    def test_deterministic_match_calculation(self):
        # Full match: cand_full has Python & Django
        det_full = calculate_deterministic_match(self.cand_full, self.project)
        self.assertEqual(det_full["match_score"], 100)
        self.assertEqual(len(det_full["matched_skills"]), 2)
        self.assertEqual(len(det_full["missing_skills"]), 0)

        # Partial match: cand_partial has Python (1 out of 2 = 50%)
        det_partial = calculate_deterministic_match(self.cand_partial, self.project)
        self.assertEqual(det_partial["match_score"], 50)
        self.assertEqual(det_partial["matched_skills"], ["Python"])
        self.assertEqual(det_partial["missing_skills"], ["Django"])

        # Zero match: cand_none has 0 skills (0 out of 2 = 0%)
        det_none = calculate_deterministic_match(self.cand_none, self.project)
        self.assertEqual(det_none["match_score"], 0)
        self.assertEqual(len(det_none["matched_skills"]), 0)

    def test_ai_explanation_fallback_when_unconfigured(self):
        det_partial = calculate_deterministic_match(self.cand_partial, self.project)

        # With AI_ENABLED="false"
        with patch.dict(os.environ, {"AI_ENABLED": "false", "AI_PROVIDER": "ollama"}):
            result = generate_ai_match_explanation(self.cand_partial, self.project, det_partial)
            self.assertFalse(result["is_ai_generated"])
            self.assertIn("Partial Match", result["explanation"])
            self.assertIn("Django", result["skill_gap_advice"])

    @patch("urllib.request.urlopen")
    def test_ai_explanation_with_ollama_api_mock(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = (
            b'{"response": "{\\"explanation\\": \\"Candidate is a solid 50% match for AI DevCollab.\\", \\"recommendations\\": [\\"Focus on Django\\", \\"Build a sample app\\"], \\"skill_gap_advice\\": \\"Learn Django framework basics.\\"}"}'
        )
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        det_partial = calculate_deterministic_match(self.cand_partial, self.project)

        with patch.dict(os.environ, {"AI_ENABLED": "true", "AI_PROVIDER": "ollama", "AI_MODEL": "qwen2.5:3b", "OLLAMA_HOST": "http://localhost:11434"}):
            result = generate_ai_match_explanation(self.cand_partial, self.project, det_partial)
            self.assertTrue(result["is_ai_generated"])
            self.assertEqual(result["explanation"], "Candidate is a solid 50% match for AI DevCollab.")
            self.assertEqual(len(result["recommendations"]), 2)

    def test_project_match_endpoint(self):
        self.client.force_authenticate(user=self.cand_partial)
        match_url = reverse('project-match', kwargs={'pk': self.project.pk})
        response = self.client.get(match_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["project_id"], self.project.id)
        self.assertEqual(response.data["match_score"], 50)
        self.assertIn("explanation", response.data)
        self.assertIn("recommendations", response.data)

    def test_project_match_endpoint_private_project_unauthorized_404(self):
        self.client.force_authenticate(user=self.cand_partial)
        private_match_url = reverse('project-match', kwargs={'pk': self.private_project.pk})
        response = self.client.get(private_match_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_recommended_developers_owner_authorization(self):
        rec_url = reverse('project-recommended-developers', kwargs={'project_id': self.project.id})

        # Non-owner access denied -> 403 Forbidden
        self.client.force_authenticate(user=self.cand_full)
        bad_res = self.client.get(rec_url)
        self.assertEqual(bad_res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner access succeeds -> 200 OK
        self.client.force_authenticate(user=self.owner)
        ok_res = self.client.get(rec_url)
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(ok_res.data) > 0)
        # Top candidate should be cand_full (100% match)
        self.assertEqual(ok_res.data[0]["developer"]["username"], "cand_full")
        self.assertEqual(ok_res.data[0]["match_score"], 100)

    def test_recommended_projects_endpoint(self):
        self.client.force_authenticate(user=self.cand_full)
        url = reverse('projects-recommended')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]["id"], self.project.id)
        self.assertEqual(response.data[0]["match_score"], 100)
