import { create } from 'zustand';

type Role = "SYSTEM_ADMIN" | "INSTITUTE_ADMIN" | "INSTRUCTOR" | "STUDENT";

interface User {
    email: string;
    name?: string;
    role: Role;
}

interface AuthState {
    token: string | null;
    user: User | null;
    actingRole: Role | null;
    setAuth: (token: string, user: User) => void;
    setActingRole: (role: Role) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    actingRole: null,
    setAuth: (token, user) => set({ token, user, actingRole: user.role }),
    setActingRole: (role) => set({ actingRole: role }),
    logout: () => set({ token: null, user: null, actingRole: null }),
}));
