import apiClient from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  TokenResponse,
  Skill,
} from '../types/auth';

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register/', data);
  return response.data;
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login/', data);
  return response.data;
};

export const logoutUser = async (refresh: string): Promise<void> => {
  await apiClient.post('/auth/logout/', { refresh });
};

export const refreshAccessToken = async (refresh: string): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/token/refresh/', { refresh });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me/');
  return response.data;
};

export const updateProfile = async (data: ProfileUpdateRequest): Promise<User> => {
  const response = await apiClient.patch<User>('/auth/me/', data);
  return response.data;
};

export const getUserSkills = async (): Promise<Skill[]> => {
  const response = await apiClient.get<Skill[]>('/auth/skills/');
  return response.data;
};

export const addSkill = async (name: string): Promise<Skill> => {
  const response = await apiClient.post<Skill>('/auth/skills/', { name });
  return response.data;
};

export const removeSkill = async (id: number): Promise<void> => {
  await apiClient.delete(`/auth/skills/${id}/`);
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.post('/auth/change-password/', data);
};
