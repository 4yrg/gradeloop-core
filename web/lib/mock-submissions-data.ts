// Mock data for student submissions with keystroke authentication

export interface KeystrokeDataPoint {
    timestamp: number;
    confidenceScore: number;
    typingSpeed: number;
    pauseDuration: number;
}

export interface SubmissionAttempt {
    id: string;
    timestamp: string;
    score: number;
    status: 'Graded' | 'Ungraded' | 'Flagged';
    integrityScore: number;
    code: string;
    keystrokeData: KeystrokeDataPoint[];
    language: string;
}

export interface StudentSubmission {
    id: string;
    studentId: string;
    studentName: string;
    attempts: SubmissionAttempt[];
    latestScore: number;
    status: 'Graded' | 'Ungraded' | 'Flagged';
    overallIntegrityScore: number;
}

// Generate realistic keystroke timeline data
const generateKeystrokeTimeline = (duration: number, baseScore: number): KeystrokeDataPoint[] => {
    const points: KeystrokeDataPoint[] = [];
    const segments = 40;
    const variance = 15;
    
    for (let i = 0; i < segments; i++) {
        const timestamp = (duration / segments) * i;
        const randomVariance = (Math.random() - 0.5) * variance;
        const score = Math.max(0, Math.min(100, baseScore + randomVariance));
        
        points.push({
            timestamp,
            confidenceScore: score,
            typingSpeed: 40 + Math.random() * 30,
            pauseDuration: Math.random() * 5
        });
    }
    
    return points;
};

// Sample code submissions
const sampleCode1 = `def bubble_sort(arr):
    """
    Implementation of bubble sort algorithm
    Time Complexity: O(n^2)
    """
    n = len(arr)
    
    for i in range(n):
        # Flag to optimize by detecting if array is already sorted
        swapped = False
        
        for j in range(0, n - i - 1):
            # Compare adjacent elements
            if arr[j] > arr[j + 1]:
                # Swap if they are in wrong order
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        
        # If no swaps occurred, array is sorted
        if not swapped:
            break
    
    return arr

# Test the function
test_array = [64, 34, 25, 12, 22, 11, 90]
result = bubble_sort(test_array.copy())
print("Sorted array:", result)`;

const sampleCode2 = `def binary_search(arr, target):
    """
    Binary search implementation
    Returns index of target if found, -1 otherwise
    """
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test cases
test_arr = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78]
print(binary_search(test_arr, 23))  # Should return 5
print(binary_search(test_arr, 100)) # Should return -1`;

