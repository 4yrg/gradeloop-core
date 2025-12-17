
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
    avatar?: string;
}

export interface Course {
    id: string;
    code: string;
    name: string;
    description: string;
    instructorId: string;
    semester: string;
    credits: number;
    enrolledCount: number;
    thumbnail?: string;
    progress?: number; // 0-100 for students
}

export interface Assignment {
    id: string;
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'open' | 'closed' | 'draft';
    type: 'individual' | 'group';
    points: number;
    language?: string;
    timeLimit?: number;
    aiAssistanceEnabled?: boolean;
    cipasEnabled?: boolean;
    allowResubmissions?: boolean;
    maxResubmissions?: number;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    submittedAt: string;
    status: 'graded' | 'pending' | 'submitted';
    grade?: number;
    feedback?: string;
    plagiarismScore?: number; // 0-100
    aiLikelihood?: number; // 0-100
}

// MOCK DATA

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Alice Student', email: 'alice@student.slit.lk', role: 'student', avatar: 'https://github.com/shadcn.png' },
    { id: 'u2', name: 'Dr. John Smith', email: 'john@slit.lk', role: 'instructor', avatar: 'https://github.com/shadcn.png' },
    { id: 'u3', name: 'Admin User', email: 'admin@slit.lk', role: 'admin' },
];

export const MOCK_COURSES: Course[] = [
    {
        id: 'c1', code: 'IT1030', name: 'Mathematics for Computing', description: 'Fundamental math concepts for CS.',
        instructorId: 'u2', semester: '2022/OCT', credits: 4, enrolledCount: 150, progress: 45
    },
    {
        id: 'c2', code: 'SE3040', name: 'Advanced Software Engineering', description: 'Design patterns and architecture.',
        instructorId: 'u2', semester: '2023/JAN', credits: 4, enrolledCount: 80, progress: 10
    },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: 'a1', courseId: 'c1', title: 'Calculus Quiz 1', description: 'Solve problems 1-10.',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        status: 'open', type: 'individual', points: 100,
        language: 'Python',
        timeLimit: 5000,
        aiAssistanceEnabled: true,
        cipasEnabled: true,
        allowResubmissions: true,
        maxResubmissions: 3
    },
    {
        id: 'a2', courseId: 'c2', title: 'Design Pattern Implementation', description: 'Implement Factory pattern.',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        status: 'closed', type: 'individual', points: 50,
        language: 'Java',
        timeLimit: 10000,
        aiAssistanceEnabled: false,
        cipasEnabled: true,
        allowResubmissions: false,
        maxResubmissions: 0
    }
];

export const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: 's1', assignmentId: 'a2', studentId: 'u1', submittedAt: new Date(Date.now() - 90000000).toISOString(),
        status: 'graded', grade: 85, feedback: 'Good job, but check the singleton implementation.',
        plagiarismScore: 12, aiLikelihood: 5
    }
];

export interface Announcement {
    id: string;
    courseId: string;
    title: string;
    content: string;
    instructorId: string;
    date: string;
    attachments?: string[];
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'assignment' | 'exam' | 'session' | 'other';
    courseId?: string;
    description?: string;
}

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'ann1', courseId: 'c1', title: 'Midterm Exam Schedule', content: ' The midterm exam will be held on Oct 25th in Main Hall.', instructorId: 'u2', date: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'ann2', courseId: 'c2', title: 'Lecture Cancelled', content: 'Todays lecture is cancelled due to illness.', instructorId: 'u2', date: new Date(Date.now() - 86400000 * 5).toISOString()
    }
];

export const MOCK_EVENTS: CalendarEvent[] = [
    ...MOCK_ASSIGNMENTS.map(a => ({
        id: `evt-${a.id}`,
        title: `Due: ${a.title}`,
        date: new Date(a.dueDate),
        type: 'assignment' as const,
        courseId: a.courseId,
        description: 'Assignment Deadline'
    })),
    {
        id: 'evt-1', title: 'Calculus Review Session', date: new Date(Date.now() + 86400000), type: 'session', courseId: 'c1'
    },
    {
        id: 'evt-2', title: 'System Maintenance', date: new Date(Date.now() + 86400000 * 3), type: 'other', description: 'GradeLoop maintenance'
    }
];

