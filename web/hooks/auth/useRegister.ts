import { useMutation } from '@tanstack/react-query';
import { register, login, RegisterState, LoginState } from '../../actions/auth';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'next/navigation';

interface RegisterData {
    name: string;
    email: string;
    role: string;
}

export function useRegister() {
    // const setAuth = useAuthStore((state) => state.setAuth);
    // const router = useRouter();

    return useMutation({
        mutationFn: async (data: RegisterData) => {
            // Step 1: Register (requests confirmation email)
            return await register({
                email: data.email,
                name: data.name,
                role: data.role as any,
            });
        },
        // No auto-login or setAuth. User must check email.
    });
}
