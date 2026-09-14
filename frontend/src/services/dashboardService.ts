import { api } from '../lib/api';

export interface ManagerDashboardData {
  summary: {
    totalSubmittedThisWeek: number;
    submissionCompliance: {
      submitted: number;
      pending: number;
      late: number;
      complianceRatePercentage: number;
    };
    needsCorrectionCount: number;
    openBlockersCount: number;
  };
  charts: {
    tasksCompletedTrend: Array<{ date: string; completedTasks: number }>;
    statusByMember: Array<{
      memberName: string;
      APPROVED: number;
      SUBMITTED: number;
      NEEDS_CORRECTION: number;
      DRAFT: number;
    }>;
    workloadByProject: Array<{ projectName: string; taskCount: number; totalHours: number }>;
    timeSpentByTaskType: Array<{ type: string; hours: number }>;
  };
  activityFeed: Array<{
    id: string;
    reportId: string;
    memberName: string;
    projectName: string;
    action: 'APPROVED' | 'NEEDS_CORRECTION' | 'SUBMITTED';
    comment?: string;
    timestamp: string;
  }>;
}

export const dashboardService = {
  getManagerDashboardStats: async (): Promise<ManagerDashboardData> => {
    const response = await api.get<ManagerDashboardData>('/dashboard/manager-stats');
    
    // Defensive fallbacks to prevent crashes if initial backend collections are empty
    const data = response.data;
    return {
      summary: {
        totalSubmittedThisWeek: data?.summary?.totalSubmittedThisWeek ?? 0,
        submissionCompliance: {
          submitted: data?.summary?.submissionCompliance?.submitted ?? 0,
          pending: data?.summary?.submissionCompliance?.pending ?? 0,
          late: data?.summary?.submissionCompliance?.late ?? 0,
          complianceRatePercentage: data?.summary?.submissionCompliance?.complianceRatePercentage ?? 0,
        },
        needsCorrectionCount: data?.summary?.needsCorrectionCount ?? 0,
        openBlockersCount: data?.summary?.openBlockersCount ?? 0,
      },
      charts: {
        tasksCompletedTrend: data?.charts?.tasksCompletedTrend || [],
        statusByMember: data?.charts?.statusByMember || [],
        workloadByProject: data?.charts?.workloadByProject || [],
        timeSpentByTaskType: data?.charts?.timeSpentByTaskType || [],
      },
      activityFeed: data?.activityFeed || [],
    };
  },
};