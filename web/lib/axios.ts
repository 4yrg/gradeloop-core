import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptors for auth token if needed
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // const token = useAuthStore.getState().token; // Example integration
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        // Handle global errors (e.g., 401 redirect to login)
        return Promise.reject(error);
    }
);
