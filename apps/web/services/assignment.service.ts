import { Assignment } from "@/types/assignment"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const assignmentService = {
    getCourseAssignments: async (courseId: string): Promise<Assignment[]> => {
        await delay(600)
        return [
            {
                id: '1',
                title: 'Assignment 1: Array Manipulation',
                description: 'Implement various array sorting formatting algorithms.',
                dueDate: '2024-12-20T23:59:00',
                status: 'Submitted',
                points: 100,
                courseId,
                submissionId: 'sub-1'
            },
            {
                id: '2',
                title: 'Assignment 2: Object Oriented Design',
                description: 'Design a class structure for a library system.',
                dueDate: '2024-12-28T23:59:00',
                status: 'Open',
                points: 100,
                courseId
            },
            {
                id: '3',
                title: 'Mid-term Project',
                description: 'Build a small CLI application using Java.',
                dueDate: '2025-01-15T23:59:00',
                status: 'Open',
                points: 200,
                courseId
            },
            {
                id: '4',
                title: 'Quiz 1: Basics',
                description: 'Multiple choice questions on syntax.',
                dueDate: '2024-11-15T23:59:00',
                status: 'Graded',
                points: 50,
                courseId,
                submissionId: 'sub-4'
            }
        ]
    },

    getCourseDetails: async (courseId: string) => {
        await delay(500)
        return {
            id: courseId,
            code: 'CS101',
            name: 'Introduction to Computer Science',
            description: 'An introductory course to algorithmic thinking and problem solving using Java.',
            instructor: 'Dr. John Smith',
            semester: 'Fall 2024',
        }
    }
}
