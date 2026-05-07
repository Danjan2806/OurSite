import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post('/auth/register', data),
};

// Tenants
export const tenantApi = {
  create: (name: string, businessType: string) =>
    apiClient.post('/tenants', { name, businessType }),
  getAll: () => apiClient.get('/tenants'),
  getById: (id: string) => apiClient.get(`/tenants/${id}`),
};

// Sites
export const siteApi = {
  create: (data: { name: string; businessType: string; tenantId: string }) =>
    apiClient.post('/sites', data),
  getAll: () => apiClient.get('/sites'),
  getById: (id: string) => apiClient.get(`/sites/${id}`),
  update: (id: string, data: { name?: string; globalStyles?: string; seoMeta?: string }) =>
    apiClient.put(`/sites/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sites/${id}`),
  publish: (id: string) => apiClient.post(`/sites/${id}/publish`),
  getDashboardStats: () => apiClient.get('/sites/dashboard/stats'),
};

// Blocks
export const blockApi = {
  add: (siteId: string, data: { type: string; position: number; content?: string; styles?: string }) =>
    apiClient.post(`/sites/${siteId}/blocks`, data),
  update: (id: string, data: { content?: string; styles?: string; position?: number; visible?: boolean }) =>
    apiClient.put(`/blocks/${id}`, data),
  delete: (id: string) => apiClient.delete(`/blocks/${id}`),
  reorder: (siteId: string, blockIds: string[]) =>
    apiClient.put(`/sites/${siteId}/blocks/reorder`, { blockIds }),
};

// Templates
export const templateApi = {
  getBlocks: (businessType: string) =>
    apiClient.get(`/templates/blocks/${businessType}`),
  getBusinessTypes: () => apiClient.get('/templates/business-types'),
  getQueries: (businessType: string) =>
    apiClient.get(`/templates/queries/${businessType}`),
};

export default apiClient;
