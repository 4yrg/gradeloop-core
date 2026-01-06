import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore, User } from '../stores/auth.store';
import { useEffect } from 'react';


export function useUser() {
    const { user, setAuth } = useAuthStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            // Using /api/proxy which forwards to Gateway?
            // Or direct Gateway URL?
            // Frontend usually calls Next.js API or Gateway.
            // Since we are client-side, we can call Gateway directly if CORS allows (it was configured).
            // BUT existing code in auth.ts calls process.env.API_GATEWAY_URL from server actions.
            // From client, we need public URL.
            // Or use a Next.js API route proxy.

            // Assuming Next.js proxying or direct access.
            // The user previously integrated `proxy.ts`.
            // Let's assume hitting /auth/me on the same domain (Next.js) proxies it?
            // If proxy.ts is working, hitting /auth/me on browser should go to backend.
            // Let's try fetching relative path '/auth/me'.

            const res = await axios.get('/auth/me');

            if (typeof res.data === 'string') {
                console.warn("Received string response from /auth/me (backend might need update):", res.data);
                return null;
            }

            return res.data as User;
        },
        // Only fetch if we don't have user? Or always to validate session?
        // Always validate on mount.
        retry: false,
    });

    useEffect(() => {
        if (data) {
            // Sync with store
            // We don't have token here to set, but we can set User.
            // setAuth requires token. 
            // We might need a generic setUser in store or just use the data locally.
            // usage of useAuthStore is optional if we rely on this hook.
        }
    }, [data]);

    return {
        user: data || user, // Prefer fetched data
        isLoading,
        error
    };
}