// ============================================
// INSTRUCTOR-SPECIFIC INTERFACES & MOCK DATA
// ============================================

export interface RubricCriterion {
    id: string;
    name: string;
    description: string;
    weight: number; // percentage
    autoGrade: boolean;
}

export interface TestCase {
    id: string;
    assignmentId: string;
    type: 'text' | 'code';
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    points: number;
}

export interface DetailedSubmission extends Submission {
    files: { name: string; content: string; language: string }[];
    testResults: {
        testId: string;
        passed: boolean;
        actualOutput?: string;
        executionTime?: number;
    }[];
    rubricScores: {
        criterionId: string;
        score: number;
        comment?: string;
    }[];
    comments: {
        id: string;
        instructorId: string;
        line?: number;
        text: string;
        timestamp: string;
    }[];
}

export interface PlagiarismReport {
    id: string;
    submissionId: string;
    matchedSubmissionId: string;
    similarityPercentage: number;
    matchedBlocks: {
        startLine: number;
        endLine: number;
        matchedCode: string;
    }[];
    status: 'flagged' | 'reviewed' | 'false-positive';
    reviewedBy?: string;
    reviewNotes?: string;
}

export interface AIFeedback {
    id: string;
    submissionId: string;
    overallFeedback: string;
    totalGrade: number;
    confidence: number;
    needsReview: boolean;
    reviewReason?: string;
    rubricScores: {
        criterionId: string;
        criterionName: string;
        description: string;
        score: number;
        maxScore: number;
        aiReasoning: string;
    }[];
    strengths: string[];
    improvements: string[];
    aiLikelihood: number; // 0-100
    interactionLog: {
        id: string;
        type: 'student' | 'ai';
        category: string;
        message: string;
        timestamp: string;
    }[];
}

export interface InstructorClass {
    id: string;
    courseId: string;
    batch: string;
    academicYear: string;
    studentCount: number;
    assignmentCount: number;
    status: 'active' | 'archived';
}

// Mock Rubrics
export const MOCK_RUBRICS: Record<string, RubricCriterion[]> = {
    'a1': [
        { id: 'r1', name: 'Correctness', description: 'Solution produces correct output', weight: 40, autoGrade: true },
        { id: 'r2', name: 'Code Quality', description: 'Clean, readable code', weight: 30, autoGrade: false },
        { id: 'r3', name: 'Efficiency', description: 'Optimal time/space complexity', weight: 20, autoGrade: false },
        { id: 'r4', name: 'Documentation', description: 'Comments and documentation', weight: 10, autoGrade: false }
    ],
    'a2': [
        { id: 'r5', name: 'Pattern Implementation', description: 'Correct design pattern usage', weight: 50, autoGrade: false },
        { id: 'r6', name: 'Code Structure', description: 'Proper class hierarchy', weight: 30, autoGrade: false },
        { id: 'r7', name: 'Testing', description: 'Unit tests provided', weight: 20, autoGrade: true }
    ]
};

// Mock Test Cases
export const MOCK_TEST_CASES: TestCase[] = [
    { id: 't1', assignmentId: 'a1', type: 'code', input: '5', expectedOutput: '120', isHidden: false, points: 10 },
    { id: 't2', assignmentId: 'a1', type: 'code', input: '0', expectedOutput: '1', isHidden: false, points: 10 },
    { id: 't3', assignmentId: 'a1', type: 'code', input: '10', expectedOutput: '3628800', isHidden: true, points: 10 },
];

