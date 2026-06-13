import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://odoo-cafe-pos-81do.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let accessToken = null;
export const setToken = (t) => { accessToken = t; };
export const getToken = () => accessToken || useAuthStore.getState().accessToken;

// Clears persisted auth so GuestGuard sees the user as logged out
const clearAuth = () => {
  try { localStorage.removeItem('cafe-pos-auth'); } catch { }
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken || accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`,
          {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken;
        setToken(newAccessToken);
        useAuthStore.getState().setAuth(useAuthStore.getState().user, newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (err2) {
        // Clear auth state so GuestGuard redirects properly
        setToken(null);
        useAuthStore.getState().logout();
        clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
