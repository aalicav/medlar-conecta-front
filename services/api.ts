import axios from 'axios';

// Create a base API instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle expired token or authentication errors
    // if (error.response && error.response.status === 401) {
    //   // Clear localStorage and redirect to login
    //   if (typeof window !== 'undefined') {
    //     localStorage.removeItem('token');
    //     localStorage.removeItem('user');
    //     window.location.href = '/login';
    //   }
    // }
    
    return Promise.reject(error);
  }
);

// Scheduling Exceptions endpoints
export const getSchedulingExceptions = async (params: Record<string, any> = {}) => {
  return await api.get('/scheduling-exceptions', { params });
};

export const getSchedulingException = async (id: number | string) => {
  return await api.get(`/scheduling-exceptions/${id}`);
};

export const createSchedulingException = async (data: {
  solicitation_id: number;
  provider_type_class: string;
  provider_id: number;
  justification: string;
}) => {
  return await api.post('/scheduling-exceptions', data);
};

export const approveSchedulingException = async (id: number | string) => {
  return await api.post(`/scheduling-exceptions/${id}/approve`);
};

export const rejectSchedulingException = async (id: number | string, data: { rejection_reason: string }) => {
  return await api.post(`/scheduling-exceptions/${id}/reject`, data);
};

export { api }; 