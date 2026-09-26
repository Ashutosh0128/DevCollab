export interface ProjectInfo {
  id: number;
  title: string;
  visibility: string;
  status: string;
}

export interface ProgressMetrics {
  total_tasks: number;
  completed_tasks: number;
  incomplete_tasks: number;
  percentage: number;
}

export interface TaskStatusDistribution {
  todo: number;
  in_progress: number;
  completed: number;
}

export interface ContributorStats {
  user_id: number;
  name: string;
  username: string;
  avatar: string;
  job_title: string;
  role: string;
  tasks_assigned: number;
  tasks_completed: number;
  completion_percentage: number;
}

export interface ProjectAnalyticsOverview {
  project: ProjectInfo;
  progress: ProgressMetrics;
  tasks_by_status: TaskStatusDistribution;
  overdue_tasks: number;
  contributors: ContributorStats[];
}
