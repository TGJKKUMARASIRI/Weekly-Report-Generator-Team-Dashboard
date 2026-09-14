import { api } from '../lib/api';

// Shared Project type
export interface Project {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// Service helpers for Project management
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data;
};

export const getAllProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects/all');
  return response.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: { name: string; description?: string }): Promise<Project> => {
  const response = await api.post('/projects', project);
  return response.data;
};

export const updateProject = async (id: string, updates: Partial<{ name: string; description: string }>): Promise<Project> => {
  const response = await api.put(`/projects/${id}`, updates);
  return response.data;
};

export const deactivateProject = async (id: string): Promise<Project> => {
  // Soft delete via isActive flag
  const response = await api.patch(`/projects/${id}`, { isActive: false });
  return response.data;
};
