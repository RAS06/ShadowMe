import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token automatically if available
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('sm_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      // ignore localStorage errors in unusual environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized response handler - do not swallow errors here
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Normalize common axios error shapes
    if (error.response) {
      // Server responded with a status outside 2xx
      return Promise.reject(error);
    }
    // Network / timeout / CORS
    return Promise.reject(error);
  }
);

export default api;
