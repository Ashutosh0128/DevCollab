import apiClient from './client';
import type {
  CollaborationRequest,
  ProjectMembership,
  CreateRequestPayload,
} from '../types/collaboration';

export const createCollaborationRequest = async (
  data: CreateRequestPayload
): Promise<CollaborationRequest> => {
  const response = await apiClient.post<CollaborationRequest>('/collaboration/requests/', data);
  return response.data;
};

export const getSentRequests = async (): Promise<CollaborationRequest[]> => {
  const response = await apiClient.get<CollaborationRequest[]>('/collaboration/requests/sent/');
  return response.data;
};

export const getProjectRequests = async (
  projectId: number
): Promise<CollaborationRequest[]> => {
  const response = await apiClient.get<CollaborationRequest[]>(
    `/collaboration/projects/${projectId}/requests/`
  );
  return response.data;
};

export const acceptRequest = async (requestId: number): Promise<CollaborationRequest> => {
  const response = await apiClient.post<CollaborationRequest>(
    `/collaboration/requests/${requestId}/accept/`
  );
  return response.data;
};

export const rejectRequest = async (requestId: number): Promise<CollaborationRequest> => {
  const response = await apiClient.post<CollaborationRequest>(
    `/collaboration/requests/${requestId}/reject/`
  );
  return response.data;
};

export const getProjectMembers = async (
  projectId: number
): Promise<ProjectMembership[]> => {
  const response = await apiClient.get<ProjectMembership[]>(
    `/collaboration/projects/${projectId}/members/`
  );
  return response.data;
};

export const leaveProject = async (projectId: number): Promise<void> => {
  await apiClient.delete(`/collaboration/projects/${projectId}/members/me/`);
};

export const removeMember = async (
  projectId: number,
  userId: number
): Promise<void> => {
  await apiClient.delete(`/collaboration/projects/${projectId}/members/${userId}/`);
};
