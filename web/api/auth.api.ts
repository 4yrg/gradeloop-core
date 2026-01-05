import { apiClient } from "./client";

export interface LoginResponse {
    token: string;
    role: string;
    email: string;
}

export const authApi = {
    // If we were using client-side axios for login:
    // login: (data: LoginCredentials) => apiClient.post<LoginResponse>('/auth/login', data),

    // Example: getMe
    getMe: () => apiClient.get('/auth/me'),

    forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) => apiClient.post('/auth/reset-password', { token, newPassword }),
};
