import apiClient from './client';
import type {
  Notification,
  UnreadCountResponse,
  PaginatedNotificationsResponse,
} from '../types/notification';

export const getNotifications = async (
  unreadOnly: boolean = false,
  page: number = 1
): Promise<PaginatedNotificationsResponse> => {
  const response = await apiClient.get<PaginatedNotificationsResponse>('/notifications/', {
    params: {
      unread: unreadOnly ? 'true' : undefined,
      page,
    },
  });
  return response.data;
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count/');
  return response.data;
};

export const markNotificationRead = async (id: number): Promise<Notification> => {
  const response = await apiClient.patch<Notification>(`/notifications/${id}/read/`);
  return response.data;
};

export const markAllNotificationsRead = async (): Promise<{ detail: string }> => {
  const response = await apiClient.post<{ detail: string }>('/notifications/mark-all-read/');
  return response.data;
};

export const deleteNotification = async (id: number): Promise<{ detail: string }> => {
  const response = await apiClient.delete<{ detail: string }>(`/notifications/${id}/`);
  return response.data;
};
