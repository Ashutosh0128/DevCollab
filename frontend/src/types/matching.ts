import type { User } from './auth';

export interface ProjectMatchResponse {
  project_id: number;
  project_title: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  total_required_skills: number;
  explanation: string;
  recommendations: string[];
  skill_gap_advice: string;
  is_ai_generated: boolean;
}

export interface DeveloperRecommendation {
  developer: User;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation?: string;
  recommendations?: string[];
  is_ai_generated?: boolean;
}
