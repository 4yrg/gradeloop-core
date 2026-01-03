import { create } from 'zustand';

type Role = "SYSTEM_ADMIN" | "INSTITUTE_ADMIN" | "INSTRUCTOR" | "STUDENT";

interface AuthState {
    actingRole: Role | null;
    setActingRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    actingRole: null, // Default to session role
    setActingRole: (role) => set({ actingRole: role }),
}));
