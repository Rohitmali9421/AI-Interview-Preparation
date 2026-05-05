import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

// Users
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats')
};

// Interviews
export const interviewAPI = {
  create: (data) => api.post('/interviews', data),
  start: (id) => api.put(`/interviews/${id}/start`),
  addQuestions: (id, questions) => api.put(`/interviews/${id}/questions`, { questions }),
  submitAnswer: (id, data) => api.put(`/interviews/${id}/answer`, data),
  complete: (id, data) => api.put(`/interviews/${id}/complete`, data),
  getAll: (params) => api.get('/interviews', { params }),
  getOne: (id) => api.get(`/interviews/${id}`),
  getAnalytics: () => api.get('/interviews/analytics')
};

// AI
export const aiAPI = {
  generateQuestions: (data) => api.post('/ai/generate-questions', data),
  evaluateInterview: (data) => api.post('/ai/evaluate-interview', data)
};

// Realtime
export const realtimeAPI = {
  start: (formData) => api.post('/realtime/start', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getNextQuestion: (id, data) => api.post(`/realtime/${id}/next-question`, data)
};

// Admin
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getAnalytics: () => api.get('/admin/analytics'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

export default api;
