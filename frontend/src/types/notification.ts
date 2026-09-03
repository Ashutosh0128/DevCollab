export type NotificationType =
  | 'COLLABORATION_REQUEST'
  | 'COLLABORATION_ACCEPTED'
  | 'COLLABORATION_REJECTED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_LEFT';

export interface NotificationActor {
  id: number;
  username: string;
  full_name: string;
  job_title: string;
  avatar: string;
}

export interface Notification {
  id: number;
  actor: NotificationActor | null;
  notification_type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface PaginatedNotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}
