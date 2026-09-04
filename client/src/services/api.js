import axios from 'axios';
import { getBasename } from '../utils/urlHelper';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When viewed from GitHub Pages, communicate with the live Vercel backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return 'https://securefile-transfer-platform.vercel.app/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const base = getBasename();
      const cleanPath = window.location.pathname.replace(base, '');
      const isPublicPath =
        cleanPath.startsWith('/share/') ||
        cleanPath === '/login' ||
        cleanPath === '/register' ||
        cleanPath === '' ||
        cleanPath === '/';

      if (!isPublicPath) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = `${base}/login?expired=true`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
