import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const isGenericAxiosMessage = (message?: string) =>
  Boolean(message && /^Request failed with status code \d{3}$/i.test(message));

const hasServiceMessage = (error: any) => {
  const serviceMessage = error?.response?.data?.message || error?.response?.data?.error;
  return typeof serviceMessage === 'string' && serviceMessage.trim().length > 0;
};

const sanitizeAxiosError = (error: any) => {
  if (!error) {
    return;
  }

  if (!hasServiceMessage(error) && isGenericAxiosMessage(error.message)) {
    error.message = '';
  }
};

// Request interceptor to add token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    sanitizeAxiosError(error);

    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh-token');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Sign out if refresh fails
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
