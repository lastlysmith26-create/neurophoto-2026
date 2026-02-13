import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Add a request interceptor to include the Auth token
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const modelsApi = {
    getAll: () => api.get('/models'),
    getById: (id) => api.get(`/models/${id}`),
    create: (data) => api.post('/models', data),
    update: (id, data) => api.put(`/models/${id}`, data),
    delete: (id) => api.delete(`/models/${id}`),
};

export const generateApi = {
    generateImage: (formData) => api.post('/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minutes
    }),
    generateVariations: (formData) => api.post('/generate/variations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes
    }),
    generatePreview: (formData) => api.post('/generate/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
    }),
    generateAngles: (formData) => api.post('/generate/angles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
    }),
};

export const historyApi = {
    getAll: () => api.get('/history'),
    delete: (id) => api.delete(`/history/${id}`),
    clearAll: () => api.delete('/history'),
};

export const presetsApi = {
    getAll: () => api.get('/presets'),
};

export default api;
