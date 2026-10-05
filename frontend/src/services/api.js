import axios from 'axios';
import { getToken, logout } from '../utils/auth';

/**
 * Axios instance configured with base URL and JWT interceptor.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ═══════════════ Auth Service ═══════════════
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getUsers: () => api.get('/auth/users'),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUserStatus: (id, isActive) => api.put(`/auth/users/${id}/status`, { isActive }),
};

// ═══════════════ Dashboard Service ═══════════════
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getMonitoring: () => api.get('/dashboard/monitoring'),
};

// ═══════════════ Prosumer Service ═══════════════
export const prosumerService = {
  getAll: () => api.get('/prosumer'),
  getById: (nic) => api.get(`/prosumer/${nic}`),
  getDetails: (nic) => api.get(`/prosumer/${nic}/details`),
  search: (params) => api.get('/prosumer/search', { params }),
  getByStatus: (status) => api.get(`/prosumer/status/${status}`),
  getByNode: (nodeId) => api.get(`/prosumer/node/${nodeId}`),
  create: (data) => api.post('/prosumer', data),
  update: (nic, data) => api.put(`/prosumer/${nic}`, data),
  activate: (nic) => api.put(`/prosumer/${nic}/activate`),
  deactivate: (nic, reason) => api.put(`/prosumer/${nic}/deactivate`, { reason }),
  delete: (nic) => api.delete(`/prosumer/${nic}`),
};

// ═══════════════ Microgrid Service ═══════════════
export const microgridService = {
  getAll: () => api.get('/microgrid'),
  getById: (id) => api.get(`/microgrid/${id}`),
  getByStatus: (status) => api.get(`/microgrid/status/${status}`),
  create: (data) => api.post('/microgrid', data),
  update: (id, data) => api.put(`/microgrid/${id}`, data),
  deactivate: (id) => api.put(`/microgrid/${id}/deactivate`),
  delete: (id) => api.delete(`/microgrid/${id}`),
};

// ═══════════════ Energy Slot Service ═══════════════
export const energySlotService = {
  getAll: () => api.get('/energyslot'),
  getById: (id) => api.get(`/energyslot/${id}`),
  getByStatus: (status) => api.get(`/energyslot/status/${status}`),
  getByProsumer: (id) => api.get(`/energyslot/prosumer/${id}`),
  getByNode: (id) => api.get(`/energyslot/node/${id}`),
  create: (data) => api.post('/energyslot', data),
  update: (id, data) => api.put(`/energyslot/${id}`, data),
  delete: (id) => api.delete(`/energyslot/${id}`),
};

// ═══════════════ Booking Service ═══════════════
export const bookingService = {
  getCurrent: () => api.get('/booking/current'),
  getPending: () => api.get('/booking/pending'),
  getHistory: () => api.get('/booking/history'),
  getById: (id) => api.get(`/booking/${id}`),
  getDetails: (id) => api.get(`/booking/${id}/details`),
  search: (params) => api.get('/booking/search', { params }),
  confirm: (id) => api.put(`/booking/${id}/confirm`),
  complete: (id) => api.put(`/booking/${id}/complete`),
  cancel: (id) => api.put(`/booking/${id}/cancel`),
};

// ═══════════════ Reservation Service ═══════════════
export const reservationService = {
  getAll: () => api.get('/reservation'),
  getById: (id) => api.get(`/reservation/${id}`),
  getDetails: (id) => api.get(`/reservation/${id}/details`),
  getByStatus: (status) => api.get(`/reservation/status/${status}`),
  create: (data) => api.post('/reservation', data),
  update: (id, data) => api.put(`/reservation/${id}`, data),
  confirm: (id) => api.put(`/reservation/${id}/confirm`),
  cancel: (id) => api.put(`/reservation/${id}/cancel`),
  complete: (id) => api.put(`/reservation/${id}/complete`),
  delete: (id) => api.delete(`/reservation/${id}`),
};

export default api;
