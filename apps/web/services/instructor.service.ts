import {
    MOCK_INSTRUCTOR_CLASSES,
    MOCK_COURSES,
    MOCK_ASSIGNMENTS,
    MOCK_DETAILED_SUBMISSIONS,
    MOCK_RUBRICS,
    MOCK_TEST_CASES,
    MOCK_PLAGIARISM_REPORTS,
    MOCK_AI_FEEDBACK,
    MOCK_USERS,
    MOCK_ANNOUNCEMENTS,
    MOCK_SUBMISSIONS
} from './mocks';

export const InstructorService = {
    // Dashboard
    getDashboardSummary: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            activeClasses: MOCK_INSTRUCTOR_CLASSES.filter(c => c.status === 'active').length,
            pendingSubmissions: 12,
            flaggedCases: 3,
            assignmentsRequiringReview: 5
        };
    },

    getNotifications: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { id: 'n1', type: 'submission', message: 'New submission from Alice Student', timestamp: new Date().toISOString(), link: '/instructor/submissions/s1' },
            { id: 'n2', type: 'plagiarism', message: 'High similarity detected in Assignment 2', timestamp: new Date().toISOString(), link: '/instructor/cipas/diff/s1' }
        ];
    },

    getUpcomingEvents: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { id: 'e1', title: 'Calculus Quiz 1 Due', date: new Date(Date.now() + 86400000 * 2).toISOString(), type: 'deadline' },
            { id: 'e2', title: 'Y2.S1 Lecture', date: new Date(Date.now() + 86400000).toISOString(), type: 'class' }
        ];
    },

    // Classes
    getClasses: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_INSTRUCTOR_CLASSES.map(ic => ({
            ...ic,
            course: MOCK_COURSES.find(c => c.id === ic.courseId)
        }));
    },

    getCourses: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_COURSES;
    },

    getClassDetails: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const instructorClass = MOCK_INSTRUCTOR_CLASSES.find(ic => ic.id === id);
        if (!instructorClass) return null;

        return {
            ...instructorClass,
            course: MOCK_COURSES.find(c => c.id === instructorClass.courseId),
            assignments: MOCK_ASSIGNMENTS.filter(a => a.courseId === instructorClass.courseId)
        };
    },

    getCourseStudents: async (courseId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_USERS.filter(u => u.role === 'student');
    },

    getClassAnnouncements: async (classId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const instructorClass = MOCK_INSTRUCTOR_CLASSES.find(ic => ic.id === classId);
        return MOCK_ANNOUNCEMENTS.filter(a => a.courseId === instructorClass?.courseId);
    },

    postAnnouncement: async (classId: string, data: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, id: 'new-ann' };
    },

    // Assignments
    getAllAssignments: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ASSIGNMENTS;
    },

    getAssignmentDetails: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            ...MOCK_ASSIGNMENTS.find(a => a.id === id),
            rubric: MOCK_RUBRICS[id] || [],
            testCases: MOCK_TEST_CASES.filter(t => t.assignmentId === id)
        };
    },

    createAssignment: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Created assignment:", data);
        return { success: true, id: 'new-id-' + Date.now() };
    },

    updateAssignment: async (id: string, data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
    },

    // Submissions & Grading
    getSubmissions: async (filters?: { classId?: string; assignmentId?: string }) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_DETAILED_SUBMISSIONS;
    },

    getSubmissionsForAssignment: async (assignmentId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SUBMISSIONS.filter(s => s.assignmentId === assignmentId);
    },

    getSubmissionDetails: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const submission = MOCK_DETAILED_SUBMISSIONS.find(s => s.id === id);
        if (!submission) return null;

        return {
            ...submission,
            student: MOCK_USERS.find(u => u.id === submission.studentId),
            assignment: MOCK_ASSIGNMENTS.find(a => a.id === submission.assignmentId)
        };
    },

    addComment: async (submissionId: string, comment: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, id: 'new-comment' };
    },

    updateGrade: async (submissionId: string, gradeData: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    },

    // CIPAS
    getCipasSummary: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            totalSubmissions: 150,
            flaggedCount: 8,
            averageSimilarity: 15.5,
            aiGeneratedCount: 3
        };
    },

    getPlagiarismReports: async (filters?: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_PLAGIARISM_REPORTS;
    },

    getPlagiarismDiff: async (submissionId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const report = MOCK_PLAGIARISM_REPORTS.find(r => r.submissionId === submissionId);
        if (!report) return null;

        const submission1 = MOCK_DETAILED_SUBMISSIONS.find(s => s.id === report.submissionId);
        const submission2 = MOCK_DETAILED_SUBMISSIONS.find(s => s.id === report.matchedSubmissionId);

        return {
            report,
            submission1,
            submission2
        };
    },

    markPlagiarism: async (reportId: string, status: string, notes?: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    },

    getStudentCipasProfile: async (studentId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            student: MOCK_USERS.find(u => u.id === studentId),
            flags: MOCK_PLAGIARISM_REPORTS.filter(r => {
                const sub = MOCK_DETAILED_SUBMISSIONS.find(s => s.id === r.submissionId);
                return sub?.studentId === studentId;
            }),
            averageSimilarity: 18.5
        };
    },

    // ACAFS
    getAcafsSummary: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            totalGraded: 120,
            avgAutoGradeAccuracy: 92.5,
            interventionsRequired: 8
        };
    },

    getAcafsSubmission: async (submissionId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            submission: MOCK_DETAILED_SUBMISSIONS.find(s => s.id === submissionId),
            aiFeedback: MOCK_AI_FEEDBACK.find(f => f.submissionId === submissionId)
        };
    },

    // Analytics
    getClassAnalytics: async (classId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            completionRate: 85,
            averageGrade: 78.5,
            gradeDistribution: { A: 20, B: 35, C: 30, D: 10, F: 5 }
        };
    }
};
