import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

export interface User {
    id: string
    name: string
    email: string
    roles: UserRole[]
    currentRole: UserRole
    avatarUrl?: string
}

interface UserState {
    user: User | null
    isLoading: boolean
    login: (user: User) => void
    logout: () => void
    switchRole: (role: UserRole) => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: {
                id: 'u1', name: 'Dev User', email: 'dev@gradeloop.com',
                roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'], currentRole: 'ADMIN' // Default to ADMIN for review
            },
            isLoading: false,
            login: (user) => set({ user }),
            logout: () => set({ user: null }),
            switchRole: (role) =>
                set((state) => {
                    // Dev override: Allow switching to any role even if user doesn't strictly have it
                    // if (!state.user?.roles.includes(role)) return state
                    if (!state.user) return state
                    return { user: { ...state.user, currentRole: role } }
                }),
        }),
        {
            name: 'gradeloop-user-storage',
        }
    )
)
