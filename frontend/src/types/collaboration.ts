export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface CollaborationUser {
  id: number;
  username: string;
  full_name: string;
  job_title: string;
  avatar: string;
}

export interface CollaborationRequest {
  id: number;
  project: number;
  project_title: string;
  requester: CollaborationUser;
  message: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectMembership {
  id: number;
  user: CollaborationUser;
  joined_at: string;
}

export interface CreateRequestPayload {
  project: number;
  message?: string;
}
