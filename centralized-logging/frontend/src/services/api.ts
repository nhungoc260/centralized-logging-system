import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: string) =>
    api.post('/auth/register', { email, password, name, role }),
  me: () => api.get('/auth/me'),
};

// ---- Logs ----
export const logsAPI = {
  query: (params: Record<string, unknown>) =>
    api.get('/logs', { params }),
  getStats: (hours = 24) =>
    api.get('/logs/stats', { params: { hours } }),
  getServices: () =>
    api.get('/logs/services'),
  ingest: (log: Record<string, unknown>) =>
    api.post('/logs', log),
  getQueueStats: () =>
    api.get('/logs/queue-stats'),
};
