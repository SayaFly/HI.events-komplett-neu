import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  revenue: (months = 6) => api.get(`/dashboard/revenue?months=${months}`),
  recentOrders: (limit = 10) => api.get(`/dashboard/recent-orders?limit=${limit}`),
};

// Events
export const eventsApi = {
  list: (params?: Record<string, unknown>) => api.get('/events', { params }),
  get: (id: number) => api.get(`/events/${id}`),
  create: (data: Record<string, unknown>) => api.post('/events', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  publish: (id: number) => api.patch(`/events/${id}/publish`),
  cancel: (id: number) => api.patch(`/events/${id}/cancel`),
};

// Categories
export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: Record<string, unknown>) => api.post('/categories', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Tickets
export const ticketsApi = {
  list: (params?: Record<string, unknown>) => api.get('/tickets', { params }),
  get: (id: number) => api.get(`/tickets/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tickets', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/tickets/${id}`, data),
  delete: (id: number) => api.delete(`/tickets/${id}`),
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  updateStatus: (id: number, data: Record<string, unknown>) =>
    api.patch(`/orders/${id}/status`, data),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

// Users
export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export default api;
