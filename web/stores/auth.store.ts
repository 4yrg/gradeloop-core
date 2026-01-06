import { create } from 'zustand';

export type Role = "SYSTEM_ADMIN" | "INSTITUTE_ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface User {
    id: string;
    email: string;
    name?: string;
    role: Role;
    image?: string;
    instituteId?: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    actingRole: Role | null;
    setAuth: (token: string, user: User) => void;
    setActingRole: (role: Role) => void;
    logout: () => void;
}

// Helper to get cookie value
const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

// Initialize user from cookies
const initializeUser = (): User | null => {
    const id = getCookie('user_id');
    const email = getCookie('user_email');
    const role = getCookie('user_role') as Role | undefined;
    const name = getCookie('user_name');
    const instituteId = getCookie('institute_id');

    if (email && role) {
        return {
            id: id || '',
            email,
            role,
            name,
            instituteId,
        };
    }
    return null;
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: initializeUser(),
    actingRole: (getCookie('user_role') as Role) || null,
    setAuth: (token, user) => set({ token, user, actingRole: user.role }),
    setActingRole: (role) => set({ actingRole: role }),
    logout: () => set({ token: null, user: null, actingRole: null }),
}));
