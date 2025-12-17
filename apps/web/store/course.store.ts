import { create } from 'zustand'

export interface Course {
    id: string
    code: string
    name: string
    semester: string
    instructor: string
    progress: number
    nextDeadline?: {
        title: string
        date: string
    }
}

interface CourseState {
    courses: Course[]
    setCourses: (courses: Course[]) => void
}

export const useCourseStore = create<CourseState>((set) => ({
    courses: [],
    setCourses: (courses) => set({ courses }),
}))