const sampleCode3 = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    
    def insert(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node
    
    def display(self):
        elements = []
        current = self.head
        while current:
            elements.append(str(current.data))
            current = current.next
        return " -> ".join(elements)`;

// Mock student submissions
export const MOCK_STUDENT_SUBMISSIONS: StudentSubmission[] = [
    {
        id: "sub-001",
        studentId: "CS21001",
        studentName: "Alice Johnson",
        latestScore: 92,
        status: "Graded",
        overallIntegrityScore: 95,
        attempts: [
            {
                id: "att-001-1",
                timestamp: "2025-01-05T14:30:00Z",
                score: 85,
                status: "Graded",
                integrityScore: 93,
                code: sampleCode1,
                keystrokeData: generateKeystrokeTimeline(900, 93),
                language: "python"
            },
            {
                id: "att-001-2",
                timestamp: "2025-01-06T09:15:00Z",
                score: 92,
                status: "Graded",
                integrityScore: 95,
                code: sampleCode1,
                keystrokeData: generateKeystrokeTimeline(750, 95),
                language: "python"
            }
        ]
    },
    {
        id: "sub-002",
        studentId: "CS21005",
        studentName: "Bob Smith",
        latestScore: 78,
        status: "Graded",
        overallIntegrityScore: 88,
        attempts: [
            {
                id: "att-002-1",
                timestamp: "2025-01-06T11:20:00Z",
                score: 78,
                status: "Graded",
                integrityScore: 88,
                code: sampleCode2,
                keystrokeData: generateKeystrokeTimeline(1200, 88),
                language: "python"
            }
        ]
    },
    {
        id: "sub-003",
        studentId: "CS21012",
        studentName: "Charlie Brown",
        latestScore: 45,
        status: "Flagged",
        overallIntegrityScore: 42,
        attempts: [
            {
                id: "att-003-1",
                timestamp: "2025-01-04T16:45:00Z",
                score: 30,
                status: "Flagged",
                integrityScore: 38,
                code: sampleCode3,
                keystrokeData: generateKeystrokeTimeline(300, 38),
                language: "python"
            },
            {
                id: "att-003-2",
                timestamp: "2025-01-05T10:30:00Z",
                score: 45,
                status: "Flagged",
                integrityScore: 42,
                code: sampleCode3,
                keystrokeData: generateKeystrokeTimeline(400, 42),
                language: "python"
            }
        ]
    },
    {
        id: "sub-004",
        studentId: "CS21015",
        studentName: "Diana Prince",
        latestScore: 96,
        status: "Graded",
        overallIntegrityScore: 97,
        attempts: [
            {
                id: "att-004-1",
                timestamp: "2025-01-05T13:00:00Z",
                score: 96,
                status: "Graded",
                integrityScore: 97,
                code: sampleCode1,
                keystrokeData: generateKeystrokeTimeline(800, 97),
                language: "python"
            }
        ]
    },
    {
        id: "sub-005",
        studentId: "CS21020",
        studentName: "Eve Martinez",
        latestScore: 0,
        status: "Ungraded",
        overallIntegrityScore: 85,
        attempts: [
            {
                id: "att-005-1",
                timestamp: "2025-01-06T15:00:00Z",
                score: 0,
                status: "Ungraded",
                integrityScore: 85,
                code: sampleCode2,
                keystrokeData: generateKeystrokeTimeline(950, 85),
                language: "python"
            }
        ]
    },
    {
        id: "sub-006",
        studentId: "CS21025",
        studentName: "Frank Wilson",
        latestScore: 55,
        status: "Flagged",
        overallIntegrityScore: 48,
        attempts: [
            {
                id: "att-006-1",
                timestamp: "2025-01-06T08:30:00Z",
                score: 55,
                status: "Flagged",
                integrityScore: 48,
                code: sampleCode1,
                keystrokeData: generateKeystrokeTimeline(250, 48),
                language: "python"
            }
        ]
    },
    {
        id: "sub-007",
        studentId: "CS21030",
        studentName: "Grace Lee",
        latestScore: 88,
        status: "Graded",
        overallIntegrityScore: 91,
        attempts: [
            {
                id: "att-007-1",
                timestamp: "2025-01-05T17:20:00Z",
                score: 88,
                status: "Graded",
                integrityScore: 91,
                code: sampleCode3,
                keystrokeData: generateKeystrokeTimeline(1100, 91),
                language: "python"
            }
        ]
    },
    {
        id: "sub-008",
        studentId: "CS21035",
        studentName: "Henry Chen",
        latestScore: 72,
        status: "Graded",
        overallIntegrityScore: 82,
        attempts: [
            {
                id: "att-008-1",
                timestamp: "2025-01-06T12:00:00Z",
                score: 72,
                status: "Graded",
                integrityScore: 82,
                code: sampleCode2,
                keystrokeData: generateKeystrokeTimeline(1050, 82),
                language: "python"
            }
        ]
    }
];

// Helper function to get flagged submissions (integrity score < 50)
export const getFlaggedSubmissions = () => {
    return MOCK_STUDENT_SUBMISSIONS.filter(
        submission => submission.overallIntegrityScore < 50
    );
};

// Helper function to get submission by student ID
export const getSubmissionByStudentId = (studentId: string) => {
    return MOCK_STUDENT_SUBMISSIONS.find(
        submission => submission.studentId === studentId
    );
};
