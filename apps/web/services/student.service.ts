
import { MOCK_ASSIGNMENTS, MOCK_COURSES, MOCK_SUBMISSIONS, MOCK_USERS, MOCK_ANNOUNCEMENTS, MOCK_EVENTS } from './mocks';

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
    },

    getAnnouncements: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ANNOUNCEMENTS;
    },

    getCalendarEvents: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_EVENTS;
    },

    getCourseDetails: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_COURSES.find(c => c.id === id);
    },

    getGradedAssignments: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Find assignments that have a graded submission
        const gradedAssignmentIds = MOCK_SUBMISSIONS
            .filter(s => s.status === 'graded')
            .map(s => s.assignmentId);

        return MOCK_ASSIGNMENTS.filter(a => gradedAssignmentIds.includes(a.id));
    },

    getSubmission: async (assignmentId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SUBMISSIONS.find(s => s.assignmentId === assignmentId);
    }
};
