export type UserRole = 'student' | 'instructor' | 'admin'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
}

export interface AuthResponse {
    user: User
    token: string
}
