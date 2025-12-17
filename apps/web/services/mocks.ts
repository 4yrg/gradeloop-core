
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

    // New Graded Fields
    scoreBreakdown?: {
        objectives: number; // 0-100
        style: number;     // 0-100
        analysis: number;  // 0-100
        overall: number;   // 0-100
    };
    testResults?: {
        passed: number;
        total: number;
        cases: {
            id: string;
            name: string;
            status: 'pass' | 'fail';
            duration: number;
            message?: string;
        }[];
    };
    socraticFeedback?: {
        tier: 1 | 2 | 3 | 4 | 5;
        title: string;
        content: string; // The markdown content
    };
    files?: { // Snapshot of code at submission
        fileName: string;
        content: string;
        language: string;
    }[];
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
        id: 's1',
        assignmentId: 'a2',
        studentId: 'u1',
        submittedAt: new Date(Date.now() - 90000000).toISOString(),
        status: 'graded',
        grade: 85,
        feedback: 'Good job, but check the singleton implementation.',
        plagiarismScore: 12,
        aiLikelihood: 5,
        scoreBreakdown: {
            objectives: 90,
            style: 80,
            analysis: 85,
            overall: 85
        },
        testResults: {
            passed: 4,
            total: 5,
            cases: [
                { id: 't1', name: 'Basic Instantiation', status: 'pass', duration: 12 },
                { id: 't2', name: 'Singleton Property', status: 'pass', duration: 15 },
                { id: 't3', name: 'Thread Safety', status: 'fail', duration: 45, message: 'Race condition detected during concurrent access.' },
                { id: 't4', name: 'Lazy Initialization', status: 'pass', duration: 10 },
                { id: 't5', name: 'Serialization', status: 'pass', duration: 20 }
            ]
        },
        socraticFeedback: {
            tier: 3,
            title: "Code Structure & Style",
            content: `
### Strengths
- **Pattern Implementation:** You correctly implemented the basic Singleton pattern with lazy initialization.
- **Naming Conventions:** Your naming is consistent and follows Python's PEP 8 standards.
- **Error Handling:** Good job raising an exception in \`__init__\` to prevent direct instantiation.

### Areas for Improvement

#### 1. Thread Safety (Critical)
Your current implementation is **not thread-safe**.
\`\`\`python
if Singleton._instance == None:
    # A context switch here could cause two instances to be created!
    Singleton._instance = Singleton()
\`\`\`
*Question:* What happens if two threads enter the \`if\` block at the exact same time?

#### 2. Serialization Support
Standard serialization (pickling) creates a new instance of the class, violating the Singleton property. Use the \`__reduce__\` method to control this.

### Reflection & Next Steps
1.  **Concurrency:** Look into \`threading.Lock\`. How can you use it to synchronize access to \`get_instance\`.
2.  **Testing:** Try writing a test case that spawns 100 threads and asserts \`id(instance1) == id(instance2)\`.
3.  **Alternatives:** Have you considered using a Python module as a Singleton? It's often cleaner and more "Pythonic".

> "The Singleton pattern is often overused. Ensure you truly need a single global point of access before strictly enforcing it."
            `
        },
        files: [
            {
                fileName: "singleton.py",
                language: "python",
                content: `class Singleton:
    _instance = None

    @staticmethod
    def get_instance():
        if Singleton._instance == None:
            Singleton._instance = Singleton()
        return Singleton._instance

    def __init__(self):
        if Singleton._instance != None:
            raise Exception("This class is a singleton!")
        else:
            Singleton._instance = self`
            }
        ]
    },
    {
        id: 's2',
        assignmentId: 'a1',
        studentId: 'u1',
        submittedAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'graded',
        grade: 45,
        feedback: 'Incomplete implementation.',
        plagiarismScore: 0,
        aiLikelihood: 0,
        scoreBreakdown: {
            objectives: 40,
            style: 60,
            analysis: 40,
            overall: 45
        },
        testResults: {
            passed: 2,
            total: 10,
            cases: [
                { id: 't1', name: 'Limit Calculation', status: 'pass', duration: 10 },
                { id: 't2', name: 'Derivative Rule', status: 'fail', duration: 10, message: 'Returned incorrect derivative.' },
            ]
        },
        socraticFeedback: {
            tier: 1,
            title: "Conceptual Understanding",
            content: `
### Observations
- It seems you are struggling with the core concept of derivatives.
- The limit calculation works for simple cases, but fails for complex functions.

### Guidance
- Let's revisit the definition of a derivative as a limit.
- Can you explain in your own words what the "slope of the tangent line" represents?
            `
        },
        files: [
            {
                fileName: "calculus.py",
                language: "python",
                content: `def derivative(f, x):
    return (f(x+h) - f(x)) / h # h is undefined here?`
            }
        ]
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

export interface DetailedSubmission extends Omit<Submission, 'testResults'> {
    files: { fileName: string; content: string; language: string }[];
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
                fileName: 'Factory.java',
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

