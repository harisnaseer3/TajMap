import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // If the response has a structured format with success and data properties,
        // automatically unwrap the data for convenience
        if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
            // Keep the message available if needed
            response.message = response.data.message;
            response.success = response.data.success;

            // Unwrap the data
            response.data = response.data.data;
        }

        return response;
    },
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized
            if (error.response.status === 401) {
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                toast.error('Session expired. Please login again.');
            }

            // Handle 403 Forbidden
            if (error.response.status === 403) {
                toast.error('You do not have permission to perform this action.');
            }

            // Handle 422 Validation Errors
            if (error.response.status === 422) {
                const errors = error.response.data.errors;
                if (errors) {
                    Object.values(errors).forEach(err => {
                        toast.error(err[0]);
                    });
                }
            }

            // Handle 500 Server Error
            if (error.response.status === 500) {
                toast.error('Server error. Please try again later.');
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.');
        }

        return Promise.reject(error);
    }
);

export default api;

// API Services
export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

export const plotService = {
    getAll: (params) => {
        // Remove empty string and null parameters to avoid backend issues
        const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return api.get('/public/plots', { params: cleanParams });
    },
    getOne: (id) => api.get(`/public/plots/${id}`),
    getSectors: () => api.get('/public/plots/meta/sectors'),
    getBlocks: (params) => api.get('/public/plots/meta/blocks', { params }),

    // Admin
    adminGetAll: (params) => {
        // Remove empty string parameters to avoid filtering issues
        const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return api.get('/admin/plots', { params: cleanParams });
    },
    adminCreate: (data) => api.post('/admin/plots', data),
    adminUpdate: (id, data) => api.put(`/admin/plots/${id}`, data),
    adminDelete: (id) => api.delete(`/admin/plots/${id}`),
    adminRestore: (id) => api.post(`/admin/plots/${id}/restore`),
    adminBulkDelete: (ids) => api.post('/admin/plots/bulk-delete', { ids }),
};

export const leadService = {
    submit: (data) => api.post('/public/leads', data),

    // Admin
    adminGetAll: (params) => {
        // Remove empty string parameters to avoid filtering issues
        const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return api.get('/admin/leads', { params: cleanParams });
    },
    adminGetOne: (id) => api.get(`/admin/leads/${id}`),
    adminUpdate: (id, data) => api.put(`/admin/leads/${id}`, data),
    adminDelete: (id) => api.delete(`/admin/leads/${id}`),
    adminAssign: (id, adminUserId) => api.post(`/admin/leads/${id}/assign`, { admin_user_id: adminUserId }),
    adminUpdateStatus: (id, status) => api.post(`/admin/leads/${id}/status`, { status }),
    adminAddNote: (id, note) => api.post(`/admin/leads/${id}/notes`, { note }),
    adminExportCsv: (params) => api.get('/admin/leads/export/csv', { params, responseType: 'blob' }),
    adminExportJson: (params) => api.get('/admin/leads/export/json', { params, responseType: 'blob' }),
};

export const savedPlotService = {
    getAll: () => api.get('/user/saved-plots'),
    save: (plotId) => api.post(`/user/saved-plots/${plotId}`),
    remove: (plotId) => api.delete(`/user/saved-plots/${plotId}`),
};

export const dashboardService = {
    user: () => api.get('/user/dashboard'),
    admin: () => api.get('/admin/analytics/dashboard'),
};

export const analyticsService = {
    dashboard: () => api.get('/admin/analytics/dashboard'),
    monthlyTrends: (months) => api.get('/admin/analytics/monthly-trends', { params: { months } }),
    adminPerformance: () => api.get('/admin/analytics/admin-performance'),
    plotDistribution: () => api.get('/admin/analytics/plot-distribution'),
};

export const mediaService = {
    getAll: (params) => api.get('/admin/media', { params }),
    upload: (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        if (type) formData.append('type', type);
        return api.post('/admin/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    delete: (id) => api.delete(`/admin/media/${id}`),
};

export const settingService = {
    getAll: (params) => api.get('/admin/settings', { params }),
    getByGroup: (group) => api.get(`/public/settings/group/${group}`),
    create: (data) => api.post('/admin/settings', data),
    update: (id, data) => api.put(`/admin/settings/${id}`, data),
    delete: (id) => api.delete(`/admin/settings/${id}`),
    bulkUpdate: (settings) => api.post('/admin/settings/bulk-update', { settings }),
};

export const userService = {
    getAll: (params) => {
        // Remove empty string parameters to avoid filtering issues
        const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return api.get('/admin/users', { params: cleanParams });
    },
    getOne: (id) => api.get(`/admin/users/${id}`),
    create: (data) => api.post('/admin/users', data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`),
};

export const ticketService = {
    // User endpoints
    getAll: (params) => {
        const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return api.get('/user/tickets', { params: cleanParams });
    },
    getOne: (id) => api.get(`/user/tickets/${id}`),
    create: (data) => api.post('/user/tickets', data),
    addReply: (id, message) => api.post(`/user/tickets/${id}/replies`, { message }),

    // Admin endpoints
    adminGetAll: (params) => {
        const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return api.get('/admin/tickets', { params: cleanParams });
    },
    adminGetOne: (id) => api.get(`/admin/tickets/${id}`),
    adminUpdate: (id, data) => api.put(`/admin/tickets/${id}`, data),
    adminDelete: (id) => api.delete(`/admin/tickets/${id}`),
    adminAssign: (id, adminUserId) => api.post(`/admin/tickets/${id}/assign`, { admin_user_id: adminUserId }),
    adminUpdateStatus: (id, status) => api.post(`/admin/tickets/${id}/status`, { status }),
    adminUpdatePriority: (id, priority) => api.post(`/admin/tickets/${id}/priority`, { priority }),
    adminAddReply: (id, message) => api.post(`/admin/tickets/${id}/replies`, { message }),
    adminGetStatistics: () => api.get('/admin/tickets/statistics'),
};