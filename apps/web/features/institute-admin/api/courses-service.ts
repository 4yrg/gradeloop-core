import { Course, ClassGroup } from "../types";
import { MOCK_COURSES } from "../data/mock-courses";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const coursesService = {
    getCourses: async (): Promise<Course[]> => {
        await delay(500);
        return [...MOCK_COURSES];
    },

    getCoursesForDegree: async (degreeId: string): Promise<Course[]> => {
        await delay(600);
        return MOCK_COURSES.filter(c => c.degreeId === degreeId || !c.degreeId);
    },

    getCourseById: async (id: string): Promise<Course | undefined> => {
        await delay(500);
        return MOCK_COURSES.find(c => c.id === id);
    },

    createCourse: async (data: Omit<Course, "id">): Promise<Course> => {
        await delay(800);
        return {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
        };
    },

    updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
        await delay(600);
        return { id, ...(MOCK_COURSES.find(c => c.id === id) as Course), ...data };
    },

    deleteCourse: async (id: string): Promise<void> => {
        await delay(500);
    },

    assignInstructors: async (courseId: string, instructorIds: string[]): Promise<void> => {
        await delay(800);
        // Mock success
    },

    setModuleLeader: async (courseId: string, instructorId: string): Promise<void> => {
        await delay(500);
        // Mock success
    },

    // Class Management
    getClassesForCourse: async (courseId: string): Promise<ClassGroup[]> => {
        await delay(600);
        // Mock: return a random subset of classes or specific ones for demo
        const { classesService } = await import("./classes-service"); // Avoid circular dep if possible, or just import MOCK directly
        // Simpler: Import MOCK_CLASSES here if not already available, or just use a placeholder logic
        // Since we can't easily import classes-service here due to circular potential, let's assume we fetch all and filter
        // For this mock, let's just return an empty list or a static list.
        // Better: Let's assume the user will implement the service imports.
        // Actually, importing mock data is fine.
        const { MOCK_CLASSES } = await import("../data/mock-classes");
        return MOCK_CLASSES.slice(0, 2); // Return first 2 classes as "enrolled" for demo
    },

    addClassesToCourse: async (courseId: string, classIds: string[]): Promise<void> => {
        await delay(800);
    },

    removeClassFromCourse: async (courseId: string, classId: string): Promise<void> => {
        await delay(500);
    }
};
