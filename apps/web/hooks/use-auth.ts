import { useMutation } from '@tanstack/react-query';
import { LoginValues, ForgotPasswordValues } from '@/schemas/auth';
import { useAuthStore } from '@/store/auth-store';

// Stub API calls
const loginApi = async (data: LoginValues) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (data.email === 'error@example.com') {
        throw new Error('Invalid email or password');
    }

    return {
        id: '1',
        email: data.email,
        name: 'Test User',
        token: 'fake-jwt-token',
    };
};

const forgotPasswordApi = async (data: ForgotPasswordValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
};

export function useLogin() {
    const loginStore = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: loginApi,
        onSuccess: (data) => {
            loginStore({ id: data.id, email: data.email, name: data.name });
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: forgotPasswordApi,
    });
}
