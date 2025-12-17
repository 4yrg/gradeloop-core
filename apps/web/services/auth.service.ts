import { LoginFormValues } from "@/schemas/auth.schema"
import { AuthResponse, UserRole } from "@/types/user"

// Mock delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authService = {
    login: async (data: LoginFormValues): Promise<AuthResponse> => {
        await delay(1000) // Simulate network latency

        // Mock logic for determining role based on email pattern
        let role: UserRole = 'student'
        if (data.email.includes('instructor')) role = 'instructor'
        if (data.email.includes('admin')) role = 'admin'

        // Simulate error for specific email
        if (data.email === 'error@gradeloop.com') {
            throw new Error('Invalid credentials')
        }

        return {
            user: {
                id: '1',
                name: 'John Doe',
                email: data.email,
                role: role,
                avatar: 'https://github.com/shadcn.png',
            },
            token: 'mock-jwt-token',
        }
    },

    forgotPassword: async (email: string): Promise<void> => {
        await delay(1000)
        console.log(`Password reset email sent to ${email}`)
    }
}
