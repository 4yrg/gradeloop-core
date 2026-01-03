import { ClassGroup, Person } from "../types";
import { MOCK_CLASSES } from "../data/mock-classes";
import { MOCK_PEOPLE } from "../data/mock-people";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const classesService = {
    getClassesForDegree: async (degreeId: string): Promise<ClassGroup[]> => {
        await delay(600);
        // In a real app, this would query by degreeId. 
        // For mock, we'll return all if degreeId matches, or some random ones if mock IDs don't align perfectly yet.
        return MOCK_CLASSES.filter(c => c.degreeId === degreeId || !c.degreeId);
    },

    createClass: async (data: ClassGroup): Promise<ClassGroup> => {
        await delay(800);
        return {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
            studentCount: 0,
        };
    },

    updateClass: async (id: string, data: Partial<ClassGroup>): Promise<ClassGroup> => {
        await delay(500);
        return {
            id,
            name: data.name || "Updated Class",
            degreeId: data.degreeId || "",
            studentCount: data.studentCount || 0,
        };
    },

    getClassById: async (id: string): Promise<ClassGroup | undefined> => {
        await delay(500);
        return MOCK_CLASSES.find(c => c.id === id);
    },

    getStudentsForClass: async (classId: string): Promise<Person[]> => {
        await delay(600);
        // Mocking return of random students for now
        return MOCK_PEOPLE.filter(p => p.role === "student");
    },

    importStudents: async (classId: string, students: Partial<Person>[]): Promise<void> => {
        await delay(1500);
        // Mock success
    },

    addStudentsToClass: async (classId: string, studentIds: string[]): Promise<void> => {
        await delay(800);
        // Mock success
    },

    removeStudentFromClass: async (classId: string, studentId: string): Promise<void> => {
        await delay(500);
        // Mock success
    },

    deleteClass: async (id: string): Promise<void> => {
        await delay(500);
    }
};
