import os
import json
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class AIMatchExplanationSchema(BaseModel):
    explanation: str = Field(description="2-3 sentence overview explaining candidate alignment with project.")
    recommendations: list[str] = Field(description="Actionable recommendations for developer or project owner.")
    skill_gap_advice: str = Field(description="Advice addressing missing skill requirements if any.")


def get_fallback_explanation(user, project, deterministic_data):
    """
    Provides standard fallback text when AI is disabled, unconfigured, or fails.
    """
    matched = deterministic_data.get("matched_skills", [])
    missing = deterministic_data.get("missing_skills", [])
    score = deterministic_data.get("match_score", 0)

    user_name = user.get_full_name() if hasattr(user, 'get_full_name') and user.get_full_name() else getattr(user, 'username', 'Candidate')
    project_title = getattr(project, 'title', 'Project')

    explanation = f"{user_name} has a {score}% skill match for '{project_title}' with matched skills: {', '.join(matched) if matched else 'None'}."

    if missing:
        skill_advice = f"Developing experience in {', '.join(missing)} will strengthen fit for this project."
        recs = [
            f"Focus on learning or highlighting experience in: {', '.join(missing)}.",
            "Explore collaboration opportunities on open issues."
        ]
    else:
        skill_advice = "Candidate possesses all requested technical skills for this project."
        recs = [
            "Candidate meets all required technical skill criteria.",
            "Schedule an introductory call or discuss project milestones."
        ]

    return {
        "explanation": explanation,
        "recommendations": recs,
        "skill_gap_advice": skill_advice,
        "is_ai_generated": False,
    }


def generate_ai_match_explanation(user, project, deterministic_data):
    """
    Invokes local Ollama API using configured model (default: qwen2.5:3b).
    Receives deterministic match results and constructs context-aware explanation & advice.
    Returns structured dict with explanation, recommendations, skill_gap_advice, and is_ai_generated flag.
    Gracefully falls back to deterministic text if Ollama is disabled, unconfigured, or unreachable.
    """
    ai_provider = os.getenv("AI_PROVIDER", "ollama").lower()
    ai_model = os.getenv("AI_MODEL", "qwen2.5:3b")
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
    ai_enabled = os.getenv("AI_ENABLED", "true").lower() in ("true", "1", "yes")

    if not ai_enabled or ai_provider != "ollama":
        return get_fallback_explanation(user, project, deterministic_data)

    candidate_name = user.get_full_name() or user.username
    candidate_bio = getattr(user, 'bio', '') or 'N/A'
    candidate_title = getattr(user, 'job_title', '') or 'Developer'
    candidate_level = getattr(user, 'experience_level', '') or 'N/A'

    matched_skills = ", ".join(deterministic_data.get("matched_skills", [])) or "None"
    missing_skills = ", ".join(deterministic_data.get("missing_skills", [])) or "None"
    score = deterministic_data.get("match_score", 0)

    system_prompt = (
        "You are an AI technical recruiter for DevCollab. "
        "Analyze the candidate developer and project specifications provided. "
        "Output ONLY valid JSON with keys: explanation (string, 2-3 sentences), "
        "recommendations (array of strings, 2 advice points), and "
        "skill_gap_advice (string, constructive feedback on missing skills or full match confirmation). "
        "DO NOT calculate or modify the numeric match score. Rely strictly on the provided score and skill overlap."
    )

    user_prompt = (
        f"Candidate Name: {candidate_name}\n"
        f"Job Title: {candidate_title} ({candidate_level})\n"
        f"Bio: {candidate_bio}\n\n"
        f"Project Title: {project.title}\n"
        f"Project Short Description: {project.short_description}\n"
        f"Project Status: {project.status}\n\n"
        f"Authoritative Deterministic Match Score: {score}%\n"
        f"Matched Skills: {matched_skills}\n"
        f"Missing Skills: {missing_skills}\n"
    )

    try:
        import urllib.request
        import urllib.error

        payload = {
            "model": ai_model,
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False,
            "format": "json"
        }
        json_payload = json.dumps(payload).encode('utf-8')

        req = urllib.request.Request(
            f"{ollama_host}/api/generate",
            data=json_payload,
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode('utf-8'))
                raw_response = body.get("response", "")
                parsed_json = json.loads(raw_response)

                return {
                    "explanation": parsed_json.get("explanation", get_fallback_explanation(user, project, deterministic_data)["explanation"]),
                    "recommendations": parsed_json.get("recommendations", get_fallback_explanation(user, project, deterministic_data)["recommendations"]),
                    "skill_gap_advice": parsed_json.get("skill_gap_advice", get_fallback_explanation(user, project, deterministic_data)["skill_gap_advice"]),
                    "is_ai_generated": True,
                }

        return get_fallback_explanation(user, project, deterministic_data)

    except Exception as e:
        logger.warning(f"Ollama local AI match explanation failed ({e}). Using deterministic fallback.")
        return get_fallback_explanation(user, project, deterministic_data)
