export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'late' | 'graded';

export interface Assignment {
    id: string;
    courseId: string;
    title: string;
    status: AssignmentStatus;
    dueDate: string;
    allowedLanguages: string[];
    timeLimit: string;
    memoryLimit: string;
    attemptsRemaining: number;
    totalAttempts: number;
    gradingMethod: 'Auto' | 'Manual' | 'Hybrid';
    latePolicy: string;
    problemStatement: string;
    constraints: string[];
    sampleIO: { input: string; output: string; explanation?: string }[];
    rubric: { criterion: string; points: number }[];
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    score?: number;
    totalScore?: number;
    vivaEnabled?: boolean;
    vivaRequired?: boolean;
    vivaStatus?: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed';
    vivaWeight?: number; // percentage of total grade
}

export const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: 'asgn-1',
        courseId: 'course-1',
        title: 'Data Structures: Balanced Binary Search Trees',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        allowedLanguages: ['Python', 'Java', 'C++'],
        timeLimit: '2.0s',
        memoryLimit: '256MB',
        attemptsRemaining: 3,
        totalAttempts: 5,
        gradingMethod: 'Auto',
        latePolicy: '10% deduction per day, up to 3 days.',
        problemStatement: `# Balanced Binary Search Trees\n\nImplement an AVL tree with the following operations:\n\n1. Insert\n2. Delete\n3. Search\n4. Level-order traversal`,
        constraints: [
            'Number of nodes <= 10^5',
            'Value of each node in range [-10^9, 10^9]',
            'Time complexity for each operation: O(log N)'
        ],
        sampleIO: [
            {
                input: 'insert 10, insert 20, insert 30',
                output: 'Tree adjusted: 20 is root, 10 is left child, 30 is right child.',
                explanation: 'Standard AVL left-left rotation.'
            }
        ],
        rubric: [
            { criterion: 'Implementation of AVL property', points: 40 },
            { criterion: 'Correctness of Search/Insert/Delete', points: 40 },
            { criterion: 'Complexity efficiency', points: 20 }
        ],
        difficulty: 'Medium',
        totalScore: 100,
        vivaEnabled: true,
        vivaRequired: true,
        vivaStatus: 'not_started',
        vivaWeight: 30 // 30% of total grade
    },
    {
        id: 'asgn-2',
        courseId: 'course-1',
        title: 'Algorithms: Dynamic Programming Challenge',
        status: 'not_started',
        dueDate: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours from now
        allowedLanguages: ['Python', 'Java', 'JavaScript'],
        timeLimit: '1.0s',
        memoryLimit: '128MB',
        attemptsRemaining: 5,
        totalAttempts: 5,
        gradingMethod: 'Hybrid',
        latePolicy: 'Late submissions not accepted.',
        problemStatement: 'Solve the Knapsack problem with weights and values...',
        constraints: ['N <= 100', 'W <= 1000'],
        sampleIO: [],
        rubric: [],
        difficulty: 'Hard',
        totalScore: 100
    }
];
