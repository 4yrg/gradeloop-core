import { User, UserRole } from "@/types/user"
import { Role } from "@/types/role"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const adminService = {
    getUsers: async (): Promise<User[]> => {
        await delay(800)
        // Mock user list
        return Array.from({ length: 10 }).map((_, i) => ({
            id: `user-${i}`,
            name: `User ${i + 1}`,
            email: `user${i + 1}@gradeloop.com`,
            role: i === 0 ? 'admin' : i < 4 ? 'instructor' : 'student',
            avatar: undefined
        }))
    },

    createUser: async (user: Omit<User, 'id'>) => {
        await delay(1000)
        console.log("Created user:", user)
        return { ...user, id: `new-${Date.now()}` }
    },

    deleteUser: async (id: string) => {
        await delay(500)
        console.log("Deleted user:", id)
        return true
    },

    getRoles: async (): Promise<Role[]> => {
        await delay(800)
        return [
            {
                id: 'admin',
                name: 'Admin',
                description: 'Full system access',
                permissions: ['user.create', 'user.edit', 'user.delete', 'course.create', 'system.settings'],
                usersCount: 2
            },
            {
                id: 'instructor',
                name: 'Instructor',
                description: 'Manage courses and students',
                permissions: ['course.create', 'course.view', 'assignment.grade'],
                usersCount: 15
            },
            {
                id: 'student',
                name: 'Student',
                description: 'View courses and submit assignments',
                permissions: ['course.view'],
                usersCount: 120
            }
        ]
    },

    updateRolePermissions: async (roleId: string, permissions: string[]) => {
        await delay(1000)
        console.log(`Updated role ${roleId} permissions:`, permissions)
        return true
    }
}
