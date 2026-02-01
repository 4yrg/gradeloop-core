import { useMutation } from '@tanstack/react-query';
import { login, LoginState } from '../../actions/auth';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'next/navigation';

export function useLogin() {
    // const setAuth = useAuthStore((state) => state.setAuth); 
    // Auth store and redirect are now handled in verify page, not here.
    // This hook just initiates the magic link email.

    return useMutation({
        mutationFn: login,
        // No onSuccess setAuth here.
    });
}
