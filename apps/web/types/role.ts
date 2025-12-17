export interface Permission {
    id: string
    name: string
    description: string
    category: 'User' | 'Course' | 'Assignment' | 'System'
}

export interface Role {
    id: string
    name: string
    description: string
    permissions: string[] // List of permission IDs
    usersCount: number
}

export const PERMISSIONS: Permission[] = [
    { id: 'user.create', name: 'Create Users', description: 'Can create new users', category: 'User' },
    { id: 'user.edit', name: 'Edit Users', description: 'Can edit existing users', category: 'User' },
    { id: 'user.delete', name: 'Delete Users', description: 'Can delete users', category: 'User' },
    { id: 'course.create', name: 'Create Courses', description: 'Can create new courses', category: 'Course' },
    { id: 'course.view', name: 'View Courses', description: 'Can view all courses', category: 'Course' },
    { id: 'assignment.grade', name: 'Grade Assignments', description: 'Can grade student submissions', category: 'Assignment' },
    { id: 'system.settings', name: 'System Settings', description: 'Can modify system configurations', category: 'System' },
]
