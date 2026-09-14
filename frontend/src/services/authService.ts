import { api } from '../lib/api';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'TEAM_MEMBER' | 'MANAGER';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'TEAM_MEMBER' | 'MANAGER';
  isActive?: boolean;
}

export const authService = {
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Fetch all users (Manager)
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Manager creates a user without switching active sessions
  createUser: async (userData: CreateUserData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  updateUser: async (id: string, updateData: UpdateUserData) => {
    const response = await api.patch(`/auth/users/${id}`, updateData);
    return response.data;
  },
};
