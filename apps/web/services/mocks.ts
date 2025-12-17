
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
        status: 'open', type: 'individual', points: 100
    },
    {
        id: 'a2', courseId: 'c2', title: 'Design Pattern Implementation', description: 'Implement Factory pattern.',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        status: 'closed', type: 'individual', points: 50
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
