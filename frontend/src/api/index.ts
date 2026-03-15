import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/contexts/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  login:          (data: { email: string; password: string }) => api.post('/auth/login', data),
  register:       (data: object) => api.post('/auth/register', data),
  logout:         () => api.post('/auth/logout'),
  me:             () => api.get('/auth/me'),
  updateProfile:  (data: object) => api.put('/auth/me', data),
  changePassword: (data: object) => api.put('/auth/password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardApi = {
  stats:        () => api.get('/dashboard/stats'),
  revenue:      (period = 30) => api.get(`/dashboard/revenue?period=${period}`),
  recentOrders: () => api.get('/dashboard/recent-orders'),
};

// ── Organizers ────────────────────────────────────────────
export const organizersApi = {
  list:       (params?: object) => api.get('/organizers', { params }),
  get:        (id: number) => api.get(`/organizers/${id}`),
  create:     (data: object) => api.post('/organizers', data),
  update:     (id: number, data: object) => api.put(`/organizers/${id}`, data),
  delete:     (id: number) => api.delete(`/organizers/${id}`),
  stats:      (id: number) => api.get(`/organizers/${id}/stats`),
  addUser:    (id: number, data: object) => api.post(`/organizers/${id}/users`, data),
  removeUser: (id: number, userId: number) => api.delete(`/organizers/${id}/users/${userId}`),
};

// ── Events ────────────────────────────────────────────────
export const eventsApi = {
  list:         (params?: object) => api.get('/events', { params }),
  get:          (id: number) => api.get(`/events/${id}`),
  create:       (orgId: number, data: object) => api.post(`/organizers/${orgId}/events`, data),
  update:       (orgId: number, id: number, data: object) => api.put(`/organizers/${orgId}/events/${id}`, data),
  delete:       (orgId: number, id: number) => api.delete(`/organizers/${orgId}/events/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/events/${id}/status`, { status }),
  stats:        (id: number) => api.get(`/events/${id}/stats`),
  duplicate:    (id: number) => api.post(`/events/${id}/duplicate`),
};

// ── Ticket Types ──────────────────────────────────────────
export const ticketTypesApi = {
  list:   (eventId: number) => api.get(`/events/${eventId}/ticket-types`),
  create: (eventId: number, data: object) => api.post(`/events/${eventId}/ticket-types`, data),
  update: (eventId: number, id: number, data: object) => api.put(`/events/${eventId}/ticket-types/${id}`, data),
  delete: (eventId: number, id: number) => api.delete(`/events/${eventId}/ticket-types/${id}`),
  sort:   (eventId: number, ids: number[]) => api.put(`/events/${eventId}/ticket-types/sort`, { ids }),
};

// ── Promo Codes ───────────────────────────────────────────
export const promoCodesApi = {
  list:   (eventId: number) => api.get(`/events/${eventId}/promo-codes`),
  create: (eventId: number, data: object) => api.post(`/events/${eventId}/promo-codes`, data),
  update: (eventId: number, id: number, data: object) => api.put(`/events/${eventId}/promo-codes/${id}`, data),
  delete: (eventId: number, id: number) => api.delete(`/events/${eventId}/promo-codes/${id}`),
};

// ── Orders ────────────────────────────────────────────────
export const ordersApi = {
  byOrganizer: (orgId: number, params?: object) => api.get(`/organizers/${orgId}/orders`, { params }),
  byEvent:     (eventId: number, params?: object) => api.get(`/events/${eventId}/orders`, { params }),
  get:         (id: number) => api.get(`/orders/${id}`),
  updateStatus:(id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
  refund:      (id: number, data: object) => api.post(`/orders/${id}/refund`, data),
};

// ── Attendees ─────────────────────────────────────────────
export const attendeesApi = {
  byEvent: (eventId: number, params?: object) => api.get(`/events/${eventId}/attendees`, { params }),
  get:     (id: number) => api.get(`/attendees/${id}`),
  update:  (id: number, data: object) => api.put(`/attendees/${id}`, data),
  delete:  (id: number) => api.delete(`/attendees/${id}`),
  export:  (eventId: number) => api.post('/attendees/export', { event_id: eventId }),
};

// ── Check-In ──────────────────────────────────────────────
export const checkInApi = {
  lists:    (eventId: number) => api.get(`/events/${eventId}/check-in-lists`),
  create:   (eventId: number, data: object) => api.post(`/events/${eventId}/check-in-lists`, data),
  get:      (listId: number) => api.get(`/check-in-lists/${listId}`),
  update:   (listId: number, data: object) => api.put(`/check-in-lists/${listId}`, data),
  delete:   (listId: number) => api.delete(`/check-in-lists/${listId}`),
  checkIn:  (ticketNumber: string) => api.post(`/check-in/${ticketNumber}`),
  checkOut: (ticketNumber: string) => api.post(`/check-out/${ticketNumber}`),
};

// ── Venues ────────────────────────────────────────────────
export const venuesApi = {
  list:   (orgId: number) => api.get(`/organizers/${orgId}/venues`),
  create: (orgId: number, data: object) => api.post(`/organizers/${orgId}/venues`, data),
  update: (orgId: number, id: number, data: object) => api.put(`/organizers/${orgId}/venues/${id}`, data),
  delete: (orgId: number, id: number) => api.delete(`/organizers/${orgId}/venues/${id}`),
};

// ── Messages ──────────────────────────────────────────────
export const messagesApi = {
  list:   (eventId: number) => api.get(`/events/${eventId}/messages`),
  create: (eventId: number, data: object) => api.post(`/events/${eventId}/messages`, data),
  get:    (id: number) => api.get(`/messages/${id}`),
  delete: (id: number) => api.delete(`/messages/${id}`),
  send:   (id: number) => api.post(`/messages/${id}/send`),
};

// ── Users (Admin) ──────────────────────────────────────────
export const usersApi = {
  list:       (params?: object) => api.get('/users', { params }),
  get:        (id: number) => api.get(`/users/${id}`),
  create:     (data: object) => api.post('/users', data),
  update:     (id: number, data: object) => api.put(`/users/${id}`, data),
  delete:     (id: number) => api.delete(`/users/${id}`),
  updateRole: (id: number, role: string) => api.put(`/users/${id}/role`, { role }),
};

// ── Categories ────────────────────────────────────────────
export const categoriesApi = {
  list:   () => api.get('/categories'),
  create: (data: object) => api.post('/categories', data),
  update: (id: number, data: object) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// ── Settings ──────────────────────────────────────────────
export const settingsApi = {
  all:     () => api.get('/settings'),
  byGroup: (group: string) => api.get(`/settings/${group}`),
  update:  (settings: Record<string, string>) => api.put('/settings', { settings }),
};

// ── Upload ────────────────────────────────────────────────
export const uploadApi = {
  upload: (file: File, folder?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (folder) fd.append('folder', folder);
    return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
