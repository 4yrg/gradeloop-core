
import { MOCK_ASSIGNMENTS, MOCK_COURSES, MOCK_SUBMISSIONS, MOCK_USERS } from './mocks';

export const InstructorService = {
    getCourses: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_COURSES;
    },

    getCourseStudents: async (courseId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Mocking finding students enrolled
        return MOCK_USERS.filter(u => u.role === 'student');
    },

    createAssignment: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Created assignment:", data);
        return { success: true, id: 'new-id-' + Date.now() };
    },

    getSubmissionsForAssignment: async (assignmentId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SUBMISSIONS.filter(s => s.assignmentId === assignmentId);
    }
};
