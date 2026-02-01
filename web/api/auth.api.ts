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
    requestMagicLink: (email: string) => apiClient.post('/auth/login', { email }),
    consumeMagicLink: (token: string) => apiClient.post('/auth/magic-link/consume', { token }),

    register: (data: any) => apiClient.post('/auth/register', data),
    verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),

    // Legacy/Unused
    // forgotPassword: ...
    // resetPassword: ...
};
