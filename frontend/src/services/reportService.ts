import { api } from '../lib/api';

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
};
