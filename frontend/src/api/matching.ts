import apiClient from './client';
import type { ProjectMatchResponse, DeveloperRecommendation } from '../types/matching';
import type { Project } from '../types/project';

export const getProjectMatch = async (projectId: number): Promise<ProjectMatchResponse> => {
  const response = await apiClient.get<ProjectMatchResponse>(`/projects/${projectId}/match/`);
  return response.data;
};

export const getRecommendedDevelopers = async (projectId: number): Promise<DeveloperRecommendation[]> => {
  const response = await apiClient.get<DeveloperRecommendation[]>(`/projects/${projectId}/recommended-developers/`);
  return response.data;
};

export const getRecommendedProjects = async (): Promise<(Project & { match_score: number; matched_skills: string[]; missing_skills: string[] })[]> => {
  const response = await apiClient.get< (Project & { match_score: number; matched_skills: string[]; missing_skills: string[] })[] >('/projects/recommended/');
  return response.data;
};
