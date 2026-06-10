/**
 * HalShield — API service layer.
 * Handles all HTTP requests to the FastAPI backend with JWT auth.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── JWT Token Interceptor ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('halshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('halshield_token');
      localStorage.removeItem('halshield_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ───────────────────────────────────────
export const register = (data) => api.post('/api/register', data);
export const login = (data) => api.post('/api/login', data);

// ─── Analysis Endpoints ───────────────────────────────────
export const analyze = (data) => api.post('/api/analyze', data);
export const getAnalysisRecord = (id) => api.get(`/api/analysis/${id}`);

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
};

// ─── History & Dashboard ──────────────────────────────────
export const getHistory = () => api.get('/api/history');
export const getDashboardData = () => api.get('/api/dashboard-data');

// ─── Settings Endpoints ───────────────────────────────────
export const getSettings = () => api.get('/api/settings');
export const updateSettings = (data) => api.post('/api/settings', data);
export const resetSystemDatabase = () => api.delete('/api/settings/reset');

// ─── System ───────────────────────────────────────────────
export const healthCheck = () => api.get('/health');

export default api;
