import { Course } from "@/store/course.store"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const courseService = {
    getMyCourses: async (): Promise<Course[]> => {
        await delay(800)
        return [
            {
                id: '1',
                code: 'CS101',
                name: 'Introduction to Computer Science',
                semester: 'Fall 2024',
                instructor: 'Dr. Smith',
                progress: 75,
                nextDeadline: {
                    title: 'Assignment 3: Algorithms',
                    date: '2024-12-25',
                }
            },
            {
                id: '2',
                code: 'SE201',
                name: 'Software Engineering Principles',
                semester: 'Fall 2024',
                instructor: 'Prof. Johnson',
                progress: 40,
                nextDeadline: {
                    title: 'Project Proposal',
                    date: '2024-12-28',
                }
            },
            {
                id: '3',
                code: 'DB301',
                name: 'Database Systems',
                semester: 'Fall 2024',
                instructor: 'Dr. Brown',
                progress: 90,
            }
        ]
    },

    getAnnouncements: async () => {
        await delay(500)
        return [
            {
                id: '1',
                title: 'Midterm Exam Schedule',
                course: 'CS101',
                date: '2024-12-15',
                content: 'The midterm exam will be held on...'
            },
            {
                id: '2',
                title: 'Guest Lecture',
                course: 'SE201',
                date: '2024-12-20',
                content: 'We will have a guest lecture from Google...'
            }
        ]
    }
}
