import apiClient from './client';
import type { ProjectAnalyticsOverview } from '../types/analytics';

export const getProjectAnalyticsOverview = async (
  projectId: number
): Promise<ProjectAnalyticsOverview> => {
  const response = await apiClient.get<ProjectAnalyticsOverview>(
    `/projects/${projectId}/analytics/overview/`
  );
  return response.data;
};
