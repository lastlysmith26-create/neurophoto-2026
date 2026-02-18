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
    generateParallel: (formData) => api.post('/generate/parallel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes (4 images)
    }),
    generatePreview: (formData) => api.post('/generate/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
    }),
    generateAngles: (formData) => api.post('/generate/angles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
    }),
    /**
     * Generates parallel images and streams results via callback.
     * @param {FormData} formData - The form data for generation.
     * @param {Function} onImage - Callback for each successful image { url, historyEntry, index }.
     * @param {Function} onError - Callback for errors on specific items.
     * @param {Function} onComplete - Callback when stream ends.
     */
    generateParallelStream: async (formData, onImage, onError, onComplete) => {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const response = await fetch(`${api.defaults.baseURL}/generate/parallel`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // Keep incomplete chunk

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'image') {
                                onImage(data);
                            } else if (data.type === 'error') {
                                onError(data);
                            } else if (data.type === 'done') {
                                // Stream finished
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } finally {
            if (onComplete) onComplete();
        }
    },
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
