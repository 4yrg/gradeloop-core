import { useMutation } from '@tanstack/react-query';
import { register, login, RegisterState, LoginState } from '../../actions/auth';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'next/navigation';

interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: string;
}

// Combined return type for registration + auto-login flow
type RegisterWithLoginResult = RegisterState | (LoginState & {
    success?: boolean;
    token?: string;
    user?: any;
    redirectTo?: string;
    forceReset?: boolean;
});

export function useRegister() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: RegisterData): Promise<RegisterWithLoginResult> => {
            // Step 1: Register the user via Kong Gateway (/auth/register)
            const registerResult = await register({
                email: data.email,
                name: data.name,
                password: data.password,
                role: data.role as any,
            });

            if (registerResult.errors) {
                return registerResult;
            }

            // Step 2: Auto-login after successful registration via Kong Gateway (/auth/login)
            const loginResult = await login({
                email: data.email,
                password: data.password,
            });

            return loginResult;
        },
        onSuccess: (data) => {
            // If auto-login was successful, set auth state and redirect
            if ('success' in data && data.success && 'token' in data && data.token && 'user' in data && data.user) {
                setAuth(data.token, data.user);
                if ('redirectTo' in data && data.redirectTo) {
                    router.push(data.redirectTo);
                }
            }
        },
    });
}
