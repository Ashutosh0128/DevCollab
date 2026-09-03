export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export type ProjectVisibility = 'public' | 'private';

export interface ProjectSkill {
  id: number;
  name: string;
  slug?: string;
}

export interface ProjectOwner {
  id: number;
  username: string;
  full_name: string;
  job_title: string;
  avatar: string;
}

export interface Project {
  id: number;
  title: string;
  short_description: string;
  description: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  cover_image: string;
  github_url: string;
  demo_url: string;
  owner: ProjectOwner;
  skills: ProjectSkill[];
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  skill?: string;
  mine?: boolean;
  page?: number;
}

export interface ProjectCreatePayload {
  title: string;
  short_description?: string;
  description: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  cover_image?: string;
  github_url?: string;
  demo_url?: string;
  skills?: number[];
}

export interface ProjectUpdatePayload extends Partial<ProjectCreatePayload> {}

export interface PaginatedProjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}
