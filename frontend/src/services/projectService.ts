import { api } from '../lib/api';

// Shared Project type
export interface Project {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  members?: UserMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserMember {
  _id: string;
  name: string;
  email: string;
  role?: string;
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

export const updateProject = async (id: string, updates: Partial<{ name: string; description: string; members?: string[]; isActive?: boolean; }>): Promise<Project> => {
  const response = await api.put(`/projects/${id}`, updates);
  return response.data;
};

export const deactivateProject = async (id: string): Promise<Project> => {
  // Soft delete via isActive flag
  const response = await api.patch(`/projects/${id}`, { isActive: false });
  return response.data;
};

// Fetch list of available team members for project assignment
export const getTeamMembers = async (): Promise<UserMember[]> => {
  const response = await api.get('/auth/team-members');
  return response.data;
};
