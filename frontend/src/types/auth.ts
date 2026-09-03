export interface Skill {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string;
  bio: string;
  location: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  job_title: string;
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'principal' | string;
  preferred_role: string;
  availability: 'available' | 'busy' | 'not_available' | string;
  skills: Skill[];
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenResponse;
}

export interface LoginRequest {
  email: string; // email or username
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  job_title?: string;
  experience_level?: string;
  preferred_role?: string;
  availability?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  skills?: string[];
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export type ApiErrorResponse = Record<string, string[] | string | Record<string, string[]>>;
