import { api } from '../lib/api';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'TEAM_MEMBER' | 'MANAGER' | 'ADMIN';
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

  // Fetch all users (Manager / Admin access)
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Manager creates a user without switching active sessions
  createUser: async (userData: CreateUserData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },
};
