import axios from 'axios';
import Cookies from 'js-cookie';

// Create an Axios instance with default configs
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from cookies
    const token = Cookies.get('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // // Handle 401 Unauthorized errors by redirecting to login
    // if (error.response && error.response.status === 401) {
    //   // Only redirect if we're in the browser
    //   if (typeof window !== 'undefined') {
    //     Cookies.remove('token');
    //     window.location.href = '/login';
    //   }
    // }
    
    return Promise.reject(error);
  }
); 