// Mock Detailed Submissions
export const MOCK_DETAILED_SUBMISSIONS: DetailedSubmission[] = [
    {
        id: 's1',
        assignmentId: 'a2',
        studentId: 'u1',
        submittedAt: new Date(Date.now() - 90000000).toISOString(),
        status: 'graded',
        grade: 85,
        feedback: 'Good implementation of Factory pattern. Consider edge cases.',
        plagiarismScore: 12,
        aiLikelihood: 5,
        files: [
            {
                name: 'Factory.java',
                content: `public class ShapeFactory {\n    public Shape getShape(String type) {\n        if(type == null) return null;\n        if(type.equals("CIRCLE")) return new Circle();\n        return null;\n    }\n}`,
                language: 'java'
            }
        ],
        testResults: [
            { testId: 't1', passed: true, actualOutput: '120', executionTime: 45 },
            { testId: 't2', passed: true, actualOutput: '1', executionTime: 42 }
        ],
        rubricScores: [
            { criterionId: 'r5', score: 45, comment: 'Good pattern usage' },
            { criterionId: 'r6', score: 25, comment: 'Structure could be improved' },
            { criterionId: 'r7', score: 15, comment: 'Missing some test cases' }
        ],
        comments: [
            { id: 'c1', instructorId: 'u2', line: 3, text: 'Consider using a map for type lookup', timestamp: new Date().toISOString() }
        ]
    }
];

// Mock Plagiarism Reports
export const MOCK_PLAGIARISM_REPORTS: PlagiarismReport[] = [
    {
        id: 'p1',
        submissionId: 's1',
        matchedSubmissionId: 's2',
        similarityPercentage: 78,
        matchedBlocks: [
            { startLine: 5, endLine: 12, matchedCode: 'public Shape getShape(String type)' }
        ],
        status: 'flagged',
    }
];

// Mock AI Feedback
export const MOCK_AI_FEEDBACK: AIFeedback[] = [
    {
        id: 'ai1',
        submissionId: 's1',
        overallFeedback: 'Good effort. Your implementation of the Factory pattern is correct, but there are some inefficiencies in the Circle class.',
        totalGrade: 85,
        confidence: 92,
        needsReview: false,
        strengths: [
            'Correct implementation of Factory Pattern',
            'Clean code structure',
            'Good error handling'
        ],
        improvements: [
            'Optimize Circle.draw() method',
            'Add more comments for complex logic'
        ],
        rubricScores: [
            {
                criterionId: 'r1',
                criterionName: 'Functionality',
                description: 'Does the code work as expected?',
                score: 45,
                maxScore: 50,
                aiReasoning: 'All test cases passed except for the edge case with zero input.'
            },
            {
                criterionId: 'r2',
                criterionName: 'Code Quality',
                description: 'Is the code readable and maintainable?',
                score: 18,
                maxScore: 20,
                aiReasoning: 'Variable names are descriptive and indentation is consistent.'
            },
            {
                criterionId: 'r6',
                criterionName: 'Structure',
                description: 'code structure',
                score: 22,
                maxScore: 30,
                aiReasoning: 'Code structure is clear but could benefit from better organization'
            }
        ],
        aiLikelihood: 15,
        interactionLog: [
            {
                id: 'int1',
                type: 'student',
                category: 'Question',
                message: 'How do I implement the Factory pattern?',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 'int2',
                type: 'ai',
                category: 'Hint',
                message: 'The Factory pattern involves creating objects without specifying their exact class. Start by defining an interface...',
                timestamp: new Date(Date.now() - 3599000).toISOString()
            }
        ]
    }
];

// Mock Instructor Classes
export const MOCK_INSTRUCTOR_CLASSES: InstructorClass[] = [
    { id: 'ic1', courseId: 'c1', batch: 'Y2.S1', academicYear: '2024/2025', studentCount: 150, assignmentCount: 5, status: 'active' },
    { id: 'ic2', courseId: 'c2', batch: 'Y3.S2', academicYear: '2024/2025', studentCount: 80, assignmentCount: 3, status: 'active' }
];

