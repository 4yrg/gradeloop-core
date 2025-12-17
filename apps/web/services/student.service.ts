
import { MOCK_ASSIGNMENTS, MOCK_COURSES, MOCK_SUBMISSIONS, MOCK_USERS } from './mocks';

export const StudentService = {
    getProfile: async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_USERS.find(u => u.role === 'student');
    },

    getEnrolledCourses: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_COURSES;
    },

    getUpcomingAssignments: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ASSIGNMENTS.filter(a => new Date(a.dueDate) > new Date());
    },

    getCourseAssignments: async (courseId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ASSIGNMENTS.filter(a => a.courseId === courseId);
    },

    getAssignmentDetails: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ASSIGNMENTS.find(a => a.id === id);
    }
};
