def calculate_deterministic_match(user, project):
    """
    Authoritative deterministic matching engine.
    Calculates match percentage, matched skills, and missing skills strictly from user and project data.
    The LLM must NEVER calculate or override this numeric match score.
    """
    user_skill_objs = list(user.skills.all()) if user and hasattr(user, 'skills') else []
    project_skill_objs = list(project.skills.all()) if project and hasattr(project, 'skills') else []

    user_skills_map = {s.name.strip().lower(): s.name.strip() for s in user_skill_objs}
    project_skills_map = {s.name.strip().lower(): s.name.strip() for s in project_skill_objs}

    matched_skills = []
    missing_skills = []

    for lower_name, original_name in project_skills_map.items():
        if lower_name in user_skills_map:
            matched_skills.append(original_name)
        else:
            missing_skills.append(original_name)

    total_required = len(project_skills_map)
    if total_required > 0:
        match_score = int(round((len(matched_skills) / total_required) * 100))
    else:
        # If project specifies no skill requirements, default to 100% baseline match
        match_score = 100

    return {
        "match_score": match_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "total_required_skills": total_required,
    }
