import apiClient from './client';
import type {
  Project,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  ProjectFilters,
  PaginatedProjectsResponse,
} from '../types/project';
import type { Skill } from '../types/auth';

export const getProjects = async (params?: ProjectFilters): Promise<PaginatedProjectsResponse> => {
  const response = await apiClient.get<PaginatedProjectsResponse>('/projects/', { params });
  return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
  const response = await apiClient.get<Project>(`/projects/${id}/`);
  return response.data;
};

export const createProject = async (data: ProjectCreatePayload): Promise<Project> => {
  const response = await apiClient.post<Project>('/projects/', data);
  return response.data;
};

export const updateProject = async (id: number, data: ProjectUpdatePayload): Promise<Project> => {
  const response = await apiClient.patch<Project>(`/projects/${id}/`, data);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await apiClient.delete(`/projects/${id}/`);
};

export const getGlobalSkills = async (): Promise<Skill[]> => {
  const response = await apiClient.get<Skill[]>('/skills/');
  return response.data;
};
