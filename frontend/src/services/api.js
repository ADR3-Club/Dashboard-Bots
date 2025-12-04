import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  verify: () =>
    api.post('/auth/verify'),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),
};

// Processes API
export const processesAPI = {
  getAll: () =>
    api.get('/processes'),

  getOne: (id) =>
    api.get(`/processes/${id}`),

  getDetails: (id) =>
    api.get(`/processes/${id}/details`),

  restart: (id) =>
    api.post(`/processes/${id}/restart`),

  stop: (id) =>
    api.post(`/processes/${id}/stop`),

  start: (id) =>
    api.post(`/processes/${id}/start`),

  delete: (id) =>
    api.delete(`/processes/${id}`),
};

// Logs API
export const logsAPI = {
  getHistory: (id, lines = 100) =>
    api.get(`/logs/${id}/history`, { params: { lines } }),

  getErrors: (id, lines = 100) =>
    api.get(`/logs/${id}/errors`, { params: { lines } }),

  search: (id, query, type = 'out') =>
    api.post(`/logs/${id}/search`, { query, type }),

  // SSE stream - use EventSource instead
  getStreamUrl: (id) =>
    `${API_URL}/logs/${id}/stream`,

  export: (id, type = 'out') =>
    api.get(`/logs/${id}/export`, {
      params: { type },
      responseType: 'blob',
    }),
};

// Metrics API
export const metricsAPI = {
  getHistory: (id, range = 120) =>
    api.get(`/metrics/${id}`, { params: { range } }),

  getLatest: () =>
    api.get('/metrics/latest'),

  getStats: () =>
    api.get('/metrics/stats'),

  // SSE stream - use EventSource instead
  getStreamUrl: () =>
    `${API_URL}/metrics/stream`,

  clear: () =>
    api.post('/metrics/clear'),
};

// History API
export const historyAPI = {
  getRestarts: (params = {}) =>
    api.get('/history/restarts', { params }),

  getCrashes: (params = {}) =>
    api.get('/history/crashes', { params }),

  getTimeline: (params = {}) =>
    api.get('/history/timeline', { params }),

  getStatistics: (range = '24h') =>
    api.get('/history/statistics', { params: { range } }),

  getRestartCount: (id, range = '24h') =>
    api.get(`/history/restarts/count/${id}`, { params: { range } }),

  markCrashNotified: (id) =>
    api.put(`/history/crashes/${id}/notify`),

  clean: (days = 30) =>
    api.delete('/history/clean', { params: { days } }),
};

// Alerts API
export const alertsAPI = {
  getAlerts: () =>
    api.get('/alerts'),

  getStatistics: () =>
    api.get('/alerts/statistics'),

  getSettings: () =>
    api.get('/alerts/settings'),

  updateSettings: (settings) =>
    api.put('/alerts/settings', settings),

  dismissAlert: (pmId, processName) =>
    api.post(`/alerts/${pmId}/dismiss`, { processName }),

  checkProcess: (pmId, processName) =>
    api.get(`/alerts/check/${pmId}`, { params: { processName } }),
};

// Settings API
export const settingsAPI = {
  getWebhooks: () =>
    api.get('/settings/webhooks'),

  updateWebhooks: (settings) =>
    api.put('/settings/webhooks', settings),

  testWebhook: (type) =>
    api.post('/settings/webhooks/test', { type }),

  getCleanup: () =>
    api.get('/settings/cleanup'),

  updateCleanup: (settings) =>
    api.put('/settings/cleanup', settings),
};

// Users API (admin only)
export const usersAPI = {
  getAll: () =>
    api.get('/users'),

  create: (userData) =>
    api.post('/users', userData),

  update: (id, userData) =>
    api.put(`/users/${id}`, userData),

  delete: (id) =>
    api.delete(`/users/${id}`),
};

// Health check
export const healthAPI = {
  check: () =>
    api.get('/health'),
};

export default api;
