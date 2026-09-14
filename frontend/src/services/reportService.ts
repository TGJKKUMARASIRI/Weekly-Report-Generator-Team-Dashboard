import { api } from '../lib/api';

export interface CrossTeamMemberSummary {
  reportId: string;
  status: 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  weekIdentifier: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
  blockers: Array<{
    _id?: string;
    description: string;
    isKeyBlocker: boolean;
  }>;
  achievements: Array<{
    _id?: string;
    description: string;
    isKeyAchievement: boolean;
  }>;
  tasks: Array<{
    _id?: string;
    taskName: string;
    priority: string;
    status: string;
    spentHours: number;
    actualPercent: number;
  }>;
  nextWeekTasks?: string;
  updatedAt: string;
}

export interface CrossTeamSummaryResponse {
  success: boolean;
  weekIdentifier: string;
  totalSubmittedMembers: number;
  data: CrossTeamMemberSummary[];
}

export const reportService = {
  getReports: async (params?: any) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  getReportById: async (id: string) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  createReport: async (data: any) => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  updateReport: async (id: string, data: any) => {
    const response = await api.put(`/reports/${id}`, data);
    return response.data;
  },

  submitReportReview: async (id: string, data: { action: 'APPROVED' | 'REQUEST_CORRECTION'; comment?: string }) => {
    const response = await api.post(`/reports/${id}/review`, data);
    return response.data;
  },

  getCrossTeamSummary: async (
    weekIdentifier?: string,
    projectId?: string
  ): Promise<CrossTeamSummaryResponse> => {
    const params: Record<string, string> = {};
    if (weekIdentifier) params.weekIdentifier = weekIdentifier;
    if (projectId) params.projectId = projectId;

    const response = await api.get<CrossTeamSummaryResponse>('/reports/cross-team-summary', {
      params,
    });
    return response.data;
  },
};
