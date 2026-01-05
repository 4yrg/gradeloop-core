import { useMutation } from '@tanstack/react-query';
import { login, LoginState } from '../../actions/auth';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'next/navigation';

export function useLogin() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    return useMutation({
        mutationFn: login,
        onSuccess: (data) => {
            if (data.success && data.token && data.user) {
                setAuth(data.token, data.user);
                // Redirect is handled by the component or here if we prefer centralizing.
                // The Action returns redirectTo.
                if (data.redirectTo) {
                    router.push(data.redirectTo);
                }
            }
        },
    });
}
